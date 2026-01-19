import { z } from "zod";

export enum CsvColumn {
  Name = "name",
  Email = "email",
  Tenant = "tenant",
  Roles = "roles",
  LastLogin = "last_login",
  LoginsCount = "logins_count",
  EmailVerified = "email_verified",
  Blocked = "blocked",
  Auth0Sub = "auth0_sub",
  CreatedAt = "created_at",
  UpdatedAt = "updated_at",
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const CsvRowRawSchema = z.object({
  name: z.string().nullable(),
  email: z.string(),
  tenant: z.string(),
  roles: z.string().optional(),
  last_login: z.string().optional(),
  logins_count: z.string().optional(),
  email_verified: z.boolean().optional(),
  blocked: z.boolean().optional(),
  auth0_sub: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type CsvRowRaw = z.infer<typeof CsvRowRawSchema>;
