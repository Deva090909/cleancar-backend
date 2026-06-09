import { z } from 'zod';

export const loginSchema = z.object({
  loginMobile: z.string().min(10).max(15),
  password: z.string().min(6).max(100),
});
export type LoginDto = z.infer<typeof loginSchema>;

export const refreshTokenSchema = z.object({ refreshToken: z.string().min(1) });
export type RefreshTokenDto = z.infer<typeof refreshTokenSchema>;

export const forgotPasswordSchema = z.object({ loginMobile: z.string().min(10) });
export type ForgotPasswordDto = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  loginMobile: z.string().min(10),
  otp: z.string().length(6),
  newPassword: z.string().min(8).max(100),
});
export type ResetPasswordDto = z.infer<typeof resetPasswordSchema>;

export const changePasswordSchema = z.object({
  oldPassword: z.string().min(1),
  newPassword: z.string().min(8).max(100),
});
export type ChangePasswordDto = z.infer<typeof changePasswordSchema>;
