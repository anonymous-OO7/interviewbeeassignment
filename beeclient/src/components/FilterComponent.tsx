"use client";

import React, { useState, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { options } from "../data/index";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

export interface FilterOption {
  label: string;
  value: number;
}

export interface OptionsMap {
  workMode: FilterOption[];
  department: FilterOption[];
  location: FilterOption[];
  salary: FilterOption[];
  companyType: FilterOption[];
  roleCategory: FilterOption[];
  education: FilterOption[];
  postedBy: FilterOption[];
  industry: FilterOption[];
}

interface ParamCodes {
  workMode: number;
  department: number;
  location: number;
  salary: number;
  companyType: number;
  roleCategory: number;
  education: number;
  postedBy: number;
  industry: number;
  experienceMin: string;
  experienceMax: string;
}

interface JobSearchNumericCodeComponentProps {
  onSearch?: (url: string) => void;
}

interface FilterCategory {
  key: keyof OptionsMap | "experience";
  label: string;
  options: FilterOption[];
  selected: number[];
  setSelected: React.Dispatch<React.SetStateAction<number[]>>;
}

const baseBtn: React.CSSProperties = {
  border: "none",
  borderRadius: "100px",
  cursor: "pointer",
  padding: "6px 12px",
  fontSize: "0.875rem",
  fontWeight: 500,
  background: "#f7f7f7",
  color: "#007aff",
};

const primaryBtn: React.CSSProperties = {
  ...baseBtn,
  background: "#007aff",
  color: "#fff",
};

const dangerBtn: React.CSSProperties = {
  ...baseBtn,
  background: "#fff",
  color: "#ff3b30",
};

const typedOptions = options as OptionsMap;

const FilterModal: React.FC<{
  open: boolean;
  onClose: () => void;
  filters: FilterCategory[];
  onApply: () => void;
  onClear: () => void;
  experience: [number, number];
  onExpMinChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onExpMaxChange: (e: ChangeEvent<HTMLInputElement>) => void;
}> = ({
  open,
  onClose,
  filters,
  onApply,
  onClear,
  experience,
  onExpMinChange,
  onExpMaxChange,
}) => {
  const [activeKey, setActiveKey] = useState<keyof OptionsMap | "experience">(
    filters[0]?.key || "experience"
  );
  if (!open) return null;

  const activeCategory = filters.find((f) => f.key === activeKey);

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0,0,0,0.3)",
          zIndex: 999,
        }}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Filter modal"
        style={{
          position: "fixed",
          top: "5vh",
          left: "50%",
          transform: "translateX(-50%)",
          width: "95%",
          maxWidth: "600px",
          height: "90vh",
          background: "#fff",
          borderRadius: "12px",
          zIndex: 1000,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
          <div
            style={{
              width: "35%",
              borderRight: "1px solid #eee",
              overflowY: "auto",
            }}
          >
            {[
              ...filters,
              {
                key: "experience",
                label: "Experience",
                options: [],
                selected: [],
                setSelected: () => {},
              },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setActiveKey(f.key)}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "12px",
                  background: f.key === activeKey ? "#007aff" : "#fff",
                  color: f.key === activeKey ? "#fff" : "#333",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                  fontWeight: f.key === activeKey ? 600 : 500,
                }}
              >
                {f.label}
                {f.selected?.length > 0 && ` (${f.selected.length})`}
              </button>
            ))}
          </div>

          <div
            style={{
              width: "65%",
              padding: "12px",
              overflowY: "auto",
              maxHeight: "100%",
            }}
          >
            {activeKey === "experience" ? (
              <div>
                <label style={{ fontSize: "0.875rem", fontWeight: 500 }}>
                  Experience: {experience[0]}–{experience[1]} yrs
                </label>
                <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
                  <input
                    type="range"
                    min={0}
                    max={30}
                    value={experience[0]}
                    onChange={onExpMinChange}
                    style={{ flex: 1, accentColor: "#007aff" }}
                  />
                  <input
                    type="range"
                    min={0}
                    max={30}
                    value={experience[1]}
                    onChange={onExpMaxChange}
                    style={{ flex: 1, accentColor: "#007aff" }}
                  />
                </div>
              </div>
            ) : (
              activeCategory?.options?.map(({ label, value }) => {
                const checked = activeCategory.selected.includes(value);
                return (
                  <label
                    key={value}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "8px",
                      borderRadius: "6px",
                      background: checked ? "#f0f8ff" : "transparent",
                      marginBottom: "6px",
                      cursor: "pointer",
                      fontSize: "0.9rem",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        activeCategory.setSelected(
                          checked
                            ? activeCategory.selected.filter((v) => v !== value)
                            : [...activeCategory.selected, value]
                        )
                      }
                      style={{ marginRight: "8px" }}
                    />
                    {label}
                  </label>
                );
              })
            )}
          </div>
        </div>

        <div
          style={{
            borderTop: "1px solid #eee",
            padding: "12px",
            display: "flex",
            justifyContent: "flex-end",
            gap: "8px",
            flexShrink: 0,
            background: "#fff",
          }}
        >
          <button style={dangerBtn} onClick={onClear}>
            Clear
          </button>
          <button style={baseBtn} onClick={onClose}>
            Cancel
          </button>
          <button style={primaryBtn} onClick={onApply}>
            Apply
          </button>
        </div>
      </div>
    </>
  );
};

