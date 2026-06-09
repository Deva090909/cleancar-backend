/**
 * prisma/seed.ts — Complete seed for CleanCar 360° ERP
 * All 17 roles covered across Surat and Mumbai cities
 * Run: npx ts-node prisma/seed.ts
 */
import {
  PrismaClient, Role, AccountStatus, EmployeeStatus,
  PlanType, EmployeeType, EmploymentStage, SkillLevel
} from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding CleanCar 360° database...\n");

  // ── Cities ───────────────────────────────────────────────────────────────
  const surat = await prisma.city.upsert({
    where: { code: "CITY-SURAT" },
    update: {},
    create: { code: "CITY-SURAT", name: "Surat", state: "Gujarat", gstStateCode: "24" },
  });
  const mumbai = await prisma.city.upsert({
    where: { code: "CITY-MUMBAI" },
    update: {},
    create: { code: "CITY-MUMBAI", name: "Mumbai", state: "Maharashtra", gstStateCode: "27" },
  });
  console.log("✅ Cities seeded (Surat, Mumbai)");

  // ── Departments ──────────────────────────────────────────────────────────
  const depts = [
    "Management", "Operations", "Sales", "Customer Care",
    "Finance", "Human Resources", "Inventory", "Procurement", "Accounts"
  ];
  for (const name of depts) {
    await prisma.department.upsert({ where: { name }, update: {}, create: { name } });
  }
  console.log("✅ Departments seeded");

  // ── Plan tiers ───────────────────────────────────────────────────────────
  const tiers = [
    { name: PlanType.EXPRESS_WASH, displayName: "Express Wash", vehicleCategory: "Hatchback / Compact Sedan", baseMonthlyPrice: 1249, costPerWash: 41.63, sortOrder: 1 },
    { name: PlanType.EXPRESS_WASH, displayName: "Express Wash", vehicleCategory: "SUV / MUV / Sedan",         baseMonthlyPrice: 1499, costPerWash: 49.97, sortOrder: 2 },
    { name: PlanType.EXPRESS_WASH, displayName: "Express Wash", vehicleCategory: "Luxury / Large SUV",        baseMonthlyPrice: 1999, costPerWash: 66.63, sortOrder: 3 },
    { name: PlanType.SMART_WASH,   displayName: "Smart Wash",   vehicleCategory: "Hatchback / Compact Sedan", baseMonthlyPrice: 1599, costPerWash: 53.30, sortOrder: 4 },
    { name: PlanType.SMART_WASH,   displayName: "Smart Wash",   vehicleCategory: "SUV / MUV / Sedan",         baseMonthlyPrice: 1999, costPerWash: 66.63, sortOrder: 5 },
    { name: PlanType.SMART_WASH,   displayName: "Smart Wash",   vehicleCategory: "Luxury / Large SUV",        baseMonthlyPrice: 2699, costPerWash: 89.97, sortOrder: 6 },
    { name: PlanType.ELITE_WASH,   displayName: "Elite Wash",   vehicleCategory: "Hatchback / Compact Sedan", baseMonthlyPrice: 1999, costPerWash: 66.63, sortOrder: 7 },
    { name: PlanType.ELITE_WASH,   displayName: "Elite Wash",   vehicleCategory: "SUV / MUV / Sedan",         baseMonthlyPrice: 2499, costPerWash: 83.30, sortOrder: 8 },
    { name: PlanType.ELITE_WASH,   displayName: "Elite Wash",   vehicleCategory: "Luxury / Large SUV",        baseMonthlyPrice: 3499, costPerWash: 116.63, sortOrder: 9 },
    { name: PlanType.ELITE_2W,     displayName: "Elite 2-Wheeler", vehicleCategory: "Bike / Scooter",         baseMonthlyPrice: 799,  costPerWash: 26.63,  sortOrder: 10 },
  ];
  for (const tier of tiers) {
    await prisma.planTier.upsert({
      where: { name_vehicleCategory: { name: tier.name, vehicleCategory: tier.vehicleCategory } },
      update: { displayName: tier.displayName, baseMonthlyPrice: tier.baseMonthlyPrice, costPerWash: tier.costPerWash, sortOrder: tier.sortOrder },
      create: tier,
    });
  }
  console.log("✅ Plan tiers seeded (10 tiers)");

  // ── Plan Add-ons ─────────────────────────────────────────────────────────
  const addons = [
    { name: "Interior Vacuum",    description: "Full interior vacuum cleaning",         category: "Interior", hatchbackPrice: 199, suvPrice: 249, luxuryPrice: 349 },
    { name: "Dashboard Wipe",     description: "Dashboard and console cleaning",         category: "Interior", hatchbackPrice: 99,  suvPrice: 129, luxuryPrice: 199 },
    { name: "Tyre Dressing",      description: "Tyre shine and dressing",               category: "Exterior", hatchbackPrice: 149, suvPrice: 149, luxuryPrice: 199 },
    { name: "Shampoo Wash",       description: "Deep shampoo exterior wash",            category: "Exterior", hatchbackPrice: 299, suvPrice: 399, luxuryPrice: 499 },
    { name: "Wax Polish",         description: "Carnauba wax polish",                   category: "Exterior", hatchbackPrice: 499, suvPrice: 699, luxuryPrice: 999 },
    { name: "Engine Bay Cleaning",description: "Engine compartment cleaning",           category: "Engine",   hatchbackPrice: 399, suvPrice: 499, luxuryPrice: 699 },
    { name: "Underbody Wash",     description: "Underbody pressure wash",               category: "Exterior", hatchbackPrice: 299, suvPrice: 349, luxuryPrice: 499 },
    { name: "Fragrance",          description: "Car interior fragrance",                category: "Interior", hatchbackPrice: 99,  suvPrice: 99,  luxuryPrice: 149 },
  ];
  for (const addon of addons) {
    const existing = await prisma.planAddon.findFirst({ where: { name: addon.name } });
    if (!existing) await prisma.planAddon.create({ data: addon });
  }
  console.log("✅ Plan add-ons seeded (8 add-ons)");

  // ── Public Holidays 2026 ─────────────────────────────────────────────────
  const holidays = [
    { date: "2026-01-01", name: "New Year's Day",       type: "NATIONAL" },
    { date: "2026-01-26", name: "Republic Day",         type: "NATIONAL" },
    { date: "2026-03-20", name: "Holi",                 type: "NATIONAL" },
    { date: "2026-04-14", name: "Dr. Ambedkar Jayanti", type: "NATIONAL" },
    { date: "2026-04-30", name: "Ram Navami",           type: "NATIONAL" },
    { date: "2026-05-01", name: "Maharashtra Day / Gujarat Day", type: "REGIONAL" },
    { date: "2026-08-15", name: "Independence Day",     type: "NATIONAL" },
    { date: "2026-10-02", name: "Gandhi Jayanti",       type: "NATIONAL" },
    { date: "2026-10-22", name: "Diwali",               type: "NATIONAL" },
    { date: "2026-11-04", name: "Bhai Dooj",            type: "NATIONAL" },
    { date: "2026-12-25", name: "Christmas",            type: "NATIONAL" },
  ];
  for (const h of holidays) {
    await prisma.publicHoliday.upsert({
      where: { date_stateCode: { date: h.date, stateCode: null } },
      update: {},
      create: { date: h.date, name: h.name, type: h.type },
    }).catch(() => {});
  }
  console.log("✅ Public holidays seeded (2026)");

  // ── Employees — ALL 17 ROLES ─────────────────────────────────────────────
  const passwordHash = await bcrypt.hash("Demo@1234", 12);

  const addr = (line1: string) => ({
    line1, line2: "", city: "Surat", state: "Gujarat", pincode: "395001", country: "India"
  });
  const maddr = (line1: string) => ({
    line1, line2: "", city: "Mumbai", state: "Maharashtra", pincode: "400001", country: "India"
  });

  const baseEmp = {
    passwordHash,
    accountStatus: AccountStatus.ACTIVE,
    onboardingPasswordSet: true,
    status: EmployeeStatus.ACTIVE,
    employeeType: EmployeeType.FULL_TIME,
    employmentStage: EmploymentStage.PERMANENT,
    skillLevel: SkillLevel.SKILLED,
    maritalStatus: "Single",
    nationality: "Indian",
    probationMonths: 3,
    noticePeriodDays: 30,
  };

  const employees = [
    // ── SUPER ADMIN ──────────────────────────────────────────────────────
    { id: "EDB-SA-01",   cityId: surat.id,  loginMobile: "9100000001", mobile: "9100000001",
      firstName: "Rajesh",  lastName: "Patel",   fullName: "Rajesh Patel",
      email: "rajesh@cleancar.com",  dob: "1980-01-01", gender: "Male",
      designation: "Super Admin", role: Role.SUPER_ADMIN,
      dateOfJoining: "2025-08-01", workLocation: "Surat",
      currentAddress: addr("HQ Office"), permanentAddress: addr("HQ Office") },

    // ── ADMIN ────────────────────────────────────────────────────────────
    { id: "EDB-ADM-01",  cityId: surat.id,  loginMobile: "9100000002", mobile: "9100000002",
      firstName: "Amit",    lastName: "Shah",    fullName: "Amit Shah",
      email: "amit@cleancar.com",    dob: "1985-06-15", gender: "Male",
      designation: "Admin", role: Role.ADMIN,
      dateOfJoining: "2025-08-01", workLocation: "Surat",
      currentAddress: addr("Vesu"), permanentAddress: addr("Vesu") },

    // ── CITY MANAGER ─────────────────────────────────────────────────────
    { id: "EDB-CM-SUR1", cityId: surat.id,  loginMobile: "9100000003", mobile: "9100000003",
      firstName: "Suresh",  lastName: "Agarwal", fullName: "Suresh Agarwal",
      email: "suresh.cm@cleancar.com", dob: "1983-04-10", gender: "Male",
      designation: "City Manager", role: Role.CITY_MANAGER,
      dateOfJoining: "2025-08-01", workLocation: "Surat",
      currentAddress: addr("Piplod"), permanentAddress: addr("Piplod") },

    // ── SR OPERATIONS MANAGER ────────────────────────────────────────────
    { id: "EDB-SOM-SUR1",cityId: surat.id,  loginMobile: "9100000004", mobile: "9100000004",
      firstName: "Deepak",  lastName: "Verma",   fullName: "Deepak Verma",
      email: "deepak.som@cleancar.com", dob: "1984-09-22", gender: "Male",
      designation: "Sr. Operations Manager", role: Role.SR_OPERATIONS_MANAGER,
      dateOfJoining: "2025-08-15", workLocation: "Surat",
      currentAddress: addr("Althan"), permanentAddress: addr("Althan") },

    // ── OPERATIONS MANAGER ───────────────────────────────────────────────
    { id: "EDB-OM-SUR1", cityId: surat.id,  loginMobile: "9100000005", mobile: "9100000005",
      firstName: "Vikram",  lastName: "Joshi",   fullName: "Vikram Joshi",
      email: "vikram.om@cleancar.com", dob: "1988-08-30", gender: "Male",
      designation: "Operations Manager", role: Role.OPERATIONS_MANAGER,
      dateOfJoining: "2025-08-01", workLocation: "Surat",
      currentAddress: addr("Vesu"), permanentAddress: addr("Vesu") },

    // ── CLUSTER MANAGER ──────────────────────────────────────────────────
    { id: "EDB-CLM-SUR1",cityId: surat.id,  loginMobile: "9100000006", mobile: "9100000006",
      firstName: "Rohan",   lastName: "Mehta",   fullName: "Rohan Mehta",
      email: "rohan.clm@cleancar.com", dob: "1990-12-05", gender: "Male",
      designation: "Cluster Manager", role: Role.CLUSTER_MANAGER,
      dateOfJoining: "2025-09-01", workLocation: "Surat",
      currentAddress: addr("Adajan"), permanentAddress: addr("Adajan") },

    // ── SUPERVISOR ───────────────────────────────────────────────────────
    { id: "EDB-SUP-SUR1",cityId: surat.id,  loginMobile: "9100000007", mobile: "9100000007",
      firstName: "Harish",  lastName: "Solanki", fullName: "Harish Solanki",
      email: "harish.sup@cleancar.com", dob: "1990-03-20", gender: "Male",
      designation: "Supervisor", role: Role.SUPERVISOR,
      dateOfJoining: "2025-09-01", workLocation: "Surat",
      currentAddress: addr("Adajan"), permanentAddress: addr("Adajan") },

    { id: "EDB-SUP-SUR2",cityId: surat.id,  loginMobile: "9100000008", mobile: "9100000008",
      firstName: "Bhavesh", lastName: "Modi",    fullName: "Bhavesh Modi",
      email: "bhavesh.sup@cleancar.com", dob: "1991-07-14", gender: "Male",
      designation: "Supervisor", role: Role.SUPERVISOR,
      dateOfJoining: "2025-09-15", workLocation: "Surat",
      currentAddress: addr("Katargam"), permanentAddress: addr("Katargam") },

    // ── CAR WASHER ───────────────────────────────────────────────────────
    { id: "EDB-CW-SUR1A",cityId: surat.id,  loginMobile: "9100000009", mobile: "9100000009",
      firstName: "Mahesh",  lastName: "Bharwad", fullName: "Mahesh Bharwad",
      email: "mahesh.cw@cleancar.com", dob: "1998-07-10", gender: "Male",
      designation: "Car Washer", role: Role.CAR_WASHER,
      dateOfJoining: "2025-09-15", workLocation: "Surat",
      skillLevel: SkillLevel.SKILLED,
      currentAddress: addr("Katargam"), permanentAddress: addr("Katargam") },

    { id: "EDB-CW-SUR1B",cityId: surat.id,  loginMobile: "9100000010", mobile: "9100000010",
      firstName: "Ramesh",  lastName: "Koli",    fullName: "Ramesh Koli",
      email: "ramesh.cw@cleancar.com", dob: "2000-01-20", gender: "Male",
      designation: "Car Washer", role: Role.CAR_WASHER,
      dateOfJoining: "2025-10-01", workLocation: "Surat",
      skillLevel: SkillLevel.SEMI_SKILLED,
      currentAddress: addr("Sagrampura"), permanentAddress: addr("Sagrampura") },

    // ── TSM (Tele Sales Manager) ─────────────────────────────────────────
    { id: "EDB-TSM-SUR1",cityId: surat.id,  loginMobile: "9100000016", mobile: "9100000016",
      firstName: "Neha",    lastName: "Desai",   fullName: "Neha Desai",
      email: "neha.tsm@cleancar.com", dob: "1992-11-25", gender: "Female",
      designation: "Tele Sales Manager", role: Role.TSM,
      dateOfJoining: "2025-08-15", workLocation: "Surat",
      currentAddress: addr("Piplod"), permanentAddress: addr("Piplod") },

    // ── TSE (Tele Sales Executive) ───────────────────────────────────────
    { id: "EDB-TSE-SUR1",cityId: surat.id,  loginMobile: "9100000017", mobile: "9100000017",
      firstName: "Pooja",   lastName: "Sharma",  fullName: "Pooja Sharma",
      email: "pooja.tse@cleancar.com", dob: "1995-05-15", gender: "Female",
      designation: "Tele Sales Executive", role: Role.TSE,
      dateOfJoining: "2025-10-01", workLocation: "Surat",
      currentAddress: addr("Adajan"), permanentAddress: addr("Adajan") },

    { id: "EDB-TSE-SUR2",cityId: surat.id,  loginMobile: "9100000019", mobile: "9100000019",
      firstName: "Ravi",    lastName: "Kumar",   fullName: "Ravi Kumar",
      email: "ravi.tse@cleancar.com", dob: "1997-08-12", gender: "Male",
      designation: "Tele Sales Executive", role: Role.TSE,
      dateOfJoining: "2025-10-15", workLocation: "Surat",
      currentAddress: addr("Udhna"), permanentAddress: addr("Udhna") },

    // ── CCE (Customer Care Executive) ────────────────────────────────────
    { id: "EDB-CCE-SUR1",cityId: surat.id,  loginMobile: "9100000018", mobile: "9100000018",
      firstName: "Priya",   lastName: "Mehta",   fullName: "Priya Mehta",
      email: "priya.cce@cleancar.com", dob: "1997-02-14", gender: "Female",
      designation: "Customer Care Executive", role: Role.CCE,
      dateOfJoining: "2025-10-15", workLocation: "Surat",
      currentAddress: addr("Citylight"), permanentAddress: addr("Citylight") },

    // ── SALES HEAD ───────────────────────────────────────────────────────
    { id: "EDB-SH-SUR1", cityId: surat.id,  loginMobile: "9100000011", mobile: "9100000011",
      firstName: "Kiran",   lastName: "Patel",   fullName: "Kiran Patel",
      email: "kiran.sh@cleancar.com", dob: "1982-03-18", gender: "Male",
      designation: "Sales Head", role: Role.SALES_HEAD,
      dateOfJoining: "2025-08-01", workLocation: "Surat",
      currentAddress: addr("Ghod Dod Road"), permanentAddress: addr("Ghod Dod Road") },

    // ── SALES MANAGER ────────────────────────────────────────────────────
    { id: "EDB-SM-SUR1", cityId: surat.id,  loginMobile: "9100000012", mobile: "9100000012",
      firstName: "Ankita",  lastName: "Jain",    fullName: "Ankita Jain",
      email: "ankita.sm@cleancar.com", dob: "1990-09-28", gender: "Female",
      designation: "Sales Manager", role: Role.SALES_MANAGER,
      dateOfJoining: "2025-08-15", workLocation: "Surat",
      currentAddress: addr("Piplod"), permanentAddress: addr("Piplod") },

    // ── HR ───────────────────────────────────────────────────────────────
    { id: "EDB-HR-SUR1", cityId: surat.id,  loginMobile: "9100000013", mobile: "9100000013",
      firstName: "Sneha",   lastName: "Trivedi", fullName: "Sneha Trivedi",
      email: "sneha.hr@cleancar.com", dob: "1991-01-30", gender: "Female",
      designation: "HR Manager", role: Role.HR,
      dateOfJoining: "2025-08-01", workLocation: "Surat",
      currentAddress: addr("Athwalines"), permanentAddress: addr("Athwalines") },

    // ── ACCOUNTS ─────────────────────────────────────────────────────────
    { id: "EDB-ACC-SUR1",cityId: surat.id,  loginMobile: "9100000014", mobile: "9100000014",
      firstName: "Mohan",   lastName: "Gupta",   fullName: "Mohan Gupta",
      email: "mohan.acc@cleancar.com", dob: "1987-06-22", gender: "Male",
      designation: "Accounts Manager", role: Role.ACCOUNTS,
      dateOfJoining: "2025-08-01", workLocation: "Surat",
      currentAddress: addr("Ring Road"), permanentAddress: addr("Ring Road") },

    // ── STORE MANAGER ────────────────────────────────────────────────────
    { id: "EDB-STM-SUR1",cityId: surat.id,  loginMobile: "9100000015", mobile: "9100000015",
      firstName: "Jayesh",  lastName: "Patil",   fullName: "Jayesh Patil",
      email: "jayesh.stm@cleancar.com", dob: "1989-11-08", gender: "Male",
      designation: "Store Manager", role: Role.STORE_MANAGER,
      dateOfJoining: "2025-08-15", workLocation: "Surat",
      currentAddress: addr("GIDC"), permanentAddress: addr("GIDC") },

    // ── PROCUREMENT MANAGER ──────────────────────────────────────────────
    { id: "EDB-PM-SUR1", cityId: surat.id,  loginMobile: "9100000020", mobile: "9100000020",
      firstName: "Dinesh",  lastName: "Chauhan", fullName: "Dinesh Chauhan",
      email: "dinesh.pm@cleancar.com", dob: "1986-04-17", gender: "Male",
      designation: "Procurement Manager", role: Role.PROCUREMENT_MANAGER,
      dateOfJoining: "2025-08-01", workLocation: "Surat",
      currentAddress: addr("Surat Station"), permanentAddress: addr("Surat Station") },

    // ── MUMBAI CITY ──────────────────────────────────────────────────────
    { id: "EDB-CM-MUM1", cityId: mumbai.id, loginMobile: "9200000001", mobile: "9200000001",
      firstName: "Rahul",   lastName: "Nair",    fullName: "Rahul Nair",
      email: "rahul.cm@cleancar.com", dob: "1984-07-25", gender: "Male",
      designation: "City Manager", role: Role.CITY_MANAGER,
      dateOfJoining: "2025-09-01", workLocation: "Mumbai",
      currentAddress: maddr("Andheri West"), permanentAddress: maddr("Andheri West") },

    { id: "EDB-SUP-MUM1",cityId: mumbai.id, loginMobile: "9200000002", mobile: "9200000002",
      firstName: "Santosh", lastName: "Yadav",   fullName: "Santosh Yadav",
      email: "santosh.sup@cleancar.com", dob: "1993-02-10", gender: "Male",
      designation: "Supervisor", role: Role.SUPERVISOR,
      dateOfJoining: "2025-09-15", workLocation: "Mumbai",
      currentAddress: maddr("Goregaon"), permanentAddress: maddr("Goregaon") },

    { id: "EDB-CW-MUM1A",cityId: mumbai.id, loginMobile: "9200000003", mobile: "9200000003",
      firstName: "Ajay",    lastName: "Gupta",   fullName: "Ajay Gupta",
      email: "ajay.cw@cleancar.com", dob: "1999-05-05", gender: "Male",
      designation: "Car Washer", role: Role.CAR_WASHER,
      dateOfJoining: "2025-10-01", workLocation: "Mumbai",
      skillLevel: SkillLevel.SKILLED,
      currentAddress: maddr("Malad"), permanentAddress: maddr("Malad") },

    { id: "EDB-TSE-MUM1",cityId: mumbai.id, loginMobile: "9200000004", mobile: "9200000004",
      firstName: "Kavya",   lastName: "Rao",     fullName: "Kavya Rao",
      email: "kavya.tse@cleancar.com", dob: "1996-10-18", gender: "Female",
      designation: "Tele Sales Executive", role: Role.TSE,
      dateOfJoining: "2025-10-01", workLocation: "Mumbai",
      currentAddress: maddr("Borivali"), permanentAddress: maddr("Borivali") },
  ];

  let created = 0;
  for (const emp of employees) {
    await prisma.employee.upsert({
      where: { id: emp.id },
      update: {},
      create: { ...baseEmp, ...emp } as any,
    });
    created++;
  }
  console.log(`✅ Employees seeded: ${created} accounts across all roles`);

  // ── Salary Structures ────────────────────────────────────────────────────
  const salaries: Record<string, number> = {
    "EDB-SA-01":   80000, "EDB-ADM-01":  55000, "EDB-CM-SUR1":  65000,
    "EDB-SOM-SUR1":60000, "EDB-OM-SUR1": 45000, "EDB-CLM-SUR1": 40000,
    "EDB-SUP-SUR1":30000, "EDB-SUP-SUR2":28000, "EDB-CW-SUR1A": 16000,
    "EDB-CW-SUR1B":14000, "EDB-TSM-SUR1":38000, "EDB-TSE-SUR1": 22000,
    "EDB-TSE-SUR2":20000, "EDB-CCE-SUR1":20000, "EDB-SH-SUR1":  70000,
    "EDB-SM-SUR1":  45000, "EDB-HR-SUR1":  35000, "EDB-ACC-SUR1": 35000,
    "EDB-STM-SUR1": 30000, "EDB-PM-SUR1":  38000, "EDB-CM-MUM1":  70000,
    "EDB-SUP-MUM1": 32000, "EDB-CW-MUM1A": 18000, "EDB-TSE-MUM1": 24000,
  };
  for (const [empId, basic] of Object.entries(salaries)) {
    const hra = Math.round(basic * 0.4);
    const conveyance = 1600;
    const special = Math.round(basic * 0.1);
    const ctc = basic + hra + conveyance + special;
    const existing = await prisma.salaryStructure.findUnique({ where: { employeeId: empId } });
    if (!existing) {
      await prisma.salaryStructure.create({
        data: {
          employeeId: empId, basicSalary: basic, hra,
          conveyanceAllowance: conveyance, specialAllowance: special,
          ctc, pfApplicable: true, esicApplicable: basic <= 21000,
          ptApplicable: true, tdsRate: 0, effectiveFrom: "2025-08-01",
        },
      });
    }
  }
  console.log("✅ Salary structures seeded");

  // ── Leave Balances ───────────────────────────────────────────────────────
  for (const emp of employees) {
    const existing = await prisma.leaveBalance.findUnique({ where: { employeeId: emp.id } });
    if (!existing) {
      await prisma.leaveBalance.create({
        data: { employeeId: emp.id, year: 2026, casualLeave: 12, sickLeave: 7, earnedLeave: 15, compOff: 0 },
      });
    }
  }
  console.log("✅ Leave balances seeded");

  // ── Budget targets ───────────────────────────────────────────────────────
  const months = ["2026-04","2026-05","2026-06","2026-07","2026-08","2026-09"];
  for (const city of [surat, mumbai]) {
    for (const month of months) {
      await prisma.budget.upsert({
        where: { cityId_month: { cityId: city.id, month } },
        update: {},
        create: {
          cityId: city.id, month,
          revenueTarget: city.id === surat.id ? 500000 : 750000,
          expenseBudget: city.id === surat.id ? 350000 : 500000,
          profitTarget:  city.id === surat.id ? 150000 : 250000,
          createdBy: "EDB-SA-01",
        },
      });
    }
  }
  console.log("✅ Budget targets seeded");

  // ── Inventory items ──────────────────────────────────────────────────────
  const items = [
    { itemName: "Car Shampoo",          category: "Cleaning Supplies", unit: "L",   centralStock: 100, reorderLevel: 20, costPerUnit: 180 },
    { itemName: "Microfibre Cloth",     category: "Consumables",       unit: "Pcs", centralStock: 200, reorderLevel: 50, costPerUnit: 85  },
    { itemName: "Tyre Dressing Liquid", category: "Cleaning Supplies", unit: "L",   centralStock: 50,  reorderLevel: 10, costPerUnit: 320 },
    { itemName: "Dashboard Polish",     category: "Cleaning Supplies", unit: "L",   centralStock: 30,  reorderLevel: 8,  costPerUnit: 280 },
    { itemName: "Glass Cleaner",        category: "Cleaning Supplies", unit: "L",   centralStock: 60,  reorderLevel: 15, costPerUnit: 150 },
    { itemName: "Wax Polish",           category: "Cleaning Supplies", unit: "Kg",  centralStock: 25,  reorderLevel: 5,  costPerUnit: 650 },
    { itemName: "Wash Bucket",          category: "Equipment",         unit: "Pcs", centralStock: 50,  reorderLevel: 10, costPerUnit: 120 },
    { itemName: "Pressure Washer Hose", category: "Equipment",         unit: "Pcs", centralStock: 20,  reorderLevel: 5,  costPerUnit: 800 },
    { itemName: "Foam Gun",             category: "Equipment",         unit: "Pcs", centralStock: 15,  reorderLevel: 3,  costPerUnit: 1200},
    { itemName: "Detailing Brush Set",  category: "Tools",             unit: "Box", centralStock: 30,  reorderLevel: 8,  costPerUnit: 450 },
  ];
  for (const item of items) {
    const existing = await prisma.inventoryItem.findFirst({
      where: { cityId: surat.id, itemName: item.itemName }
    });
    if (!existing) {
      await prisma.inventoryItem.create({ data: { ...item, cityId: surat.id } });
    }
    const existingM = await prisma.inventoryItem.findFirst({
      where: { cityId: mumbai.id, itemName: item.itemName }
    });
    if (!existingM) {
      await prisma.inventoryItem.create({
        data: { ...item, cityId: mumbai.id, centralStock: Math.round(item.centralStock * 1.5) }
      });
    }
  }
  console.log("✅ Inventory items seeded (10 items × 2 cities)");

  // ── Summary ──────────────────────────────────────────────────────────────
  console.log("\n══════════════════════════════════════════════════════");
  console.log("  CleanCar 360° Seed Complete ✅");
  console.log("══════════════════════════════════════════════════════");
  console.log("  All logins use password: Demo@1234");
  console.log("──────────────────────────────────────────────────────");
  console.log("  SURAT CITY:");
  console.log("  9100000001 → Super Admin    (Rajesh Patel)");
  console.log("  9100000002 → Admin          (Amit Shah)");
  console.log("  9100000003 → City Manager   (Suresh Agarwal)");
  console.log("  9100000004 → Sr Ops Manager (Deepak Verma)");
  console.log("  9100000005 → Ops Manager    (Vikram Joshi)");
  console.log("  9100000006 → Cluster Mgr    (Rohan Mehta)");
  console.log("  9100000007 → Supervisor     (Harish Solanki)");
  console.log("  9100000008 → Supervisor     (Bhavesh Modi)");
  console.log("  9100000009 → Car Washer     (Mahesh Bharwad)");
  console.log("  9100000010 → Car Washer     (Ramesh Koli)");
  console.log("  9100000011 → Sales Head     (Kiran Patel)");
  console.log("  9100000012 → Sales Manager  (Ankita Jain)");
  console.log("  9100000013 → HR Manager     (Sneha Trivedi)");
  console.log("  9100000014 → Accounts Mgr   (Mohan Gupta)");
  console.log("  9100000015 → Store Manager  (Jayesh Patil)");
  console.log("  9100000016 → TSM            (Neha Desai)");
  console.log("  9100000017 → TSE            (Pooja Sharma)");
  console.log("  9100000018 → CCE            (Priya Mehta)");
  console.log("  9100000019 → TSE            (Ravi Kumar)");
  console.log("  9100000020 → Procurement    (Dinesh Chauhan)");
  console.log("──────────────────────────────────────────────────────");
  console.log("  MUMBAI CITY:");
  console.log("  9200000001 → City Manager   (Rahul Nair)");
  console.log("  9200000002 → Supervisor     (Santosh Yadav)");
  console.log("  9200000003 → Car Washer     (Ajay Gupta)");
  console.log("  9200000004 → TSE            (Kavya Rao)");
  console.log("══════════════════════════════════════════════════════\n");
}

main()
  .catch(e => { console.error("❌ Seed error:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
