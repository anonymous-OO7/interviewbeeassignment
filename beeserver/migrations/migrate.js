import { UserModel } from "../models/userModel.js";
import { JobModel } from "../models/JobModel.js";

import pool from "../db.js";

export const runMigrations = async () => {
  try {
    console.log(" Running migrations...");

    const models = [UserModel, JobModel];

    for (const model of models) {
      console.log(` Ensuring table: ${model.tableName}`);
      await pool.query(model.schema);
    }

    console.log(" All migrations applied");
  } catch (err) {
    console.error("❌ Migration error:", err);
  }
};
