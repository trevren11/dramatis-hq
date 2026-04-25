import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  shows,
  producerProfiles,
  expenses,
  ALLOWED_RECEIPT_FILE_TYPES,
  MAX_RECEIPT_FILE_SIZE,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";

const s3Client = new S3Client({
  region: process.env.AWS_REGION ?? "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET ?? "dramatis-receipts";

interface RouteParams {
  params: Promise<{ id: string; expenseId: string }>;
}

export async function GET(_request: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: showId, expenseId } = await params;

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

    const expense = await db.query.expenses.findFirst({
      where: eq(expenses.id, expenseId),
    });

    if (!expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    if (!expense.receiptS3Key) {
      return NextResponse.json({ error: "No receipt attached" }, { status: 404 });
    }

    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: expense.receiptS3Key,
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    return NextResponse.json({
      url: signedUrl,
      filename: expense.receiptFilename,
      mimeType: expense.receiptMimeType,
    });
  } catch (error) {
    console.error("Error getting receipt:", error);
    return NextResponse.json({ error: "Failed to get receipt" }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: showId, expenseId } = await params;

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

    const expense = await db.query.expenses.findFirst({
      where: eq(expenses.id, expenseId),
    });

    if (!expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (
      !ALLOWED_RECEIPT_FILE_TYPES.includes(file.type as (typeof ALLOWED_RECEIPT_FILE_TYPES)[number])
    ) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: PDF, JPEG, PNG, GIF, WebP" },
        { status: 400 }
      );
    }

    if (file.size > MAX_RECEIPT_FILE_SIZE) {
      const maxSizeMB = String(MAX_RECEIPT_FILE_SIZE / 1024 / 1024);
      return NextResponse.json(
        { error: `File too large. Maximum size: ${maxSizeMB}MB` },
        { status: 400 }
      );
    }

    // Delete old receipt if exists
    if (expense.receiptS3Key) {
      try {
        await s3Client.send(
          new DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: expense.receiptS3Key,
          })
        );
      } catch {
        console.warn("Failed to delete old receipt:", expense.receiptS3Key);
      }
    }

    // Generate unique S3 key
    const fileExt = file.name.split(".").pop() ?? "bin";
    const s3Key = `receipts/${showId}/${expenseId}/${crypto.randomUUID()}.${fileExt}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    await s3Client.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: s3Key,
        Body: buffer,
        ContentType: file.type,
        ContentDisposition: `inline; filename="${file.name}"`,
      })
    );

    const [updatedExpense] = await db
      .update(expenses)
      .set({
        receiptS3Key: s3Key,
        receiptFilename: file.name,
        receiptMimeType: file.type,
        receiptUrl: `https://${BUCKET_NAME}.s3.amazonaws.com/${s3Key}`,
        updatedAt: new Date(),
      })
      .where(eq(expenses.id, expenseId))
      .returning();

    return NextResponse.json({ expense: updatedExpense }, { status: 201 });
  } catch (error) {
    console.error("Error uploading receipt:", error);
    return NextResponse.json({ error: "Failed to upload receipt" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const session = await auth();
    if (!session?.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: showId, expenseId } = await params;

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

    const expense = await db.query.expenses.findFirst({
      where: eq(expenses.id, expenseId),
    });

    if (!expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    if (!expense.receiptS3Key) {
      return NextResponse.json({ error: "No receipt to delete" }, { status: 404 });
    }

    try {
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: BUCKET_NAME,
          Key: expense.receiptS3Key,
        })
      );
    } catch {
      console.warn("Failed to delete receipt from S3:", expense.receiptS3Key);
    }

    const [updatedExpense] = await db
      .update(expenses)
      .set({
        receiptS3Key: null,
        receiptFilename: null,
        receiptMimeType: null,
        receiptUrl: null,
        updatedAt: new Date(),
      })
      .where(eq(expenses.id, expenseId))
      .returning();

    return NextResponse.json({ expense: updatedExpense });
  } catch (error) {
    console.error("Error deleting receipt:", error);
    return NextResponse.json({ error: "Failed to delete receipt" }, { status: 500 });
  }
}
