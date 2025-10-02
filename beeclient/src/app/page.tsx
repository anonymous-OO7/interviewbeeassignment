"use client";

import JobSearchNumericCodeComponent from "@/components/FilterComponent";
import JobCard from "@/components/JobCard";
import Pagination from "@/components/ui/Pagination";
import { Job } from "@/types";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useCallback } from "react";

interface ApiJob {
  id: number;
  job_title: string;
  company_name: string;
  company_rating: string;
  company_reviews: string;
  locations: string;
  job_salary: string;
  experience: string;
  full_description: string;
  role: string;
  department: string;
  employment_type: string;
  role_category: string;
  education_ug: string;
  education_pg: string;
  key_skills: string[];
  apply_redirect_url: string;
  naukri_url: string;
  posted_on_listing: string;
  created_at: string;
}

interface JobFilterParams {
  workMode?: number[];
  department?: number[];
  location?: number[];
  salary?: number[];
  companyType?: number[];
  roleCategory?: number[];
  education?: number[];
  postedBy?: number[];
  industry?: number[];
  experienceMin: number;
  experienceMax: number;
  search: string;
}

export default function Home() {
  const [jobs, setJobs] = useState<ApiJob[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 5;
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<JobFilterParams>({
    workMode: [],
    department: [],
    location: [],
    salary: [],
    companyType: [],
    roleCategory: [],
    education: [],
    postedBy: [],
    industry: [],
    experienceMin: 0,
    experienceMax: 30,
    search: "",
  });

  const buildApiUrl = useCallback(
    (page: number, currentFilters: JobFilterParams) => {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", postsPerPage.toString());

      if (currentFilters.search) {
        params.set("search", currentFilters.search);
      }

      params.set("experienceMin", String(currentFilters.experienceMin));
      params.set("experienceMax", String(currentFilters.experienceMax));

      (
        [
          "workMode",
          "department",
          "location",
          "salary",
          "companyType",
          "roleCategory",
          "education",
          "postedBy",
          "industry",
        ] as const
      ).forEach((key) => {
        if (currentFilters[key] && currentFilters[key].length > 0) {
          currentFilters[key]?.forEach((value) =>
            params.append(key, String(value))
          );
        }
      });

      return `http://localhost:8080/api/jobs?${params.toString()}`;
    },
    [postsPerPage]
  );

  useEffect(() => {
    if (!searchParams) return;

    const getNumbers = (key: string): number[] =>
      searchParams
        .getAll(key)
        .map((v) => Number(v))
        .filter((n) => !isNaN(n));

    setFilters({
      workMode: getNumbers("workMode"),
      department: getNumbers("department"),
      location: getNumbers("location"),
      salary: getNumbers("salary"),
      companyType: getNumbers("companyType"),
      roleCategory: getNumbers("roleCategory"),
      education: getNumbers("education"),
      postedBy: getNumbers("postedBy"),
      industry: getNumbers("industry"),
      experienceMin: Number(searchParams.get("experienceMin")) || 0,
      experienceMax: Number(searchParams.get("experienceMax")) || 30,
      search: searchParams.get("search") || "",
    });

    const pageFromUrl = Number(searchParams.get("page"));
    if (!isNaN(pageFromUrl) && pageFromUrl > 0) {
      setCurrentPage(pageFromUrl);
    } else {
      setCurrentPage(1);
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      try {
        const url = buildApiUrl(currentPage, filters);
        const res = await fetch(url);

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data: { data: ApiJob[]; total_items: number } = await res.json();
        console.log("✅ API Response:", data);

        const fetchedJobs: ApiJob[] = (data.data || []).map((job: ApiJob) => ({
          ...job,
          key_skills: Array.isArray(job.key_skills) ? job.key_skills : [],
        }));

        setJobs(fetchedJobs);
        setTotalItems(data.total_items || 0);
      } catch (err) {
        console.error("❌ Error fetching jobs:", err);
        setJobs([]);
        setTotalItems(0);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [currentPage, filters, buildApiUrl]);

  useEffect(() => {
    const url = buildApiUrl(currentPage, filters).split("?")[1];

    router.replace(`/?${url}`, { shallow: true });
  }, [filters, currentPage, router, buildApiUrl]);

  const handleFilterUpdate = (newFilters: Partial<JobFilterParams>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  };

  return (
    <div className="font-sans min-h-screen p-8 sm:p-20">
      <h1 className="text-4xl font-extrabold mb-10 text-center text-gray-800">
        Latest Job Listings 💼
      </h1>

      <div className="mb-8 w-full max-w-4xl mx-auto">
        <JobSearchNumericCodeComponent
          currentFilters={filters}
          onFilterChange={handleFilterUpdate}
        />
      </div>

      {loading ? (
        <div className="text-center p-10">
          <p className="text-lg text-blue-600">Loading jobs, please wait...</p>
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center p-10">
          <p className="text-xl text-red-500">
            No jobs found. Try adjusting your search criteria.
          </p>
        </div>
      ) : (
        <div className="space-y-6 w-full max-w-4xl mx-auto">
          {jobs.map((job, index) => (
            <JobCard
              key={job.id ?? `${index}-${job.job_title}`}
              job={job as Job}
              onSave={(id) => console.log("Saved job ID:", id)}
              onViewDetails={(job) =>
                console.log("View details for:", job.job_title)
              }
            />
          ))}
        </div>
      )}

      {totalItems > postsPerPage && (
        <div className="mt-12 flex justify-center">
          <Pagination
            totalPosts={totalItems}
            postsPerPage={postsPerPage}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
}
