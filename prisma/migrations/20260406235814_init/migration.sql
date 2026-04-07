-- CreateTable
CREATE TABLE "employees" (
    "emp_no" INTEGER NOT NULL,
    "birth_date" TIMESTAMP(3) NOT NULL,
    "first_name" VARCHAR(14) NOT NULL,
    "last_name" VARCHAR(16) NOT NULL,
    "hire_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("emp_no")
);

-- CreateTable
CREATE TABLE "departments" (
    "dept_no" CHAR(4) NOT NULL,
    "dept_name" VARCHAR(40) NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("dept_no")
);

-- CreateTable
CREATE TABLE "dept_emp" (
    "emp_no" INTEGER NOT NULL,
    "dept_no" CHAR(4) NOT NULL,
    "from_date" TIMESTAMP(3) NOT NULL,
    "to_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dept_emp_pkey" PRIMARY KEY ("emp_no","dept_no")
);

-- CreateIndex
CREATE UNIQUE INDEX "departments_dept_name_key" ON "departments"("dept_name");

-- AddForeignKey
ALTER TABLE "dept_emp" ADD CONSTRAINT "dept_emp_emp_no_fkey" FOREIGN KEY ("emp_no") REFERENCES "employees"("emp_no") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dept_emp" ADD CONSTRAINT "dept_emp_dept_no_fkey" FOREIGN KEY ("dept_no") REFERENCES "departments"("dept_no") ON DELETE CASCADE ON UPDATE CASCADE;
