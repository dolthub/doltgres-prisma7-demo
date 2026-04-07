import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, PrismaTransaction, Prisma } from "./generated/prisma/client";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

interface DoltStatus {
  table_name: string;
  staged: number;
  status: string;
}

interface CommitLog {
  commit_hash: string;
  committer: string;
  message: string;
}

interface DoltBranch {
  name: string;
}

export async function printStatus(prisma: PrismaTransaction) {
  const res = await prisma.$queryRaw<DoltStatus[]>`SELECT * FROM dolt_status`;
  console.log("Status:");
  if (res.length === 0) {
    console.log("  No tables modified");
  } else {
    res.forEach((row) => console.log(`  ${row.table_name}: ${row.status}`));
  }
}

export async function printCommitLog(prisma: PrismaTransaction) {
  const res = await prisma.$queryRaw<CommitLog[]>`
    SELECT commit_hash, committer, message FROM dolt_log ORDER BY date DESC
  `;
  console.log("Commit log:", res);
}

export async function doltCommit(
  prisma: PrismaTransaction,
  author: string,
  msg: string
) {
  const result = await prisma.$executeRaw`SELECT DOLT_COMMIT('--author', ${author}, '-Am', ${msg})`;
  console.log("Created commit:", result);
}

export async function getBranch(prisma: PrismaTransaction, branch: string) {
  return prisma.$queryRaw<DoltBranch[]>`SELECT name FROM dolt_branches WHERE name = ${branch}`;
}

export async function createBranch(prisma: PrismaTransaction, branch: string) {
  const res = await getBranch(prisma, branch);
  if (res && res.length > 0) {
    console.log("Branch exists:", branch);
  } else {
    await prisma.$executeRaw`SELECT DOLT_BRANCH(${branch})`;
    console.log("Created branch:", branch);
  }
}

export async function checkoutBranch(prisma: PrismaTransaction, branch: string) {
  await prisma.$executeRaw`SELECT DOLT_CHECKOUT(${branch})`;
  console.log("Using branch:", branch);
}

export async function printActiveBranch(prisma: PrismaTransaction) {
  const res = await prisma.$queryRaw<{ active_branch: string }[]>`SELECT active_branch()`;
  console.log("Active branch:", res[0]?.active_branch);
}

export async function printDiff(prisma: PrismaTransaction, table: string) {
  const query = Prisma.sql`SELECT * FROM ${Prisma.raw("dolt_diff_" + table)} WHERE to_commit = 'WORKING'`;
  const res = await prisma.$queryRaw(query);
  console.log(`Diff for ${table}:`, res);
}

export async function doltMerge(prisma: PrismaTransaction, branch: string) {
  await prisma.$executeRaw`SELECT DOLT_MERGE(${branch})`;
  console.log("Merge complete for:", branch);
}

async function addIntern(prisma: PrismaTransaction) {
  const nathan = await prisma.employee.upsert({
    where: { emp_no: 5 },
    update: {},
    create: {
      emp_no: 5,
      first_name: "Nathan",
      last_name: "Gabrielson",
      birth_date: new Date("2000-01-01"),
      hire_date: new Date("2026-04-06"),
      dept_emps: {
        create: [{
          dept_no: "d001", // Engineering
          from_date: new Date("2026-04-06"),
          to_date: new Date("9999-01-01"),
        }],
      },
    },
  });
  console.log("Added intern:", nathan);
}

async function updateEmployees(prisma: PrismaClient) {
  await prisma.$transaction(async (tx) => {
    await createBranch(tx, "add-intern");
    await checkoutBranch(tx, "add-intern");
    await addIntern(tx);
    await printStatus(tx);
    await doltCommit(tx, "Nathan Gabrielson <nathan@dolthub.com>", "Add intern Nathan Gabrielson");
  });
  console.log("All operations completed successfully.");
}

async function mergeBranch(prisma: PrismaClient) {
  await prisma.$transaction(async (tx) => {
    await checkoutBranch(tx, "main");
    await printActiveBranch(tx);
    await doltMerge(tx, "add-intern");
    await printCommitLog(tx);
  });
  console.log("Merge completed successfully.");
}

async function main() {
  await doltCommit(prisma, "Nathan <nathan@dolthub.com>", "Create tables and data");
  await printStatus(prisma);
  await printCommitLog(prisma);
  await updateEmployees(prisma);
  await printDiff(prisma, "employees");
  await mergeBranch(prisma);
  await printCommitLog(prisma);
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

