import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, PrismaTransaction } from "./generated/prisma/client";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function showTables(prisma: PrismaTransaction) {
  const res = await prisma.$queryRaw<{ relname: string }[]>`
    SELECT relname FROM pg_class
    WHERE relkind = 'r' AND relnamespace = (
      SELECT oid FROM pg_namespace WHERE nspname = 'public'
    )
    ORDER BY relname
  `;
  console.log("Tables:", res.map((r) => r.relname).join(", "));
}

async function doltResetHard(prisma: PrismaTransaction, commit?: string) {
  if (commit) {
    await prisma.$executeRaw`SELECT DOLT_RESET('--hard', ${commit})`;
    console.log("Resetting to commit:", commit);
  } else {
    await prisma.$executeRaw`SELECT DOLT_RESET('--hard')`;
    console.log("Resetting to HEAD");
  }
}

async function main() {
  await prisma.$transaction(async (tx) => {
    await showTables(tx);

    await tx.$executeRaw`DROP TABLE dept_emp`;
    console.log("Dropped table: dept_emp");

    console.log("Oh no! The table is gone.");
    await showTables(tx);

    console.log("Let's call DOLT_RESET() and try again");
    await doltResetHard(tx);

    await showTables(tx);
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });
