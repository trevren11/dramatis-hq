import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { talentProfiles, messages, conversations, conversationParticipants } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const contactFormSchema = z.object({
  username: z.string().min(1),
  senderName: z.string().min(1, "Name is required").max(100),
  senderEmail: z.string().email("Valid email is required").max(255),
  subject: z.string().max(255).optional(),
  message: z.string().min(10, "Message must be at least 10 characters").max(5000),
});

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body: unknown = await request.json();
    const parsed = contactFormSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { username, senderName, senderEmail, subject, message } = parsed.data;

    // Find the talent profile by username
    const profile = await db.query.talentProfiles.findFirst({
      where: and(eq(talentProfiles.publicProfileSlug, username), eq(talentProfiles.isPublic, true)),
      columns: {
        id: true,
        userId: true,
        publicSections: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Check if contact is enabled for this profile
    const publicSections = profile.publicSections as { contact?: boolean } | null;
    if (!publicSections?.contact) {
      return NextResponse.json(
        { error: "Contact is not enabled for this profile" },
        { status: 403 }
      );
    }

    // Create a system conversation for the contact form submission
    // This allows the talent to receive and respond through the messaging system
    const [conversation] = await db
      .insert(conversations)
      .values({
        subject: subject ?? `Contact from ${senderName}`,
        type: "direct",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    if (!conversation) {
      return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 });
    }

    // Add the talent as a participant
    await db.insert(conversationParticipants).values({
      conversationId: conversation.id,
      userId: profile.userId,
      joinedAt: new Date(),
    });

    // Create the initial message with contact info
    const messageContent = `**Contact Form Submission**

**From:** ${senderName}
**Email:** ${senderEmail}
${subject ? `**Subject:** ${subject}` : ""}

---

${message}

---
*This message was sent via the public profile contact form. Reply directly to respond to ${senderEmail}.*`;

    await db.insert(messages).values({
      conversationId: conversation.id,
      senderId: profile.userId,
      content: messageContent,
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: "Your message has been sent successfully",
    });
  } catch (error) {
    console.error("Error processing contact form:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
