import { randomBytes } from "node:crypto";

import { dbQuery, hasDatabase } from "../db/postgres";

export type AuditLogInput = {
  actorUserId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  oldValue?: unknown;
  newValue?: unknown;
};

function auditId() {
  return `aud-${Date.now().toString(36)}-${randomBytes(8).toString("hex")}`;
}

export async function logAdminAction(input: AuditLogInput) {
  if (!hasDatabase()) {
    return;
  }

  try {
    await dbQuery(
      `insert into audit_log (
        id, actor_user_id, action, entity_type, entity_id, old_value, new_value
       ) values ($1,$2,$3,$4,$5,$6::jsonb,$7::jsonb)`,
      [
        auditId(),
        input.actorUserId ?? null,
        input.action,
        input.entityType,
        input.entityId ?? null,
        JSON.stringify(input.oldValue ?? null),
        JSON.stringify(input.newValue ?? null),
      ],
    );
  } catch (error) {
    console.error("Audit log write failed", error);
  }
}
