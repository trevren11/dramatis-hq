import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { shows, producerProfiles, budgetLines, expenses } from "@/lib/db/schema";
import { budgetLineUpdateSchema } from "@/lib/validations/budget";
import { eq } from "drizzle-orm";

interface RouteParams {
  params: Promise<{ id: string; lineId: string }>;
}

export async function GET(_request: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: showId, lineId } = await params;

    const show = await db.query.shows.findFirst({
      where: eq(shows.id, showId),
    });

    if (!show) {
      return NextResponse.json({ error: "Show not found" }, { status: 404 });
    }

    const producerProfile = await db.query.producerProfiles.findFirst({
      where: eq(producerProfiles.userId, session.user.id),
    });

    if (producerProfile?.id !== show.organizationId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const line = await db.query.budgetLines.findFirst({
      where: eq(budgetLines.id, lineId),
    });

    if (!line) {
      return NextResponse.json({ error: "Budget line not found" }, { status: 404 });
    }

    // Get expenses for this line
    const lineExpenses = await db.query.expenses.findMany({
      where: eq(expenses.budgetLineId, lineId),
      orderBy: (expenses, { desc }) => [desc(expenses.date)],
    });

    const totalSpent = lineExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

    return NextResponse.json({
      line: {
        ...line,
        actualSpent: String(totalSpent),
        expenseCount: lineExpenses.length,
        remaining: String(Number(line.budgetedAmount) - totalSpent),
      },
      expenses: lineExpenses,
    });
  } catch (error) {
    console.error("Error fetching budget line:", error);
    return NextResponse.json({ error: "Failed to fetch budget line" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: showId, lineId } = await params;

    const show = await db.query.shows.findFirst({
      where: eq(shows.id, showId),
    });

    if (!show) {
      return NextResponse.json({ error: "Show not found" }, { status: 404 });
    }

    const producerProfile = await db.query.producerProfiles.findFirst({
      where: eq(producerProfiles.userId, session.user.id),
    });

    if (producerProfile?.id !== show.organizationId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const line = await db.query.budgetLines.findFirst({
      where: eq(budgetLines.id, lineId),
    });

    if (!line) {
      return NextResponse.json({ error: "Budget line not found" }, { status: 404 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const parsed = budgetLineUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const updateData: Partial<typeof budgetLines.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (parsed.data.category !== undefined) updateData.category = parsed.data.category;
    if (parsed.data.customCategoryName !== undefined)
      updateData.customCategoryName = parsed.data.customCategoryName;
    if (parsed.data.description !== undefined) updateData.description = parsed.data.description;
    if (parsed.data.budgetedAmount !== undefined)
      updateData.budgetedAmount = String(parsed.data.budgetedAmount);
    if (parsed.data.sortOrder !== undefined) updateData.sortOrder = parsed.data.sortOrder;
    if (parsed.data.isActive !== undefined) updateData.isActive = parsed.data.isActive;

    const [updatedLine] = await db
      .update(budgetLines)
      .set(updateData)
      .where(eq(budgetLines.id, lineId))
      .returning();

    return NextResponse.json({ line: updatedLine });
  } catch (error) {
    console.error("Error updating budget line:", error);
    return NextResponse.json({ error: "Failed to update budget line" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: showId, lineId } = await params;

    const show = await db.query.shows.findFirst({
      where: eq(shows.id, showId),
    });

    if (!show) {
      return NextResponse.json({ error: "Show not found" }, { status: 404 });
    }

    const producerProfile = await db.query.producerProfiles.findFirst({
      where: eq(producerProfiles.userId, session.user.id),
    });

    if (producerProfile?.id !== show.organizationId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const line = await db.query.budgetLines.findFirst({
      where: eq(budgetLines.id, lineId),
    });

    if (!line) {
      return NextResponse.json({ error: "Budget line not found" }, { status: 404 });
    }

    // Check if there are expenses linked to this line
    const linkedExpenses = await db.query.expenses.findMany({
      where: eq(expenses.budgetLineId, lineId),
      limit: 1,
    });

    if (linkedExpenses.length > 0) {
      // Set expenses to have no budget line instead of deleting
      await db
        .update(expenses)
        .set({ budgetLineId: null, updatedAt: new Date() })
        .where(eq(expenses.budgetLineId, lineId));
    }

    await db.delete(budgetLines).where(eq(budgetLines.id, lineId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting budget line:", error);
    return NextResponse.json({ error: "Failed to delete budget line" }, { status: 500 });
  }
}
