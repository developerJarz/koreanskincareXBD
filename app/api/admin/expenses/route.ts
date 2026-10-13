import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/server/db/connection";
import { Expense } from "@/server/db/models";
import { requirePermission } from "@/server/auth/permissions";
import { serverError } from "@/server/auth/session";
import { audit } from "@/server/audit";
import { cleanExpense } from "@/server/expenses";
import { formatMoney } from "@/lib/invoice";

// POST — Record an expense
export async function POST(request: NextRequest) {
  try {
    const auth = await requirePermission(request, "finance.manage");
    if (!auth.ok) return auth.response;

    const result = cleanExpense(await request.json().catch(() => ({})));
    if (!result.ok) {
      return NextResponse.json({ error: "Please fix the highlighted fields.", fields: result.fields }, { status: 400 });
    }

    await connectDB();
    const expense = await Expense.create({ ...result.value, createdBy: auth.user._id });
    audit(request, auth.user, {
      action: "expense.create",
      summary: `Recorded expense “${expense.title}” (${formatMoney(expense.amount)})`,
      entity: "Expense",
      entityId: expense._id.toString(),
    });
    return NextResponse.json(expense.toJSON(), { status: 201 });
  } catch (err) {
    return serverError("Create expense error", err, "Couldn't save the expense.");
  }
}