const HorizontalFilterBar: React.FC<{
  filters: FilterCategory[];
  onOpenModal: () => void;
  experience: [number, number];
}> = ({ filters, onOpenModal, experience }) => {
  const total =
    filters.reduce((sum, f) => sum + f.selected.length, 0) +
    (experience[0] > 0 || experience[1] < 30 ? 1 : 0);

  const active = filters.filter((f) => f.selected.length > 0);
  const hasExperience = experience[0] > 0 || experience[1] < 30;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        background: "#fff",
        padding: "6px 12px",
        borderRadius: "8px",
        gap: "6px",
        overflowX: "auto",
      }}
    >
      <button
        onClick={onOpenModal}
        style={{
          ...baseBtn,
          display: "flex",
          alignItems: "center",
          position: "relative",
        }}
      >
        Filters
        {total > 0 && (
          <span
            style={{
              position: "absolute",
              top: -4,
              right: -4,
              background: "#ff3b30",
              color: "#fff",
              borderRadius: "50%",
              width: "16px",
              height: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.75rem",
            }}
          >
            {total}
          </span>
        )}
      </button>

      <div
        className="active-filters-list"
        style={{
          display: "flex",
          overflowX: "auto",
          whiteSpace: "nowrap",
          WebkitOverflowScrolling: "touch",
          padding: "4px 0",
        }}
      >
        {active.map((f) => (
          <button
            key={f.key}
            style={{
              ...primaryBtn,
              display: "inline-block",
              padding: "4px 8px",
              fontSize: "0.75rem",
              marginRight: "8px",
            }}
          >
            {f.label}: {f.selected.length}
          </button>
        ))}

        {hasExperience && (
          <button
            style={{
              ...primaryBtn,
              display: "inline-block",
              padding: "4px 8px",
              fontSize: "0.75rem",
            }}
          >
            Exp: {experience[0]}–{experience} yrs
          </button>
        )}
      </div>
    </div>
  );
};

