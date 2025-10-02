import express from "express";
import pool from "../db.js";

const router = express.Router();

const parseStringArray = (queryParam) => {
  if (Array.isArray(queryParam)) {
    return queryParam.map((v) => String(v).trim()).filter((v) => v !== "");
  }
  if (typeof queryParam === "string") {
    return queryParam
      .split(",")
      .map((v) => v.trim())
      .filter((v) => v !== "");
  }
  return [];
};

// GET /api/jobs
router.get("/", async (req, res) => {
  try {
    let {
      limit: limitQuery,
      page: pageQuery,
      search,
      experienceMin,
      experienceMax,
      location,
      department,
      salary,
      roleCategory,
      education,
    } = req.query;

    const limit = parseInt(limitQuery, 10) || 10;
    const page = parseInt(pageQuery, 10) || 1;
    const offset = (page - 1) * limit;

    let whereClauses = [];
    const params = [];
    let paramIndex = 1;

    if (search) {
      whereClauses.push(
        `(job_title ILIKE $${paramIndex} OR full_description ILIKE $${paramIndex} OR company_name ILIKE $${paramIndex})`
      );
      params.push(`%${search}%`);
      paramIndex++;
    }

    const locations = parseStringArray(location);
    if (locations.length > 0) {
      const locationConditions = locations.map(
        () => `locations ILIKE $${paramIndex++}`
      );
      whereClauses.push(`(${locationConditions.join(" OR ")})`);
      locations.forEach((loc) => params.push(`%${loc}%`));
    }

    const departments = parseStringArray(department);
    if (departments.length > 0) {
      const departmentConditions = departments.map(() => `$${paramIndex++}`);
      whereClauses.push(`department IN (${departmentConditions.join(", ")})`);
      params.push(...departments);
    }

    const salaries = parseStringArray(salary);
    if (salaries.length > 0) {
      const salaryConditions = salaries.map(() => `$${paramIndex++}`);
      whereClauses.push(`job_salary IN (${salaryConditions.join(", ")})`);
      params.push(...salaries);
    }

    const roleCategories = parseStringArray(roleCategory);
    if (roleCategories.length > 0) {
      const categoryConditions = roleCategories.map(() => `$${paramIndex++}`);
      whereClauses.push(`role_category IN (${categoryConditions.join(", ")})`);
      params.push(...roleCategories);
    }

    const educationFilters = parseStringArray(education);
    if (educationFilters.length > 0) {
      const educationConditions = educationFilters.map(
        () =>
          `(education_ug ILIKE $${paramIndex} OR education_pg ILIKE $${paramIndex})`
      );
      whereClauses.push(`(${educationConditions.join(" OR ")})`);
      educationFilters.forEach((edu) => params.push(`%${edu}%`));
    }

    const minExp = parseInt(experienceMin, 10);
    const maxExp = parseInt(experienceMax, 10);

    if (!isNaN(minExp) || !isNaN(maxExp)) {
      const expQuery = `(CAST(REGEXP_REPLACE(experience, '(\\d+).*', '\\1') AS INTEGER))`;

      if (!isNaN(minExp) && minExp > 0) {
        whereClauses.push(`${expQuery} >= $${paramIndex++}`);
        params.push(minExp);
      }

      if (!isNaN(maxExp) && maxExp < 30) {
        whereClauses.push(`${expQuery} <= $${paramIndex++}`);
        params.push(maxExp);
      }
    }

    const whereString =
      whereClauses.length > 0 ? " AND " + whereClauses.join(" AND ") : "";

    let query = `
      SELECT *
      FROM jobs
      WHERE 1=1 ${whereString}
    `;
    let countQuery = `
      SELECT COUNT(*) AS total
      FROM jobs
      WHERE 1=1 ${whereString}
    `;

    const totalFilterParams = params.length;

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${
      paramIndex + 1
    }`;

    params.push(limit, offset);

    const [jobsResult, countResult] = await Promise.all([
      pool.query(query, params),
      pool.query(countQuery, params.slice(0, totalFilterParams)),
    ]);

    const totalJobs = parseInt(countResult.rows[0].total, 10);
    const totalPages = Math.ceil(totalJobs / limit);

    res.json({
      message: "success",
      data: jobsResult.rows,
      current_page: page,
      total_pages: totalPages,
      total_items: totalJobs,
    });
  } catch (err) {
    console.error("❌ Error fetching jobs:", err);
    res
      .status(500)
      .json({ message: "Unable to fetch jobs", error: err.message });
  }
});

export default router;
