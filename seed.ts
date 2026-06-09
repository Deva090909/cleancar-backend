/**
 * prisma/seed.ts — CleanCar 360° ERP
 * Mobile numbers MATCH the frontend seedAllData.ts exactly.
 * Run: npx ts-node --compiler-options '{"module":"commonjs"}' --transpile-only prisma/seed.ts
 */
import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const PlanType = { EXPRESS_WASH:"EXPRESS_WASH", SMART_WASH:"SMART_WASH", ELITE_WASH:"ELITE_WASH", ELITE_2W:"ELITE_2W" } as const;
const Role = {
  SUPER_ADMIN:"SUPER_ADMIN", ADMIN:"ADMIN", CITY_MANAGER:"CITY_MANAGER",
  SR_OPERATIONS_MANAGER:"SR_OPERATIONS_MANAGER", OPERATIONS_MANAGER:"OPERATIONS_MANAGER",
  CLUSTER_MANAGER:"CLUSTER_MANAGER", SUPERVISOR:"SUPERVISOR", CAR_WASHER:"CAR_WASHER",
  TSM:"TSM", TSE:"TSE", CCE:"CCE", SALES_HEAD:"SALES_HEAD", SALES_MANAGER:"SALES_MANAGER",
  HR:"HR", ACCOUNTS:"ACCOUNTS", STORE_MANAGER:"STORE_MANAGER", PROCUREMENT_MANAGER:"PROCUREMENT_MANAGER",
} as const;