export default function JobSearchNumericCodeComponent({
  onSearch,
}: JobSearchNumericCodeComponentProps) {
  const router = useRouter();

  const [workMode, setWorkMode] = useState<number[]>([]);
  const [experience, setExperience] = useState<[number, number]>([0, 30]);
  const [department, setDepartment] = useState<number[]>([]);
  const [location, setLocation] = useState<number[]>([]);
  const [salary, setSalary] = useState<number[]>([]);
  const [companyType, setCompanyType] = useState<number[]>([]);
  const [roleCategory, setRoleCategory] = useState<number[]>([]);
  const [education, setEducation] = useState<number[]>([]);
  const [postedBy, setPostedBy] = useState<number[]>([]);
  const [industry, setIndustry] = useState<number[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  const searchParams = useSearchParams();

  useEffect(() => {
    if (!searchParams) return;

    const getNumbers = (key: string): number[] =>
      searchParams
        .getAll(key)
        .map((v) => Number(v))
        .filter((n) => !isNaN(n));

    setWorkMode(getNumbers("workMode"));
    setDepartment(getNumbers("department"));
    setLocation(getNumbers("location"));
    setSalary(getNumbers("salary"));
    setCompanyType(getNumbers("companyType"));
    setRoleCategory(getNumbers("roleCategory"));
    setEducation(getNumbers("education"));
    setPostedBy(getNumbers("postedBy"));
    setIndustry(getNumbers("industry"));

    const expMin = Number(searchParams.get("experienceMin"));
    const expMax = Number(searchParams.get("experienceMax"));
    if (!isNaN(expMin) || !isNaN(expMax)) {
      setExperience([expMin || 0, expMax || 30]);
    }
  }, [searchParams]);

  const clearAll = () => {
    setWorkMode([]);
    setExperience([0, 30]);
    setDepartment([]);
    setLocation([]);
    setSalary([]);
    setCompanyType([]);
    setRoleCategory([]);
    setEducation([]);
    setPostedBy([]);
    setIndustry([]);
  };

  const onExpMinChange = (e: ChangeEvent<HTMLInputElement>) => {
    const v = Math.min(Number(e.target.value), experience[1]);
    setExperience([v, experience[1]]);
  };

  const onExpMaxChange = (e: ChangeEvent<HTMLInputElement>) => {
    const v = Math.max(Number(e.target.value), experience[0]);
    setExperience([experience[0], v]);
  };

  const filters: FilterCategory[] = [
    {
      key: "workMode",
      label: "Work Mode",
      options: typedOptions.workMode,
      selected: workMode,
      setSelected: setWorkMode,
    },
    {
      key: "department",
      label: "Department",
      options: typedOptions.department,
      selected: department,
      setSelected: setDepartment,
    },
    {
      key: "location",
      label: "Location",
      options: typedOptions.location,
      selected: location,
      setSelected: setLocation,
    },
    {
      key: "salary",
      label: "Salary",
      options: typedOptions.salary,
      selected: salary,
      setSelected: setSalary,
    },

    {
      key: "roleCategory",
      label: "Role Category",
      options: typedOptions.roleCategory,
      selected: roleCategory,
      setSelected: setRoleCategory,
    },

    {
      key: "industry",
      label: "Industry",
      options: typedOptions.industry,
      selected: industry,
      setSelected: setIndustry,
    },
  ];

  function buildQuery(params: Record<string | number, any>) {
    return Object.entries(params)
      .flatMap(([k, v]) =>
        Array.isArray(v)
          ? v.map((x) => `${k}=${encodeURIComponent(x)}`)
          : v || v === 0
          ? [`${k}=${encodeURIComponent(v)}`]
          : []
      )
      .join("&");
  }

  const applyFilters = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const p: Record<string, any> = {};
    if (workMode.length) p["workMode"] = workMode;
    p["experienceMin"] = experience[0];
    p["experienceMax"] = experience[1];
    if (department.length) p["department"] = department;
    if (location.length) p["location"] = location;
    if (salary.length) p["salary"] = salary;
    if (companyType.length) p["companyType"] = companyType;
    if (roleCategory.length) p["roleCategory"] = roleCategory;
    if (education.length) p["education"] = education;
    if (postedBy.length) p["postedBy"] = postedBy;
    if (industry.length) p["industry"] = industry;

    const qs = buildQuery(p);
    const url = `/?${qs}&src=filters`;
    router.replace(url, undefined);
    onSearch?.(url);
    setModalOpen(false);
  };

  return (
    <>
      <HorizontalFilterBar
        filters={filters}
        onOpenModal={() => setModalOpen(true)}
        experience={experience}
      />

      <FilterModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        filters={filters}
        onApply={applyFilters}
        onClear={clearAll}
        experience={experience}
        onExpMinChange={onExpMinChange}
        onExpMaxChange={onExpMaxChange}
      />
    </>
  );
}
