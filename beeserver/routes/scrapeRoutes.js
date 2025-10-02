import express from "express";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import fs from "fs";
import path from "path";
import pool from "../db.js";

import { fileURLToPath } from "url";

import * as cheerio from "cheerio";

puppeteer.use(StealthPlugin());

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const delay = (ms) => new Promise((res) => setTimeout(res, ms));
const randomDelay = (min, max) => delay(Math.random() * (max - min) + min);

async function loginToNaukri(page) {
  try {
    console.log("🔐 Logging into Naukri...");
    await page.goto("https://www.naukri.com/nlogin/login", {
      waitUntil: "networkidle0",
    });

    console.log("  -> Waiting for login form to appear...");
    await page.waitForSelector("#usernameField", { timeout: 60000 });
    console.log("  -> Login form found.");

    await page.click("#usernameField");
    await page.type("#usernameField", "goholav965@jxbav.com", { delay: 50 });
    await page.click("#passwordField");
    await page.type("#passwordField", "12345678", { delay: 50 });
    console.log("  -> Login form filled.");

    const loginButtonLocator =
      "xpath/ //button[contains(text(), 'Login') and not(contains(text(), 'OTP'))]";
    await page.waitForSelector(loginButtonLocator);
    await page.click(loginButtonLocator);
    console.log("  -> Clicked the login button.");

    console.log("✅ Logged in successfully");
  } catch (error) {
    console.error("❌ Login failed:", error.message);
    throw error;
  }
}

