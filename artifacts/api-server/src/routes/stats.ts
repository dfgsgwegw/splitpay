import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { splitsTable, paymentsTable } from "@workspace/db";
import { eq, inArray, sql } from "drizzle-orm";
import { appConfig } from "../lib/config";

const router: IRouter = Router();

router.get("/stats/for-user/:address", async (req, res) => {
  const address = req.params.address.toLowerCase();

  // Splits created by this address.
  const createdRows = await db
    .select({ id: splitsTable.id })
    .from(splitsTable)
    .where(eq(splitsTable.creatorAddress, address));
  const createdIds = createdRows.map((r) => r.id);

  // Splits this user has paid into.
  const paidSplitRows = await db
    .selectDistinct({ splitId: paymentsTable.splitId })
    .from(paymentsTable)
    .where(eq(paymentsTable.payerAddress, address));
  const paidSplitIds = paidSplitRows.map((r) => r.splitId);

  // Union of involved split ids.
  const involvedSet = new Set<string>([...createdIds, ...paidSplitIds]);
  const involvedIds = Array.from(involvedSet);

  let totalVolume = "0";
  let totalParticipantsPaid = 0;
  let activeSplits = 0;

  if (involvedIds.length) {
    // Total USDC volume: sum payments across all involved splits.
    const [volRow] = await db
      .select({
        sum: sql<string>`coalesce(sum(amount::numeric), 0)::text`,
        count: sql<number>`count(*)::int`,
      })
      .from(paymentsTable)
      .where(inArray(paymentsTable.splitId, involvedIds));
    totalVolume = String(volRow?.sum ?? "0");
    totalParticipantsPaid = volRow?.count ?? 0;

    // Active splits: of the involved splits, how many are not yet fully paid.
    const activeRes = await db.execute(sql`
      select count(*)::int as count
      from ${splitsTable} s
      left join (
        select split_id, count(*)::int as paid
        from ${paymentsTable}
        group by split_id
      ) p on p.split_id = s.id
      where s.id = any(${involvedIds})
        and coalesce(p.paid, 0) < s.participant_count
    `);
    const rows =
      (activeRes as unknown as { rows?: Array<{ count: number }> }).rows ??
      (activeRes as unknown as Array<{ count: number }>);
    activeSplits = Number(rows?.[0]?.count ?? 0);
  }

  res.json({
    totalSplits: involvedIds.length,
    totalVolume,
    totalParticipantsPaid,
    activeSplits,
  });
});

router.get("/stats", async (_req, res) => {
  const [splits] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(splitsTable);
  const [payments] = await db
    .select({
      count: sql<number>`count(*)::int`,
      sum: sql<string>`coalesce(sum(amount::numeric), 0)::text`,
    })
    .from(paymentsTable);

  // Split is "active" if it isn't fully paid (paid_count < participant_count).
  const activeRes = await db.execute(sql`
    select count(*)::int as count
    from ${splitsTable} s
    left join (
      select split_id, count(*)::int as paid
      from ${paymentsTable}
      group by split_id
    ) p on p.split_id = s.id
    where coalesce(p.paid, 0) < s.participant_count
  `);
  const activeRows =
    (activeRes as unknown as { rows?: Array<{ count: number }> }).rows ??
    (activeRes as unknown as Array<{ count: number }>);
  const activeCount = Number(activeRows?.[0]?.count ?? 0);

  res.json({
    totalSplits: splits?.count ?? 0,
    totalVolume: String(payments?.sum ?? "0"),
    totalParticipantsPaid: payments?.count ?? 0,
    activeSplits: activeCount,
  });
});

router.get("/config", (_req, res) => {
  res.json(appConfig);
});

export default router;
