import { EXPENSE_CATEGORIES, EXPENSE_METHODS } from "@/server/db/models";
import { cleanString } from "@/server/security/validation";

/** Validates an expense from the Finance tab. */
export function cleanExpense(body: any) {
  const fields: Record<string, string> = {};
  const title = cleanString(body?.title, 200);
  if (!title) fields.title = "What was this expense for?";
  const amount = Math.round(Number(body?.amount) * 100) / 100;
  if (!Number.isFinite(amount) || amount <= 0 || amount > 100_000_000)
    fields.amount = "Enter an amount above 0.";
  const category = EXPENSE_CATEGORIES.includes(body?.category) ? body.category : null;
  if (!category) fields.category = "Choose a category.";
  const rawDate = typeof body?.date === "string" ? body.date.slice(0, 10) : "";
  const date = rawDate ? new Date(`${rawDate}T12:00:00+06:00`) : new Date();
  if (Number.isNaN(date.getTime())) fields.date = "Choose a valid date.";
  const paidVia = (EXPENSE_METHODS as readonly string[]).includes(body?.paidVia)
    ? body.paidVia
    : "Cash";
  if (Object.keys(fields).length) return { ok: false as const, fields };
  return {
    ok: true as const,
    value: {
      title: title!,
      amount,
      category: category!,
      date,
      paidVia,
      notes: cleanString(body?.notes, 1000) || undefined,
    },
  };
}
