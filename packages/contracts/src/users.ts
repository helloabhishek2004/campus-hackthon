import { z } from "zod";

export const UserRoleSchema = z.enum([
  "student",
  "faculty",
  "department_head",
  "maintenance_officer",
  "security_officer",
  "admin",
]);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const UserProfileSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  full_name: z.string(),
  role: UserRoleSchema,
  department: z.string().nullable().optional(),
  student_id: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  avatar_url: z.string().url().nullable().optional(),
  created_at: z.string(),
});
export type UserProfile = z.infer<typeof UserProfileSchema>;
