import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/server/db/connection";
import { Expense } from "@/server/db/models";
import { requirePermission } from "@/server/auth/permissions";
import { serverError } from "@/server/auth/session";
import { audit } from "@/server/audit";
import { isObjectId } from "@/server/security/validation";
import { formatMoney } from "@/lib/invoice";
import { cleanExpense } from "@/server/expenses";

type Ctx = { params: Promise<{ id: string }> };

// PUT — Edit an expense
export async function PUT(request: NextRequest, { params }: Ctx) {
  try {
    const auth = await requirePermission(request, "finance.manage");
    if (!auth.ok) return auth.response;
    const { id } = await params;
    if (!isObjectId(id)) return NextResponse.json({ error: "Expense not found." }, { status: 404 });

    const result = cleanExpense(await request.json().catch(() => ({})));
    if (!result.ok) {
      return NextResponse.json({ error: "Please fix the highlighted fields.", fields: result.fields }, { status: 400 });
    }

    await connectDB();
    const expense = await Expense.findByIdAndUpdate(id, result.value, { new: true });
    if (!expense) return NextResponse.json({ error: "Expense not found." }, { status: 404 });
    audit(request, auth.user, {
      action: "expense.update",
      summary: `Edited expense “${expense.title}” (${formatMoney(expense.amount)})`,
      entity: "Expense",
      entityId: id,
    });
    return NextResponse.json(expense.toJSON());
  } catch (err) {
    return serverError("Update expense error", err, "Couldn't save the expense.");
  }
}

// DELETE — Remove an expense
export async function DELETE(request: NextRequest, { params }: Ctx) {
  try {
    const auth = await requirePermission(request, "finance.manage");
    if (!auth.ok) return auth.response;
    const { id } = await params;
    if (!isObjectId(id)) return NextResponse.json({ error: "Expense not found." }, { status: 404 });

    await connectDB();
    const expense = await Expense.findByIdAndDelete(id);
    if (!expense) return NextResponse.json({ error: "Expense not found." }, { status: 404 });
    audit(request, auth.user, {
      action: "expense.delete",
      summary: `Deleted expense “${expense.title}” (${formatMoney(expense.amount)})`,
      entity: "Expense",
      entityId: id,
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    return serverError("Delete expense error", err, "Couldn't delete the expense.");
  }
}
