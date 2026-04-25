/* eslint-disable @typescript-eslint/no-non-null-assertion, @typescript-eslint/restrict-template-expressions, @typescript-eslint/no-unnecessary-condition, complexity */
/**
 * Materials Seed
 *
 * Seeds scripts and minus tracks for shows.
 * Note: These are metadata entries - no actual files are uploaded.
 */

import { db, randomPick, randomInt, randomBool } from "./base";
import * as schema from "../schema";

const SCRIPT_TITLES = [
  "Full Script",
  "Libretto",
  "Sides for Callbacks",
  "Act One Script",
  "Act Two Script",
  "Rehearsal Script",
  "Final Draft",
  "Production Script v2",
];

const REVISION_NOTES = [
  "Minor dialogue changes in Act 2",
  "Updated stage directions",
  "Final approved version",
  "Callback sides only",
  "Music cues added",
  "Director's notes incorporated",
  null,
  null,
];

const TRACK_TITLES = [
  "Overture",
  "Opening Number",
  "Act One Finale",
  "Act Two Opening",
  "The Big Number",
  "Love Ballad",
  "Comedy Song",
  "Finale",
  "Bows Music",
  "Exit Music",
  "Scene Change 1",
  "Scene Change 2",
  "Underscore - Dramatic",
  "Underscore - Romantic",
];

const MUSICAL_KEYS = ["C", "D", "E", "F", "G", "A", "Bb", "Eb", "Ab"];

interface MaterialsSeedOptions {
  minScripts?: number;
  maxScripts?: number;
  minTracks?: number;
  maxTracks?: number;
}

export async function seedMaterials(
  shows: { id: string; title: string; organizationId: string }[],
  users: { id: string; userType: "talent" | "producer" | "admin" }[],
  options: MaterialsSeedOptions = {}
): Promise<{
  scripts: { id: string; showId: string }[];
  tracks: { id: string; showId: string }[];
}> {
  const { minScripts = 1, maxScripts = 3, minTracks = 4, maxTracks = 12 } = options;

  const scripts: { id: string; showId: string }[] = [];
  const tracks: { id: string; showId: string }[] = [];

  const producerUsers = users.filter((u) => u.userType === "producer");
  const now = new Date();
  const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

  for (const show of shows) {
    const uploader = randomPick(producerUsers);

    // Create scripts for this show
    const scriptCount = randomInt(minScripts, maxScripts);
    for (let i = 0; i < scriptCount; i++) {
      const title = randomPick(SCRIPT_TITLES);
      const filename = `${show.title.toLowerCase().replace(/[^a-z0-9]/g, "-")}-script-v${i + 1}.pdf`;

      const [script] = await db
        .insert(schema.scripts)
        .values({
          showId: show.id,
          version: i + 1,
          isActive: i === scriptCount - 1, // Only latest version is active
          filename,
          originalFilename: `${title}.pdf`,
          mimeType: "application/pdf",
          fileSize: randomInt(500000, 5000000), // 500KB - 5MB
          s3Key: `shows/${show.id}/scripts/${filename}`,
          title,
          revisionNotes: randomPick(REVISION_NOTES),
          uploadedBy: uploader?.id ?? null,
          uploadedAt: new Date(sixMonthsAgo.getTime() + i * 7 * 24 * 60 * 60 * 1000),
        })
        .returning({ id: schema.scripts.id });

      scripts.push({ id: script!.id, showId: show.id });

      // Create permissions for the script - give all cast access
      await db
        .insert(schema.materialPermissions)
        .values({
          materialType: "script",
          materialId: script!.id,
          grantType: "all_cast",
          showId: show.id,
          canDownload: randomBool(0.7),
          canView: true,
          grantedBy: uploader?.id ?? null,
        })
        .onConflictDoNothing();
    }

    // Create minus tracks for this show
    const trackCount = randomInt(minTracks, maxTracks);
    const availableTitles = [...TRACK_TITLES];

    for (let i = 0; i < trackCount && availableTitles.length > 0; i++) {
      const titleIndex = randomInt(0, availableTitles.length - 1);
      const trackTitle = availableTitles.splice(titleIndex, 1)[0]!;
      const filename = `${trackTitle.toLowerCase().replace(/[^a-z0-9]/g, "-")}.mp3`;

      const [track] = await db
        .insert(schema.minusTracks)
        .values({
          showId: show.id,
          title: trackTitle,
          act: randomPick(["1", "2", null]),
          scene: randomBool(0.5) ? String(randomInt(1, 12)) : null,
          trackNumber: i + 1,
          originalKey: randomPick(MUSICAL_KEYS),
          tempo: randomInt(60, 180),
          notes: randomBool(0.3)
            ? randomPick(["Full band", "Piano only", "Vocals removed", "Click track included"])
            : null,
          filename,
          originalFilename: `${trackTitle}.mp3`,
          mimeType: "audio/mpeg",
          fileSize: randomInt(2000000, 15000000), // 2MB - 15MB
          s3Key: `shows/${show.id}/tracks/${filename}`,
          duration: randomInt(60, 360), // 1-6 minutes
          sortOrder: i,
          uploadedBy: uploader?.id ?? null,
          uploadedAt: new Date(
            sixMonthsAgo.getTime() + (scriptCount + i) * 2 * 24 * 60 * 60 * 1000
          ),
        })
        .returning({ id: schema.minusTracks.id });

      tracks.push({ id: track!.id, showId: show.id });

      // Create permissions for the track - give all cast access
      await db
        .insert(schema.materialPermissions)
        .values({
          materialType: "track",
          materialId: track!.id,
          grantType: "all_cast",
          showId: show.id,
          canDownload: true,
          canView: true,
          grantedBy: uploader?.id ?? null,
        })
        .onConflictDoNothing();
    }
  }

  console.log(`Created ${scripts.length} scripts`);
  console.log(`Created ${tracks.length} minus tracks`);

  return { scripts, tracks };
}
