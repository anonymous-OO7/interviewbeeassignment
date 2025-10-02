export const JobModel = {
  tableName: "jobs",
  schema: `
    CREATE TABLE IF NOT EXISTS jobs (
      id SERIAL PRIMARY KEY,
      job_title VARCHAR(255),
      company_name TEXT,
      company_rating VARCHAR(50),
      company_reviews VARCHAR(50),
      locations TEXT,
      job_salary VARCHAR(255),
      experience VARCHAR(100),
      full_description TEXT,
      role TEXT,
      department TEXT,
      employment_type TEXT,
      role_category TEXT,
      education_ug TEXT,
      education_pg TEXT,
      key_skills TEXT[], -- store as array
      apply_redirect_url TEXT,
      naukri_url TEXT UNIQUE, -- each job is unique by its URL
      posted_on_listing VARCHAR(100),
      created_at TIMESTAMP DEFAULT NOW()
    );
  `,
};
