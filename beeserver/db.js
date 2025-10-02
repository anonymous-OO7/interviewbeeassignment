import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "beeassignment",
  password: "root",
  port: 5432,
});

// initialize
const initDB = async () => {
  try {
    await pool.query("SELECT NOW()");
    console.log("📦 Database connection successful & ready!");
  } catch (err) {
    console.error("❌ DB Connection Error:", err);
  }
};

await initDB();

export default pool;
