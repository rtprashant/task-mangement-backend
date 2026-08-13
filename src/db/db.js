import pg from "pg";
import dotenv from "dotenv";
dotenv.config({
    path: "./.env",
});
const { Pool } = pg;
console.log("database url", process.env.DATABASE_URL);

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false,
    },
});
export default pool;