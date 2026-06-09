import { z } from "zod";

export const createEmployeeSchema = z.object({
  id: z.string().min(1),
  cityId: z.string().min(1),
  firstName: z.string().min(1),
  middleName: z.string().optional(),
  lastName: z.string().min(1),
  fullName: z.string().min(1),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  gender: z.enum(["Male", "Female", "Other"]),
  mobile: z.string().min(10).max(15),
  email: z.string().email(),
  alternatePhone: z.string().optional(),
  currentAddress: z.record(z.any()),
  permanentAddress: z.record(z.any()),
  designation: z.string().min(1),
  role: z.enum(["SUPER_ADMIN","ADMIN","CITY_MANAGER","SR_OPERATIONS_MANAGER","OPERATIONS_MANAGER","CLUSTER_MANAGER","SUPERVISOR","CAR_WASHER","TSM","TSE","CCE","SALES_HEAD","SALES_MANAGER","HR","ACCOUNTS","STORE_MANAGER","PROCUREMENT_MANAGER"]),
  employeeType: z.enum(["FULL_TIME","PART_TIME","CONTRACT","INTERN"]).default("FULL_TIME"),
  dateOfJoining: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  workLocation: z.string().min(1),
  reportingManagerId: z.string().optional(),
  loginMobile: z.string().optional(),
  pinCodes: z.array(z.string()).default([]),
  panNumber: z.string().optional(),
  aadhaarNumber: z.string().optional(),
  pfNumber: z.string().optional(),
  esicNumber: z.string().optional(),
  uanNumber: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  bankIfsc: z.string().optional(),
  bankName: z.string().optional(),
  skillLevel: z.enum(["SKILLED","SEMI_SKILLED","UNSKILLED"]).default("SEMI_SKILLED"),
  departmentId: z.string().optional(),
});
export type CreateEmployeeDto = z.infer<typeof createEmployeeSchema>;

export const updateEmployeeSchema = createEmployeeSchema.partial().omit({ id: true });
export type UpdateEmployeeDto = z.infer<typeof updateEmployeeSchema>;

export const setPasswordSchema = z.object({ password: z.string().min(8) });
export type SetPasswordDto = z.infer<typeof setPasswordSchema>;

export const listEmployeeSchema = z.object({
  cityId: z.string().optional(),
  role: z.string().optional(),
  status: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(200).default(50),
});
export type ListEmployeeDto = z.infer<typeof listEmployeeSchema>;
