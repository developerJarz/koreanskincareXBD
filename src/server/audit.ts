import { after, type NextRequest } from "next/server";

import { AuditLog, type UserDocument } from "@/server/db/models";
import { getClientIp } from "@/server/security/rate-limit";

type AuditEntry = {
  /** Machine key, e.g. "order.status" */
  action: string;
  /** One readable sentence, e.g. 'Changed order NB-000123 to "shipped"' */
  summary: string;
  entity?: string;
  entityId?: string;
  meta?: Record<string, unknown>;
};

/**
 * Records a team member's change in the audit log. The write runs after the response is sent,
 * so it never slows the action down, and a logging failure never fails the action.
 */
export function audit(request: NextRequest, actor: UserDocument, entry: AuditEntry) {
  const doc = {
    actor: actor._id,
    actorName: actor.name,
    actorEmail: actor.email,
    actorRole: actor.role,
    action: entry.action,
    summary: entry.summary.slice(0, 500),
    entity: entry.entity,
    entityId: entry.entityId,
    meta: entry.meta,
    ip: getClientIp(request),
    userAgent: request.headers.get("user-agent")?.slice(0, 300) ?? undefined,
  };
  after(() =>
    AuditLog.create(doc).then(
      () => undefined,
      (err) => console.error("Failed to write audit log:", err),
    ),
  );
}
