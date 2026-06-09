/**
 * types.ts — Local enum re-exports for TypeScript compilation
 * These match the enums in prisma/schema.prisma exactly.
 * In production, Prisma generates these — this file is only for IDE/compile support.
 */

export enum Role {
  SUPER_ADMIN            = "SUPER_ADMIN",
  ADMIN                  = "ADMIN",
  CITY_MANAGER           = "CITY_MANAGER",
  SR_OPERATIONS_MANAGER  = "SR_OPERATIONS_MANAGER",
  OPERATIONS_MANAGER     = "OPERATIONS_MANAGER",
  CLUSTER_MANAGER        = "CLUSTER_MANAGER",
  SUPERVISOR             = "SUPERVISOR",
  CAR_WASHER             = "CAR_WASHER",
  TSM                    = "TSM",
  TSE                    = "TSE",
  CCE                    = "CCE",
  SALES_HEAD             = "SALES_HEAD",
  SALES_MANAGER          = "SALES_MANAGER",
  HR                     = "HR",
  ACCOUNTS               = "ACCOUNTS",
  STORE_MANAGER          = "STORE_MANAGER",
  PROCUREMENT_MANAGER    = "PROCUREMENT_MANAGER",
}

export enum AccountStatus {
  PENDING_ONBOARDING = "PENDING_ONBOARDING",
  PENDING_PASSWORD   = "PENDING_PASSWORD",
  ACTIVE             = "ACTIVE",
  LOCKED             = "LOCKED",
  SUSPENDED          = "SUSPENDED",
}

export enum EmployeeStatus {
  ACTIVE   = "ACTIVE",
  ON_LEAVE = "ON_LEAVE",
  INACTIVE = "INACTIVE",
  EXITED   = "EXITED",
}

export enum AttendanceStatus {
  PRESENT  = "PRESENT",
  ABSENT   = "ABSENT",
  LATE     = "LATE",
  HALF_DAY = "HALF_DAY",
  LEAVE    = "LEAVE",
  WEEK_OFF = "WEEK_OFF",
}

export enum JobStatus {
  UNASSIGNED   = "UNASSIGNED",
  ASSIGNED     = "ASSIGNED",
  ACKNOWLEDGED = "ACKNOWLEDGED",
  IN_PROGRESS  = "IN_PROGRESS",
  COMPLETED    = "COMPLETED",
  VERIFIED     = "VERIFIED",
  FAILED       = "FAILED",
}

export enum LeadStatus {
  NEW              = "NEW",
  ATTEMPTED        = "ATTEMPTED",
  CALLBACK         = "CALLBACK",
  INTERESTED       = "INTERESTED",
  NOT_ANSWERED     = "NOT_ANSWERED",
  CONVERTED        = "CONVERTED",
  LOST             = "LOST",
  DEMO_SCHEDULED   = "DEMO_SCHEDULED",
  DEMO_COMPLETED   = "DEMO_COMPLETED",
  PAYMENT_PENDING  = "PAYMENT_PENDING",
  REJECTED         = "REJECTED",
}

export enum LeadSource {
  DIGITAL     = "DIGITAL",
  BTL_REFERRAL= "BTL_REFERRAL",
  WALK_IN     = "WALK_IN",
  SOCIAL_MEDIA= "SOCIAL_MEDIA",
  PARTNER     = "PARTNER",
  REFERRAL    = "REFERRAL",
  GOOGLE_ADS  = "GOOGLE_ADS",
}

export enum SubscriptionStatus {
  ACTIVE    = "ACTIVE",
  PAUSED    = "PAUSED",
  CANCELLED = "CANCELLED",
  EXPIRED   = "EXPIRED",
}

export enum PayrollStatus {
  DRAFT          = "DRAFT",
  PENDING_REVIEW = "PENDING_REVIEW",
  APPROVED       = "APPROVED",
  PROCESSED      = "PROCESSED",
  PAID           = "PAID",
  LOCKED         = "LOCKED",
}

export enum TrancheStatus {
  PENDING   = "PENDING",
  PAID      = "PAID",
  FORFEITED = "FORFEITED",
}

export enum ComplaintStatus {
  OPEN        = "OPEN",
  ASSIGNED    = "ASSIGNED",
  IN_PROGRESS = "IN_PROGRESS",
  RESOLVED    = "RESOLVED",
  ESCALATED   = "ESCALATED",
  CLOSED      = "CLOSED",
}

export enum PayableType {
  SALARY    = "SALARY",
  VENDOR    = "VENDOR",
  STATUTORY = "STATUTORY",
  UTILITY   = "UTILITY",
  RENT      = "RENT",
}

export enum PlanType {
  EXPRESS_WASH = "EXPRESS_WASH",
  SMART_WASH   = "SMART_WASH",
  ELITE_WASH   = "ELITE_WASH",
  ELITE_2W     = "ELITE_2W",
}

export enum AuditAction {
  CREATE  = "CREATE",
  UPDATE  = "UPDATE",
  DELETE  = "DELETE",
  LOGIN   = "LOGIN",
  LOGOUT  = "LOGOUT",
  APPROVE = "APPROVE",
  REJECT  = "REJECT",
  LOCK    = "LOCK",
  UNLOCK  = "UNLOCK",
}
