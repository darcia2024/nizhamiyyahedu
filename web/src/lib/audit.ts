import { db } from "@/lib/db";
import type { CurrentUser } from "@/lib/auth-guard";

export async function audit(
  actor: Pick<CurrentUser, "id" | "name" | "email">,
  action: string,
  targetType: string,
  targetId: string,
  opts: { before?: unknown; after?: unknown; reason?: string } = {},
) {
  await db.auditLog.create({
    data: {
      actorId: actor.id,
      actorName: actor.name ?? actor.email,
      action,
      targetType,
      targetId,
      before: opts.before === undefined ? null : JSON.stringify(opts.before),
      after: opts.after === undefined ? null : JSON.stringify(opts.after),
      reason: opts.reason ?? null,
    },
  });
}
