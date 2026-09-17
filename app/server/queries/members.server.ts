import { and, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import { members } from "~/db/schema";
import { MEMBER_STATUSES, MEMBER_TYPES, type MemberStatus, type MemberType } from "~/lib/enums";
import { likeEscape } from "~/lib/validation";

export type MemberFilters = { q: string; status: MemberStatus | ""; type: MemberType | "" };

export function readMemberFilters(url: URL): MemberFilters {
  const params = url.searchParams;
  const status = params.get("estado") ?? "";
  const type = params.get("tipo") ?? "";
  return {
    q: (params.get("q") ?? "").trim().slice(0, 100),
    status: (MEMBER_STATUSES as readonly string[]).includes(status) ? (status as MemberStatus) : "",
    type: (MEMBER_TYPES as readonly string[]).includes(type) ? (type as MemberType) : "",
  };
}

export function memberWhere({ q, status, type }: MemberFilters) {
  const conditions: SQL[] = [];
  if (status) conditions.push(eq(members.status, status));
  if (type) conditions.push(eq(members.memberType, type));
  if (q) {
    const like = `%${likeEscape(q)}%`;
    const byText = [
      sql`f_unaccent(${members.fullName}) ilike f_unaccent(${like})`,
      ilike(members.email, like),
      ilike(members.phone, like),
    ];
    if (/^\d{1,9}$/.test(q)) byText.push(eq(members.memberNumber, Number(q)));
    conditions.push(or(...byText)!);
  }
  return conditions.length > 0 ? and(...conditions) : undefined;
}
