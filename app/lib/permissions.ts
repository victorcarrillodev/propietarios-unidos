import type { UserRole } from "./enums";

export const MODULES = [
  "members",
  "finance",
  "records",
  "documents",
  "inbox",
  "content",
  "users",
  "settings",
  "audit",
] as const;
export type AppModule = (typeof MODULES)[number];

const ROLE_MODULES: Record<UserRole, readonly AppModule[]> = {
  admin: MODULES,
  tesoreria: ["members", "finance", "records", "documents"],
  secretaria: ["members", "records", "documents", "inbox", "content"],
  comunicacion: ["records", "inbox", "content"],
};

export function can(role: UserRole, module: AppModule): boolean {
  return ROLE_MODULES[role].includes(module);
}

export function modulesFor(role: UserRole): readonly AppModule[] {
  return ROLE_MODULES[role];
}
