"use client";

import React from "react";
import { formatDistanceToNow } from "date-fns";
import { CiLocationOn } from "react-icons/ci";
import {
  Building2Icon,
  BriefcaseIcon,
  DollarSignIcon,
  Bookmark,
} from "lucide-react";
import { Job } from "@/types";

interface CardProps {
  job: Job;
  onSave?: (id: number) => void;
  onViewDetails?: (job: Job) => void;
  isSaved?: boolean;
}

const JobCard: React.FC<CardProps> = ({
  job,
  onSave,
  onViewDetails,
  isSaved = false,
}) => {
  const postedDate = React.useMemo(() => {
    try {
      if (job.created_at) {
        return formatDistanceToNow(new Date(job.created_at), {
          addSuffix: true,
        });
      }
      if (job.posted_on_listing) {
        return job.posted_on_listing;
      }
    } catch (error) {
      // console.error("Error formatting date:", error);
    }
    return "Unknown time";
  }, [job.created_at, job.posted_on_listing]);

  const parsedSkills: string[] = React.useMemo(() => {
    if (Array.isArray(job.key_skills)) {
      return job.key_skills.slice(0, 3);
    }
    return [];
  }, [job.key_skills]);

  const handleApply = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = job.apply_redirect_url || job.naukri_url;
    if (url) window.open(url, "_blank");
  };

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSave && onSave(job.id);
  };

  return (
    <div
      className="p-4 rounded-2xl border shadow-sm bg-white hover:shadow-lg transition duration-200 cursor-pointer"
      onClick={() => onViewDetails && onViewDetails(job)}
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 leading-tight">
            {job.job_title}
          </h3>
          <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
            <Building2Icon size={14} className="text-gray-500" />
            <span className="truncate max-w-[200px]">{job.company_name}</span>
          </div>
        </div>

        <div className="flex-shrink-0">
          <button
            onClick={handleSave}
            aria-label="Save Job"
            className="p-1 rounded-full text-gray-500 hover:text-blue-500 transition"
          >
            <Bookmark
              size={24}
              fill={isSaved ? "currentColor" : "none"}
              className={isSaved ? "text-blue-500" : "text-gray-500"}
            />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4 text-sm text-gray-700">
        <div className="flex items-center gap-1.5">
          <BriefcaseIcon size={16} className="text-gray-500" />
          <span>{job.experience || "N/A"} Yrs</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CiLocationOn className="text-gray-500 text-lg" />
          <span className="truncate max-w-[100px]">
            {job.locations?.split(",")[0].trim() || "N/A"}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <DollarSignIcon size={16} className="text-gray-500" />
          <span>{job.job_salary || "Not Disclosed"}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-gray-500">🏢</span>
          <span>{job.employment_type?.split(",")[0].trim() || "N/A"}</span>
        </div>
      </div>

      {parsedSkills.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3 text-xs text-gray-600">
          {parsedSkills.map((skill, i) => (
            <span
              key={`${skill}-${i}`}
              className="bg-gray-100 px-2 py-0.5 rounded-md font-medium"
            >
              {skill}
            </span>
          ))}
        </div>
      )}

      <div className="flex justify-between items-center mt-4 pt-2 border-t border-gray-100 text-xs text-gray-500">
        <span>Posted {postedDate}</span>
        <div className="flex gap-3 items-center">
          {(job.apply_redirect_url || job.naukri_url) && (
            <button
              onClick={handleApply}
              className="px-4 py-1.5 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition shadow-md"
            >
              Apply Now
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobCard;
