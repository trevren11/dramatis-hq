/* eslint-disable @typescript-eslint/no-non-null-assertion, @typescript-eslint/restrict-template-expressions */
/**
 * Notifications Seed
 *
 * Seeds in-app notifications for users and notification preferences.
 */

import { db, randomDate, randomPick, randomInt, randomBool } from "./base";
import * as schema from "../schema";

interface NotificationTemplate {
  type: (typeof schema.IN_APP_NOTIFICATION_TYPE_VALUES)[number];
  title: string;
  body: string;
  data?: {
    url?: string;
    entityType?: string;
    entityId?: string;
  };
}

const NOTIFICATION_TEMPLATES: NotificationTemplate[] = [
  {
    type: "new_message",
    title: "New message from {sender}",
    body: "You have a new message regarding your audition.",
    data: { url: "/messages", entityType: "message" },
  },
  {
    type: "schedule_change",
    title: "Schedule Update",
    body: "The rehearsal on {date} has been moved to {new_time}.",
    data: { url: "/talent/calendar", entityType: "schedule" },
  },
  {
    type: "rehearsal_reminder",
    title: "Rehearsal Tomorrow",
    body: "Don't forget: Rehearsal tomorrow at {time} at {location}.",
    data: { url: "/talent/calendar", entityType: "event" },
  },
  {
    type: "callback_notification",
    title: "Callback Invitation!",
    body: "You've been invited to a callback for {show_name}!",
    data: { url: "/auditions", entityType: "audition" },
  },
  {
    type: "cast_decision",
    title: "Casting Update",
    body: "A decision has been made for your audition for {show_name}.",
    data: { url: "/auditions", entityType: "application" },
  },
  {
    type: "document_shared",
    title: "New Script Available",
    body: "The script for {show_name} has been shared with you.",
    data: { url: "/talent/materials", entityType: "script" },
  },
  {
    type: "comment_mention",
    title: "You were mentioned",
    body: "{user_name} mentioned you in a comment.",
    data: { url: "/notifications", entityType: "comment" },
  },
  {
    type: "audition_submission",
    title: "New Audition Submission",
    body: "A new self-tape has been submitted for {role_name}.",
    data: { url: "/producer/dashboard", entityType: "submission" },
  },
  {
    type: "system_announcement",
    title: "Platform Update",
    body: "We've added new features to help you manage your auditions!",
    data: { url: "/notifications" },
  },
];

const SENDERS = [
  "Broadway Productions",
  "City Theater Company",
  "Sarah Mitchell",
  "David Chen",
  "The Production Team",
];

const SHOW_NAMES = ["The Music Man", "Les Miserables", "Chicago", "Hamilton", "Wicked"];

const ROLES = ["Harold Hill", "Jean Valjean", "Roxie Hart", "Aaron Burr", "Elphaba"];

interface NotificationsSeedOptions {
  minNotifications?: number;
  maxNotifications?: number;
  unreadPercentage?: number;
}

export async function seedNotifications(
  users: { id: string; userType: "talent" | "producer" | "admin" }[],
  options: NotificationsSeedOptions = {}
): Promise<{
  notifications: { id: string; userId: string }[];
}> {
  const { minNotifications = 5, maxNotifications = 15, unreadPercentage = 0.4 } = options;

  const notifications: { id: string; userId: string }[] = [];

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  for (const user of users) {
    // Create notification preferences
    await db
      .insert(schema.notificationPreferences)
      .values({
        userId: user.id,
        pushEnabled: randomBool(0.7),
        newMessage: true,
        scheduleChange: true,
        rehearsalReminder: true,
        callbackNotification: true,
        castDecision: true,
        documentShared: randomBool(0.9),
        commentMention: randomBool(0.8),
        auditionSubmission: user.userType === "producer",
        systemAnnouncement: randomBool(0.6),
        dndEnabled: randomBool(0.2),
        dndStart: randomBool(0.2) ? "22:00" : null,
        dndEnd: randomBool(0.2) ? "08:00" : null,
      })
      .onConflictDoNothing();

    // Create notifications based on user type
    const notificationCount = randomInt(minNotifications, maxNotifications);

    // Filter templates based on user type
    const relevantTemplates = NOTIFICATION_TEMPLATES.filter((t) => {
      if (user.userType === "producer") {
        return ["audition_submission", "new_message", "system_announcement"].includes(t.type);
      }
      return t.type !== "audition_submission";
    });

    for (let i = 0; i < notificationCount; i++) {
      const template = randomPick(relevantTemplates);
      const createdAt = randomDate(thirtyDaysAgo, now);
      const isRead = randomBool(1 - unreadPercentage);

      // Replace placeholders in title and body
      const title = template.title
        .replace("{sender}", randomPick(SENDERS))
        .replace("{user_name}", randomPick(SENDERS));
      const body = template.body
        .replace("{show_name}", randomPick(SHOW_NAMES))
        .replace("{role_name}", randomPick(ROLES))
        .replace("{date}", "tomorrow")
        .replace("{new_time}", "3:00 PM")
        .replace("{time}", "2:00 PM")
        .replace("{location}", "Main Stage");

      const [notification] = await db
        .insert(schema.inAppNotifications)
        .values({
          userId: user.id,
          type: template.type,
          title,
          body,
          data: template.data,
          readAt: isRead ? randomDate(createdAt, now) : null,
          clickedAt: isRead && randomBool(0.5) ? randomDate(createdAt, now) : null,
          createdAt,
        })
        .returning({ id: schema.inAppNotifications.id });

      notifications.push({ id: notification!.id, userId: user.id });
    }
  }

  console.log(`Created ${notifications.length} notifications`);

  return { notifications };
}
