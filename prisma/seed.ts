import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Upsert Departments
  const engineering = await prisma.department.upsert({
    where: { dept_no: "d001" },
    update: {},
    create: {
      dept_no: "d001",
      dept_name: "Engineering",
    },
  });

  const sales = await prisma.department.upsert({
    where: { dept_no: "d002" },
    update: {},
    create: {
      dept_no: "d002",
      dept_name: "Sales",
    },
  });

  // Upsert Employees
  const tim = await prisma.employee.upsert({
    where: { emp_no: 1 },
    update: {},
    create: {
      emp_no: 1,
      first_name: "Tim",
      last_name: "Sehn",
      birth_date: new Date("1980-01-01"),
      hire_date: new Date("2010-06-15"),
      dept_emps: {
        create: [
          {
            dept_no: engineering.dept_no,
            from_date: new Date("2010-06-15"),
            to_date: new Date("9999-01-01"),
          },
          {
            dept_no: sales.dept_no,
            from_date: new Date("2010-06-15"),
            to_date: new Date("9999-01-01"),
          },
        ],
      },
    },
  });

  const brian_f = await prisma.employee.upsert({
    where: { emp_no: 2 },
    update: {},
    create: {
      emp_no: 2,
      first_name: "Brian",
      last_name: "Fitzgerald",
      birth_date: new Date("1985-03-22"),
      hire_date: new Date("2012-09-01"),
      dept_emps: {
        create: [
          {
            dept_no: sales.dept_no,
            from_date: new Date("2012-09-01"),
            to_date: new Date("9999-01-01"),
          },
        ],
      },
    },
  });

  const aaron = await prisma.employee.upsert({
    where: { emp_no: 3 },
    update: {},
    create: {
      emp_no: 3,
      first_name: "Aaron",
      last_name: "Son",
      birth_date: new Date("1990-07-14"),
      hire_date: new Date("2015-03-10"),
      dept_emps: {
        create: [
          {
            dept_no: engineering.dept_no,
            from_date: new Date("2015-03-10"),
            to_date: new Date("9999-01-01"),
          },
        ],
      },
    },
  });

  const brian_h = await prisma.employee.upsert({
    where: { emp_no: 4 },
    update: {},
    create: {
      emp_no: 4,
      first_name: "Brian",
      last_name: "Hendricks",
      birth_date: new Date("1988-11-30"),
      hire_date: new Date("2016-08-22"),
      dept_emps: {
        create: [
          {
            dept_no: engineering.dept_no,
            from_date: new Date("2016-08-22"),
            to_date: new Date("9999-01-01"),
          },
        ],
      },
    },
  });

  console.log({ engineering, sales, tim, brian_f, aaron, brian_h });
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