async function extractJobDetail(browser, jobUrl) {
  let detailPage = null;
  try {
    detailPage = await browser.newPage();
    console.log(`  -> Opening job detail page: ${jobUrl}`);
    await detailPage.goto(jobUrl, {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    const applyButtonSelector = "#company-site-button";

    const buttonExists = await detailPage.$(applyButtonSelector);

    await detailPage.waitForSelector("h1", { timeout: 15000 });

    const html = await detailPage.content();
    const $ = cheerio.load(html);

    const jobTitle = $("h1").first().text().trim();
    const companyName = $("div.styles_jd-header-comp-name__MvqAI a")
      .text()
      .trim();
    const companyRating = $("span.styles_amb-rating__4UyFL").text().trim();
    const companyReviews = $("span.styles_amb-reviews__0J1e3").text().trim();
    const jobSalary = $("div.styles_jhc__salary__jdfEC span").text().trim();
    const experience = $("div.styles_jhc__exp__k_giM span").text().trim();
    const locations = $("div.styles_jhc__loc___Du2H a")
      .map((i, el) => $(el).text().trim())
      .get()
      .join(", ");
    const fullDescription = $("div.styles_JDC__dang-inner-html__h0K4t").html();

    const details = {};
    $("div.styles_other-details__oEN4O div.styles_details__Y424J").each(
      (i, el) => {
        const label = $(el).find("label").text().replace(":", "").trim();
        const value = $(el).find("span").text().trim();
        details[label] = value;
      }
    );

    const edu = {};
    $("div.styles_education__KXFkO div.styles_details__Y424J").each((i, el) => {
      const label = $(el).find("label").text().replace(":", "").trim();
      const value = $(el).find("span").text().trim();
      edu[label] = value;
    });

    const keySkills = $("div.styles_key-skill__GIPn_ span")
      .map((i, el) => $(el).text().trim())
      .get();

    let applyRedirectUrl = "";

    if (buttonExists) {
      try {
        const newPagePromise = new Promise((resolve) =>
          browser.once("targetcreated", (target) => resolve(target.page()))
        );

        await detailPage.click(applyButtonSelector);
        console.log("  -> Clicked the apply button.");

        const newPage = await Promise.race([
          newPagePromise,
          delay(10000).then(() => {
            throw new Error("New page wait timeout");
          }),
        ]);

        if (newPage) {
          await newPage.waitForNavigation({
            waitUntil: "networkidle2",
            timeout: 15000,
          });
          applyRedirectUrl = newPage.url();
          console.log(`  -> Captured Apply URL: ${applyRedirectUrl}`);
          await newPage.close();
        } else {
          console.log(
            "⚠️ Apply redirect opened, but failed to capture the new page."
          );
        }
      } catch (e) {
        console.log(
          `⚠️ Apply redirect attempt failed or timed out: ${e.message}`
        );

        if (detailPage.url() !== jobUrl) {
          applyRedirectUrl = detailPage.url();
        }
      }
    } else {
      console.log("⚠️ Apply button not found on job detail page.");
    }

    return {
      jobTitle,
      companyName,
      companyRating,
      companyReviews,
      locations,
      jobSalary,
      experience,
      fullDescription,
      role: details["Role"] || "",
      department: details["Department"] || "",
      employmentType: details["Employment Type"] || "",
      roleCategory: details["Role Category"] || "",
      educationUG: edu["UG"] || "",
      educationPG: edu["PG"] || "",
      keySkills,
      applyRedirectUrl,
      naukriUrl: jobUrl,
    };
  } catch (err) {
    console.error(`❌ Error extracting ${jobUrl}: ${err.message}`);
    return null;
  } finally {
    if (detailPage && !detailPage.isClosed()) {
      await detailPage.close();
    }
  }
}

router.get("/", async (req, res) => {
  console.log("⚡ Scraping started...");
  let browser;
  let page;
  try {
    browser = await puppeteer.launch({
      headless: false,
      slowMo: 50,
      args: ["--no-sandbox", "--disable-dev-shm-usage", "--start-maximized"],
    });
    page = await browser.newPage();

    await loginToNaukri(page);

    console.log(
      "Login successful. Pausing for 3 seconds for session to settle..."
    );
    await delay(3000);

    console.log("Navigating explicitly to the job listings page...");
    const url = "https://www.naukri.com/jobs-in-india";
    await page.goto(url, { waitUntil: "networkidle2" });

    await randomDelay(3000, 6000);

    try {
      console.log("Attempting to sort by date...");
      await page.click("p.sort-droparrow");
      await page.click("ul.sort-droplist li:nth-child(2)");
      console.log("Sorted by date successfully.");
      await randomDelay(3000, 5000);
    } catch (e) {
      console.log("Could not sort by date, continuing without it.");
    }

    const allJobData = [];
    const maxPages = 1;

    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      console.log(`\n--- Scraping Page ${pageNum} ---`);
      await page.waitForSelector("div.srp-jobtuple-wrapper");

      const jobsOnPage = await page.$$eval(
        "div.srp-jobtuple-wrapper",
        (jobArticles) => {
          return jobArticles
            .map((article) => {
              const titleElem = article.querySelector("a.title");
              const postedElem = article.querySelector("span.job-post-day");
              return {
                jobUrl: titleElem ? titleElem.href : null,
                postedOnListing: postedElem ? postedElem.innerText.trim() : "",
              };
            })
            .filter((job) => job.jobUrl);
        }
      );

      console.log(`📌 Found ${jobsOnPage.length} jobs on page ${pageNum}.`);

      for (const job of jobsOnPage) {
        await randomDelay(3000, 6000);
        const detailData = await extractJobDetail(browser, job.jobUrl);

        if (detailData) {
          allJobData.push({
            ...detailData,
            postedOnListing: job.postedOnListing,
          });
        }
      }

      if (pageNum < maxPages) {
        try {
          console.log("Navigating to next page...");
          await page.evaluate(() =>
            window.scrollTo(0, document.body.scrollHeight - 1500)
          );
          await randomDelay(1000, 2000);
          await page.click("a.fright.fs12.btn-small.btn-dark-g");
          await page.waitForNavigation({ waitUntil: "networkidle2" });
        } catch (e) {
          console.log("No 'Next' button found. Ending scrape.");
          break;
        }
      }
    }

    if (allJobData.length > 0) {
      const outDir = path.join(__dirname, "..", "data");
      fs.mkdirSync(outDir, { recursive: true });
      const filePath = path.join(outDir, `Naukri_Jobs_${Date.now()}.json`);
      fs.writeFileSync(filePath, JSON.stringify(allJobData, null, 2));
      console.log(
        `\n Scraping finished. Saved ${allJobData.length} jobs to ${filePath}`
      );

      console.log(" Inserting jobs into database...");
      for (const job of allJobData) {
        try {
          await pool.query(
            `
            INSERT INTO jobs (
              job_title, company_name, company_rating, company_reviews,
              locations, job_salary, experience, full_description,
              role, department, employment_type, role_category,
              education_ug, education_pg, key_skills, apply_redirect_url,
              naukri_url, posted_on_listing
            )
            VALUES (
              $1, $2, $3, $4,
              $5, $6, $7, $8,
              $9, $10, $11, $12,
              $13, $14, $15, $16,
              $17, $18
            )
            ON CONFLICT (naukri_url) DO NOTHING
            `,
            [
              job.jobTitle,
              job.companyName,
              job.companyRating,
              job.companyReviews,
              job.locations,
              job.jobSalary,
              job.experience,
              job.fullDescription,
              job.role,
              job.department,
              job.employmentType,
              job.roleCategory,
              job.educationUG,
              job.educationPG,
              job.keySkills,
              job.applyRedirectUrl,
              job.naukriUrl,
              job.postedOnListing,
            ]
          );
        } catch (dbErr) {
          console.error(
            `❌ DB insert failed for ${job.naukriUrl}:`,
            dbErr.message
          );
        }
      }
      console.log(" All jobs inserted into database.");
    } else {
      console.log("\n❌ No job data collected.");
    }

    await browser.close();
    res.json({
      success: true,
      message: `Scraping finished. Found ${allJobData.length} valid jobs.`,
      total: allJobData.length,
      data: allJobData,
    });
  } catch (err) {
    console.error("❌ A fatal error occurred during the scrape:", err);

    if (page) {
      const errorScreenshotPath = path.join(
        __dirname,
        "..",
        "data",
        "error_screenshot.png"
      );
      fs.mkdirSync(path.dirname(errorScreenshotPath), { recursive: true });
      await page.screenshot({ path: errorScreenshotPath, fullPage: true });
      console.log(
        `📸 Screenshot of the error page saved to: ${errorScreenshotPath}`
      );
    }

    if (browser) await browser.close();
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