async function main() {
  console.log("🌱 Seeding CleanCar 360° database...\n");

  const surat = await prisma.city.upsert({
    where: { code:"CITY-SURAT" }, update: {},
    create: { code:"CITY-SURAT", name:"Surat", state:"Gujarat", gstStateCode:"24" },
  });
  const mumbai = await prisma.city.upsert({
    where: { code:"CITY-MUMBAI" }, update: {},
    create: { code:"CITY-MUMBAI", name:"Mumbai", state:"Maharashtra", gstStateCode:"27" },
  });
  console.log("✅ Cities");

  const depts = ["Management","Operations","Sales","Customer Care","Finance","Human Resources","Inventory","Procurement","Accounts"];
  for (const name of depts) await prisma.department.upsert({ where:{name}, update:{}, create:{name} });
  console.log("✅ Departments");

  const tiers = [
    { name:PlanType.EXPRESS_WASH, displayName:"Express Wash", vehicleCategory:"Hatchback / Compact Sedan", baseMonthlyPrice:1249, costPerWash:41.63, sortOrder:1 },
    { name:PlanType.EXPRESS_WASH, displayName:"Express Wash", vehicleCategory:"SUV / MUV / Sedan",         baseMonthlyPrice:1499, costPerWash:49.97, sortOrder:2 },
    { name:PlanType.EXPRESS_WASH, displayName:"Express Wash", vehicleCategory:"Luxury / Large SUV",        baseMonthlyPrice:1999, costPerWash:66.63, sortOrder:3 },
    { name:PlanType.SMART_WASH,   displayName:"Smart Wash",   vehicleCategory:"Hatchback / Compact Sedan", baseMonthlyPrice:1599, costPerWash:53.30, sortOrder:4 },
    { name:PlanType.SMART_WASH,   displayName:"Smart Wash",   vehicleCategory:"SUV / MUV / Sedan",         baseMonthlyPrice:1999, costPerWash:66.63, sortOrder:5 },
    { name:PlanType.SMART_WASH,   displayName:"Smart Wash",   vehicleCategory:"Luxury / Large SUV",        baseMonthlyPrice:2699, costPerWash:89.97, sortOrder:6 },
    { name:PlanType.ELITE_WASH,   displayName:"Elite Wash",   vehicleCategory:"Hatchback / Compact Sedan", baseMonthlyPrice:1999, costPerWash:66.63, sortOrder:7 },
    { name:PlanType.ELITE_WASH,   displayName:"Elite Wash",   vehicleCategory:"SUV / MUV / Sedan",         baseMonthlyPrice:2499, costPerWash:83.30, sortOrder:8 },
    { name:PlanType.ELITE_WASH,   displayName:"Elite Wash",   vehicleCategory:"Luxury / Large SUV",        baseMonthlyPrice:3499, costPerWash:116.63,sortOrder:9 },
    { name:PlanType.ELITE_2W,     displayName:"Elite 2-Wheeler", vehicleCategory:"Bike / Scooter",         baseMonthlyPrice:799,  costPerWash:26.63, sortOrder:10 },
  ];
  for (const t of tiers) {
    await prisma.planTier.upsert({
      where: { name_vehicleCategory:{ name:t.name as any, vehicleCategory:t.vehicleCategory } },
      update: { displayName:t.displayName, baseMonthlyPrice:t.baseMonthlyPrice, costPerWash:t.costPerWash, sortOrder:t.sortOrder } as any,
      create: t as any,
    });
  }
  console.log("✅ Plan tiers (10)");

  const hash = await bcrypt.hash("Demo@1234", 12);
  const s = (l1:string) => ({ line1:l1, line2:"", city:"Surat", state:"Gujarat", pincode:"395001", country:"India" });
  const m = (l1:string) => ({ line1:l1, line2:"", city:"Mumbai", state:"Maharashtra", pincode:"400001", country:"India" });

  const base = {
    passwordHash: hash,
    accountStatus: "ACTIVE",
    onboardingPasswordSet: true,
    status: "ACTIVE",
    employeeType: "FULL_TIME",
    employmentStage: "PERMANENT",
    skillLevel: "SKILLED",
    maritalStatus: "Single",
    nationality: "Indian",
    probationMonths: 3,
    noticePeriodDays: 30,
  };

  // ── MOBILE NUMBERS MATCH FRONTEND seedAllData.ts EXACTLY ─────────────────
  // Frontend:
  // 9100000001 → Super Admin  9100000002 → Admin       9100000003 → City Manager
  // 9100000004 → Cluster Mgr  9100000005 → Sr Ops Mgr  9100000006,07 → Ops Manager
  // 9100000008,12 → Supervisor 9100000009-11,13-15 → Car Washer
  // 9100000016 → TSM           9100000017,18 → TSE      9100000019 → CCE
  // 9100000020 → HR            9100000021 → Accounts    9100000022 → Store Manager
  // 9100000023,24 → Sales Head  9100000025-27 → Sales Manager
  const employees = [
    { id:"EDB-SA-01",    cityId:surat.id,  loginMobile:"9100000001", mobile:"9100000001", firstName:"Rajesh",  lastName:"Patel",   fullName:"Rajesh Patel",   email:"rajesh@cleancar.com",   dob:"1980-01-01", gender:"Male",   designation:"Super Admin",           role:Role.SUPER_ADMIN,           dateOfJoining:"2025-08-01", workLocation:"Surat",  currentAddress:s("HQ"),         permanentAddress:s("HQ") },
    { id:"EDB-ADM-01",   cityId:surat.id,  loginMobile:"9100000002", mobile:"9100000002", firstName:"Kavita",  lastName:"Shah",    fullName:"Kavita Shah",    email:"kavita@cleancar.com",   dob:"1985-06-15", gender:"Female", designation:"Admin",                 role:Role.ADMIN,                 dateOfJoining:"2025-08-01", workLocation:"Surat",  currentAddress:s("Vesu"),       permanentAddress:s("Vesu") },
    { id:"EDB-CM-SUR1",  cityId:surat.id,  loginMobile:"9100000003", mobile:"9100000003", firstName:"Amit",    lastName:"Desai",   fullName:"Amit Desai",     email:"amit@cleancar.com",     dob:"1983-04-10", gender:"Male",   designation:"City Manager",          role:Role.CITY_MANAGER,          dateOfJoining:"2025-08-01", workLocation:"Surat",  currentAddress:s("Piplod"),     permanentAddress:s("Piplod") },
    { id:"EDB-CLM-SUR1", cityId:surat.id,  loginMobile:"9100000004", mobile:"9100000004", firstName:"Priya",   lastName:"Mehta",   fullName:"Priya Mehta",    email:"priya@cleancar.com",    dob:"1988-07-20", gender:"Female", designation:"Cluster Manager",       role:Role.CLUSTER_MANAGER,       dateOfJoining:"2025-09-01", workLocation:"Surat",  currentAddress:s("Adajan"),     permanentAddress:s("Adajan") },
    { id:"EDB-SOM-SUR1", cityId:surat.id,  loginMobile:"9100000005", mobile:"9100000005", firstName:"Deepak",  lastName:"Thakkar", fullName:"Deepak Thakkar", email:"deepak@cleancar.com",   dob:"1984-09-22", gender:"Male",   designation:"Sr Operations Manager", role:Role.SR_OPERATIONS_MANAGER, dateOfJoining:"2025-08-15", workLocation:"Surat",  currentAddress:s("Althan"),     permanentAddress:s("Althan") },
    { id:"EDB-OM-SUR1",  cityId:surat.id,  loginMobile:"9100000006", mobile:"9100000006", firstName:"Neha",    lastName:"Rana",    fullName:"Neha Rana",      email:"neha@cleancar.com",     dob:"1988-08-30", gender:"Female", designation:"Operations Manager",    role:Role.OPERATIONS_MANAGER,    dateOfJoining:"2025-10-01", workLocation:"Surat",  currentAddress:s("Vesu"),       permanentAddress:s("Vesu") },
    { id:"EDB-OM-SUR2",  cityId:surat.id,  loginMobile:"9100000007", mobile:"9100000007", firstName:"Ravi",    lastName:"Pandya",  fullName:"Ravi Pandya",    email:"ravi@cleancar.com",     dob:"1987-03-15", gender:"Male",   designation:"Operations Manager",    role:Role.OPERATIONS_MANAGER,    dateOfJoining:"2025-10-01", workLocation:"Surat",  currentAddress:s("Katargam"),   permanentAddress:s("Katargam") },
    { id:"EDB-SUP-SUR1", cityId:surat.id,  loginMobile:"9100000008", mobile:"9100000008", firstName:"Harish",  lastName:"Solanki", fullName:"Harish Solanki", email:"harish@cleancar.com",   dob:"1990-03-20", gender:"Male",   designation:"Supervisor",            role:Role.SUPERVISOR,            dateOfJoining:"2025-10-15", workLocation:"Surat",  currentAddress:s("Adajan"),     permanentAddress:s("Adajan") },
    { id:"EDB-CW-SUR1A", cityId:surat.id,  loginMobile:"9100000009", mobile:"9100000009", firstName:"Mahesh",  lastName:"Bharwad", fullName:"Mahesh Bharwad", email:"mahesh1@cleancar.com",  dob:"1998-07-10", gender:"Male",   designation:"Car Washer",            role:Role.CAR_WASHER,            dateOfJoining:"2025-11-01", workLocation:"Surat",  currentAddress:s("Katargam"),   permanentAddress:s("Katargam") },
    { id:"EDB-CW-SUR1B", cityId:surat.id,  loginMobile:"9100000010", mobile:"9100000010", firstName:"Ramesh",  lastName:"Koli",    fullName:"Ramesh Koli",    email:"ramesh@cleancar.com",   dob:"2000-01-20", gender:"Male",   designation:"Car Washer",            role:Role.CAR_WASHER,            dateOfJoining:"2025-11-15", workLocation:"Surat",  currentAddress:s("Sagrampura"), permanentAddress:s("Sagrampura") },
    { id:"EDB-CW-SUR1C", cityId:surat.id,  loginMobile:"9100000011", mobile:"9100000011", firstName:"Sunil",   lastName:"Thakor",  fullName:"Sunil Thakor",   email:"sunil@cleancar.com",    dob:"1997-05-12", gender:"Male",   designation:"Car Washer",            role:Role.CAR_WASHER,            dateOfJoining:"2025-11-01", workLocation:"Surat",  currentAddress:s("Sagrampura"), permanentAddress:s("Sagrampura") },
    { id:"EDB-SUP-SUR2", cityId:surat.id,  loginMobile:"9100000012", mobile:"9100000012", firstName:"Bhavesh", lastName:"Modi",    fullName:"Bhavesh Modi",   email:"bhavesh@cleancar.com",  dob:"1991-07-14", gender:"Male",   designation:"Supervisor",            role:Role.SUPERVISOR,            dateOfJoining:"2025-10-15", workLocation:"Surat",  currentAddress:s("Katargam"),   permanentAddress:s("Katargam") },
    { id:"EDB-CW-SUR2A", cityId:surat.id,  loginMobile:"9100000013", mobile:"9100000013", firstName:"Nilesh",  lastName:"Chauhan", fullName:"Nilesh Chauhan", email:"nilesh@cleancar.com",   dob:"1999-02-18", gender:"Male",   designation:"Car Washer",            role:Role.CAR_WASHER,            dateOfJoining:"2025-11-01", workLocation:"Surat",  currentAddress:s("Katargam"),   permanentAddress:s("Katargam") },
    { id:"EDB-CW-SUR2B", cityId:surat.id,  loginMobile:"9100000014", mobile:"9100000014", firstName:"Dinesh",  lastName:"Parmar",  fullName:"Dinesh Parmar",  email:"dinesh@cleancar.com",   dob:"2001-04-05", gender:"Male",   designation:"Car Washer",            role:Role.CAR_WASHER,            dateOfJoining:"2025-11-15", workLocation:"Surat",  currentAddress:s("Katargam"),   permanentAddress:s("Katargam") },
    { id:"EDB-CW-SUR2C", cityId:surat.id,  loginMobile:"9100000015", mobile:"9100000015", firstName:"Arvind",  lastName:"Vasava",  fullName:"Arvind Vasava",  email:"arvind@cleancar.com",   dob:"2000-08-22", gender:"Male",   designation:"Car Washer",            role:Role.CAR_WASHER,            dateOfJoining:"2025-12-15", workLocation:"Surat",  currentAddress:s("Katargam"),   permanentAddress:s("Katargam") },
    { id:"EDB-TSM-SUR1", cityId:surat.id,  loginMobile:"9100000016", mobile:"9100000016", firstName:"Sanjay",  lastName:"Kapoor",  fullName:"Sanjay Kapoor",  email:"sanjay@cleancar.com",   dob:"1990-11-25", gender:"Male",   designation:"TSM",                   role:Role.TSM,                   dateOfJoining:"2025-09-01", workLocation:"Surat",  currentAddress:s("Piplod"),     permanentAddress:s("Piplod") },
    { id:"EDB-TSE-SUR1", cityId:surat.id,  loginMobile:"9100000017", mobile:"9100000017", firstName:"Pooja",   lastName:"Sharma",  fullName:"Pooja Sharma",   email:"pooja@cleancar.com",    dob:"1995-05-15", gender:"Female", designation:"TSE",                   role:Role.TSE,                   dateOfJoining:"2025-10-01", workLocation:"Surat",  currentAddress:s("Adajan"),     permanentAddress:s("Adajan") },
    { id:"EDB-TSE-SUR2", cityId:surat.id,  loginMobile:"9100000018", mobile:"9100000018", firstName:"Ankit",   lastName:"Trivedi", fullName:"Ankit Trivedi",  email:"ankit@cleancar.com",    dob:"1997-08-12", gender:"Male",   designation:"TSE",                   role:Role.TSE,                   dateOfJoining:"2025-10-15", workLocation:"Surat",  currentAddress:s("Udhna"),      permanentAddress:s("Udhna") },
    { id:"EDB-CCE-SUR1", cityId:surat.id,  loginMobile:"9100000019", mobile:"9100000019", firstName:"Meera",   lastName:"Jain",    fullName:"Meera Jain",     email:"meera@cleancar.com",    dob:"1997-02-14", gender:"Female", designation:"CCE",                   role:Role.CCE,                   dateOfJoining:"2025-09-15", workLocation:"Surat",  currentAddress:s("Citylight"),  permanentAddress:s("Citylight") },
    { id:"EDB-HR-SUR1",  cityId:surat.id,  loginMobile:"9100000020", mobile:"9100000020", firstName:"Rekha",   lastName:"Solanki", fullName:"Rekha Solanki",  email:"rekha@cleancar.com",    dob:"1991-01-30", gender:"Female", designation:"HR",                    role:Role.HR,                    dateOfJoining:"2025-08-01", workLocation:"Surat",  currentAddress:s("Athwalines"), permanentAddress:s("Athwalines") },
    { id:"EDB-ACC-SUR1", cityId:surat.id,  loginMobile:"9100000021", mobile:"9100000021", firstName:"Chirag",  lastName:"Doshi",   fullName:"Chirag Doshi",   email:"chirag@cleancar.com",   dob:"1987-06-22", gender:"Male",   designation:"Accounts",              role:Role.ACCOUNTS,              dateOfJoining:"2025-08-01", workLocation:"Surat",  currentAddress:s("Ring Road"),  permanentAddress:s("Ring Road") },
    { id:"EDB-SM-SUR1",  cityId:surat.id,  loginMobile:"9100000022", mobile:"9100000022", firstName:"Nayan",   lastName:"Desai",   fullName:"Nayan Desai",    email:"nayan@cleancar.com",    dob:"1989-11-08", gender:"Male",   designation:"Store Manager",         role:Role.STORE_MANAGER,         dateOfJoining:"2025-09-01", workLocation:"Surat",  currentAddress:s("GIDC"),       permanentAddress:s("GIDC") },
    { id:"EDB-SH-SUR1",  cityId:surat.id,  loginMobile:"9100000023", mobile:"9100000023", firstName:"Priya",   lastName:"Nair",    fullName:"Priya Nair",     email:"priya.nair@cleancar.com",dob:"1985-03-18",gender:"Female", designation:"Sales Head",            role:Role.SALES_HEAD,            dateOfJoining:"2025-09-01", workLocation:"Surat",  currentAddress:s("Piplod"),     permanentAddress:s("Piplod") },
    { id:"EDB-SH-SUR2",  cityId:surat.id,  loginMobile:"9100000024", mobile:"9100000024", firstName:"Ravi",    lastName:"Shah",    fullName:"Ravi Shah",      email:"ravi.shah@cleancar.com", dob:"1982-09-28",gender:"Male",   designation:"Sales Head",            role:Role.SALES_HEAD,            dateOfJoining:"2025-09-15", workLocation:"Surat",  currentAddress:s("Piplod"),     permanentAddress:s("Piplod") },
    { id:"EDB-SMGR-SUR1",cityId:surat.id,  loginMobile:"9100000025", mobile:"9100000025", firstName:"Nayan",   lastName:"Joshi",   fullName:"Nayan Joshi",    email:"nayan.joshi@cleancar.com",dob:"1992-04-15",gender:"Male",  designation:"Sales Manager",         role:Role.SALES_MANAGER,         dateOfJoining:"2025-10-01", workLocation:"Surat",  currentAddress:s("Adajan"),     permanentAddress:s("Adajan") },
    { id:"EDB-SMGR-SUR2",cityId:surat.id,  loginMobile:"9100000026", mobile:"9100000026", firstName:"Kalpesh", lastName:"Rathod",  fullName:"Kalpesh Rathod", email:"kalpesh@cleancar.com",  dob:"1993-07-22", gender:"Male",   designation:"Sales Manager",         role:Role.SALES_MANAGER,         dateOfJoining:"2025-10-15", workLocation:"Surat",  currentAddress:s("Katargam"),   permanentAddress:s("Katargam") },
    { id:"EDB-SMGR-SUR3",cityId:surat.id,  loginMobile:"9100000027", mobile:"9100000027", firstName:"Amit",    lastName:"Trivedi", fullName:"Amit Trivedi",   email:"amit.trivedi@cleancar.com",dob:"1991-12-10",gender:"Male", designation:"Sales Manager",         role:Role.SALES_MANAGER,         dateOfJoining:"2025-11-01", workLocation:"Surat",  currentAddress:s("Udhna"),      permanentAddress:s("Udhna") },
    { id:"EDB-PM-SUR1",  cityId:surat.id,  loginMobile:"9100000028", mobile:"9100000028", firstName:"Dinesh",  lastName:"Chauhan", fullName:"Dinesh Chauhan", email:"dinesh.pm@cleancar.com", dob:"1986-04-17", gender:"Male",   designation:"Procurement Manager",   role:Role.PROCUREMENT_MANAGER,   dateOfJoining:"2025-08-01", workLocation:"Surat",  currentAddress:s("Surat Station"),permanentAddress:s("Surat Station") },
    // Mumbai
    { id:"EDB-CM-MUM1",  cityId:mumbai.id, loginMobile:"9200000001", mobile:"9200000001", firstName:"Rahul",   lastName:"Nair",    fullName:"Rahul Nair",     email:"rahul.cm@cleancar.com",  dob:"1984-07-25", gender:"Male",   designation:"City Manager",          role:Role.CITY_MANAGER,          dateOfJoining:"2025-09-01", workLocation:"Mumbai", currentAddress:m("Andheri"),    permanentAddress:m("Andheri") },
    { id:"EDB-SUP-MUM1", cityId:mumbai.id, loginMobile:"9200000002", mobile:"9200000002", firstName:"Santosh", lastName:"Yadav",   fullName:"Santosh Yadav",  email:"santosh@cleancar.com",   dob:"1993-02-10", gender:"Male",   designation:"Supervisor",            role:Role.SUPERVISOR,            dateOfJoining:"2025-09-15", workLocation:"Mumbai", currentAddress:m("Goregaon"),   permanentAddress:m("Goregaon") },
    { id:"EDB-CW-MUM1A", cityId:mumbai.id, loginMobile:"9200000003", mobile:"9200000003", firstName:"Ajay",    lastName:"Gupta",   fullName:"Ajay Gupta",     email:"ajay.cw@cleancar.com",   dob:"1999-05-05", gender:"Male",   designation:"Car Washer",            role:Role.CAR_WASHER,            dateOfJoining:"2025-10-01", workLocation:"Mumbai", currentAddress:m("Malad"),      permanentAddress:m("Malad") },
    { id:"EDB-TSE-MUM1", cityId:mumbai.id, loginMobile:"9200000004", mobile:"9200000004", firstName:"Kavya",   lastName:"Rao",     fullName:"Kavya Rao",      email:"kavya.tse@cleancar.com", dob:"1996-10-18", gender:"Female", designation:"TSE",                   role:Role.TSE,                   dateOfJoining:"2025-10-01", workLocation:"Mumbai", currentAddress:m("Borivali"),   permanentAddress:m("Borivali") },
  ];

  let count = 0;
  for (const emp of employees) {
    await prisma.employee.upsert({
      where: { id: emp.id },
      update: { loginMobile: emp.loginMobile, mobile: emp.mobile, passwordHash: hash },
      create: { ...base, ...emp } as any,
    });
    count++;
  }
  console.log(`✅ Employees seeded: ${count}`);

  // Salary structures
  const salaries: Record<string, number> = {
    "EDB-SA-01":90000,"EDB-ADM-01":65000,"EDB-CM-SUR1":72000,"EDB-CLM-SUR1":52000,
    "EDB-SOM-SUR1":47000,"EDB-OM-SUR1":40000,"EDB-OM-SUR2":40000,
    "EDB-SUP-SUR1":28000,"EDB-SUP-SUR2":27000,
    "EDB-CW-SUR1A":16000,"EDB-CW-SUR1B":14500,"EDB-CW-SUR1C":17000,
    "EDB-CW-SUR2A":16500,"EDB-CW-SUR2B":15000,"EDB-CW-SUR2C":13500,
    "EDB-TSM-SUR1":35000,"EDB-TSE-SUR1":22000,"EDB-TSE-SUR2":21000,
    "EDB-CCE-SUR1":20000,"EDB-HR-SUR1":30000,"EDB-ACC-SUR1":32000,
    "EDB-SM-SUR1":28000,"EDB-SH-SUR1":52000,"EDB-SH-SUR2":50000,
    "EDB-SMGR-SUR1":32000,"EDB-SMGR-SUR2":30000,"EDB-SMGR-SUR3":29000,
    "EDB-PM-SUR1":38000,"EDB-CM-MUM1":70000,"EDB-SUP-MUM1":32000,
    "EDB-CW-MUM1A":18000,"EDB-TSE-MUM1":24000,
  };
  for (const [empId, basic] of Object.entries(salaries)) {
    const existing = await prisma.salaryStructure.findUnique({ where:{ employeeId:empId } });
    if (!existing) {
      const hra = Math.round(basic * 0.4);
      await prisma.salaryStructure.create({
        data:{ employeeId:empId, basicSalary:basic, hra, conveyanceAllowance:1600,
          specialAllowance:Math.round(basic*0.1), ctc:basic+hra+1600+Math.round(basic*0.1),
          pfApplicable:true, esicApplicable:basic<=21000, ptApplicable:true,
          tdsRate:0, effectiveFrom:"2025-08-01" },
      });
    }
  }
  console.log("✅ Salary structures");

  // Leave balances
  for (const emp of employees) {
    const existing = await prisma.leaveBalance.findUnique({ where:{ employeeId:emp.id } });
    if (!existing) await prisma.leaveBalance.create({ data:{ employeeId:emp.id, year:2026, casualLeave:12, sickLeave:7, earnedLeave:15, compOff:0 } });
  }
  console.log("✅ Leave balances");

  // Budgets
  const months = ["2026-04","2026-05","2026-06","2026-07","2026-08","2026-09"];
  for (const city of [surat, mumbai]) {
    for (const month of months) {
      await prisma.budget.upsert({
        where: { cityId_month:{ cityId:city.id, month } },
        update: {},
        create: { cityId:city.id, month, revenueTarget:city.id===surat.id?500000:750000, expenseBudget:city.id===surat.id?350000:500000, profitTarget:city.id===surat.id?150000:250000, createdBy:"EDB-SA-01" },
      });
    }
  }
  console.log("✅ Budgets");

  console.log("\n══════════════════════════════════════════════════");
  console.log("  Seed Complete ✅  |  Password: Demo@1234");
  console.log("══════════════════════════════════════════════════");
  console.log("  9100000001 → Super Admin   9100000020 → HR");
  console.log("  9100000016 → TSM           9100000021 → Accounts");
  console.log("  9100000017 → TSE           9100000022 → Store Manager");
  console.log("  9100000019 → CCE           9100000023 → Sales Head");
  console.log("  9100000003 → City Manager  9100000025 → Sales Manager");
  console.log("══════════════════════════════════════════════════\n");
}

main().catch(e => { console.error("❌", e); process.exit(1); }).finally(() => prisma.$disconnect());
