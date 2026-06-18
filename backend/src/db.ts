import { Pool } from "pg";

const myPool = new Pool({ connectionString: process.env.DATABASE_URL });

export default myPool;