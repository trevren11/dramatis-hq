/* eslint-disable @typescript-eslint/no-non-null-assertion, @typescript-eslint/restrict-template-expressions, complexity */
/**
 * Messages & Conversations Seed
 *
 * Seeds conversations and messages between users.
 */

import { eq } from "drizzle-orm";
import { db, randomDate, randomPick, randomInt, randomBool } from "./base";
import * as schema from "../schema";

const MESSAGE_TEMPLATES = {
  producer_to_talent: [
    "Hi! We loved your audition and would like to invite you to callbacks.",
    "Thank you for your interest in our production. Can you share your availability for next week?",
    "Great work on the self-tape! We have a few follow-up questions.",
    "Congratulations! We'd like to offer you the role of {role}.",
    "Just checking in about the rehearsal schedule. Does everything work for you?",
    "Reminder: First read-through is this Saturday at 2pm.",
    "Can you confirm you've received the script PDF?",
    "We're excited to have you join the cast!",
  ],
  talent_to_producer: [
    "Thank you for the callback invitation! I'll be there.",
    "I'm available Monday through Wednesday next week.",
    "Just submitted my video. Let me know if you need anything else!",
    "I'm so excited to accept the role! Thank you!",
    "The rehearsal schedule works perfectly for me.",
    "Received the script, thank you! Looking forward to getting started.",
    "Quick question about the costume fitting - what should I wear?",
    "I had a conflict come up - is there any flexibility on the Tuesday rehearsal?",
  ],
  general: [
    "Thanks for getting back to me!",
    "Sounds good, I'll see you then.",
    "Perfect, that works for me.",
    "Let me check my schedule and get back to you.",
    "Sorry for the delay in responding.",
    "Great, looking forward to it!",
    "I have one more question...",
    "Thanks again!",
  ],
};

const CONVERSATION_SUBJECTS = [
  "Audition for The Music Man",
  "Callback Details",
  "Rehearsal Schedule Question",
  "Script and Materials",
  "Cast Announcement",
  "Costume Fitting",
  "Performance Dates",
  "Welcome to the Cast!",
  null, // Direct message without subject
  null,
  null,
];

interface MessagesSeedOptions {
  minConversations?: number;
  maxConversations?: number;
  minMessagesPerConversation?: number;
  maxMessagesPerConversation?: number;
}

export async function seedMessages(
  users: { id: string; userType: "talent" | "producer" | "admin" }[],
  options: MessagesSeedOptions = {}
): Promise<{
  conversations: { id: string }[];
  messages: { id: string; conversationId: string }[];
}> {
  const {
    minConversations = 3,
    maxConversations = 8,
    minMessagesPerConversation = 2,
    maxMessagesPerConversation = 10,
  } = options;

  const conversations: { id: string }[] = [];
  const messages: { id: string; conversationId: string }[] = [];

  const talentUsers = users.filter((u) => u.userType === "talent");
  const producerUsers = users.filter((u) => u.userType === "producer");

  if (talentUsers.length === 0 || producerUsers.length === 0) {
    console.log("Need both talent and producer users for messages");
    return { conversations, messages };
  }

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Create conversations between producers and talent
  const conversationCount = randomInt(minConversations, maxConversations);

  for (let i = 0; i < conversationCount; i++) {
    const producer = randomPick(producerUsers);
    const talent = randomPick(talentUsers);
    const subject = randomPick(CONVERSATION_SUBJECTS);
    const conversationStartDate = randomDate(thirtyDaysAgo, now);

    const [conversation] = await db
      .insert(schema.conversations)
      .values({
        type: "direct",
        subject,
        createdById: producer.id,
        lastMessageAt: conversationStartDate,
        createdAt: conversationStartDate,
      })
      .returning({ id: schema.conversations.id });

    conversations.push({ id: conversation!.id });

    // Add participants
    await db.insert(schema.conversationParticipants).values([
      {
        conversationId: conversation!.id,
        userId: producer.id,
        lastReadAt: randomBool(0.7) ? now : null,
        joinedAt: conversationStartDate,
      },
      {
        conversationId: conversation!.id,
        userId: talent.id,
        lastReadAt: randomBool(0.5) ? now : null,
        joinedAt: conversationStartDate,
      },
    ]);

    // Create message thread
    const messageCount = randomInt(minMessagesPerConversation, maxMessagesPerConversation);
    let lastMessageTime = conversationStartDate;

    for (let j = 0; j < messageCount; j++) {
      // Alternate between producer and talent, with some randomness
      const isProducerMessage = j === 0 ? true : randomBool(0.5);
      const senderId = isProducerMessage ? producer.id : talent.id;

      // Pick appropriate message content
      const templatePool = isProducerMessage
        ? [...MESSAGE_TEMPLATES.producer_to_talent, ...MESSAGE_TEMPLATES.general]
        : [...MESSAGE_TEMPLATES.talent_to_producer, ...MESSAGE_TEMPLATES.general];
      const content = randomPick(templatePool);

      // Message time is after the last message
      const minutesLater = randomInt(5, 60 * 24); // 5 mins to 1 day later
      const messageTime = new Date(lastMessageTime.getTime() + minutesLater * 60 * 1000);

      const [message] = await db
        .insert(schema.messages)
        .values({
          conversationId: conversation!.id,
          senderId,
          content,
          createdAt: messageTime,
        })
        .returning({ id: schema.messages.id });

      messages.push({ id: message!.id, conversationId: conversation!.id });
      lastMessageTime = messageTime;
    }

    // Update conversation's lastMessageAt
    await db
      .update(schema.conversations)
      .set({ lastMessageAt: lastMessageTime })
      .where(eq(schema.conversations.id, conversation!.id));
  }

  // Create message templates for producers
  for (const producer of producerUsers) {
    if (randomBool(0.6)) {
      await db.insert(schema.messageTemplates).values([
        {
          userId: producer.id,
          name: "Callback Invitation",
          subject: "Callback for {show_name}",
          content:
            "Dear {name},\n\nThank you for your audition! We would like to invite you to a callback. Please reply to confirm your availability.\n\nBest,\n{producer_name}",
        },
        {
          userId: producer.id,
          name: "Cast Offer",
          subject: "Congratulations! Role Offer for {show_name}",
          content:
            "Dear {name},\n\nWe are pleased to offer you the role of {role_name} in our production of {show_name}.\n\nPlease respond by {deadline} to accept.\n\nCongratulations!\n{producer_name}",
        },
      ]);
    }
  }

  console.log(`Created ${conversations.length} conversations`);
  console.log(`Created ${messages.length} messages`);

  return { conversations, messages };
}
