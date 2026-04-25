import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import {
  talentProfiles,
  workHistory,
  education,
  headshots,
  videoSamples,
  talentSkills,
  skills,
} from "@/lib/db/schema";
import { eq, asc, inArray, and } from "drizzle-orm";
import { PublicProfile } from "@/components/profile/PublicProfile";
import { ContactForm } from "@/components/profile/ContactForm";
import type { PublicSections } from "@/lib/db/schema/talent-profiles";

interface Props {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({
  params,
}: Props): Promise<{ title: string; description?: string }> {
  const { username } = await params;
  const profile = await db.query.talentProfiles.findFirst({
    where: and(eq(talentProfiles.publicProfileSlug, username), eq(talentProfiles.isPublic, true)),
    columns: { firstName: true, lastName: true, stageName: true, bio: true },
  });

  if (!profile) {
    return { title: "Profile Not Found" };
  }

  const displayName = profile.stageName ?? `${profile.firstName} ${profile.lastName}`;
  return {
    title: `${displayName} | Dramatis`,
    description: profile.bio?.slice(0, 160) ?? `View ${displayName}'s profile on Dramatis`,
  };
}

export default async function PublicProfilePage({ params }: Props): Promise<React.ReactElement> {
  const { username } = await params;

  const profile = await db.query.talentProfiles.findFirst({
    where: and(eq(talentProfiles.publicProfileSlug, username), eq(talentProfiles.isPublic, true)),
  });

  if (!profile) {
    notFound();
  }

  const sections: PublicSections = profile.publicSections ?? {
    basicInfo: true,
    bio: true,
    headshots: true,
    videos: true,
    workHistory: true,
    education: true,
    skills: true,
    contact: false,
  };

  // Fetch related data based on visibility settings
  const [work, edu, photos, videos, userSkills] = await Promise.all([
    sections.workHistory
      ? db.query.workHistory.findMany({
          where: eq(workHistory.talentProfileId, profile.id),
          orderBy: [asc(workHistory.sortOrder)],
        })
      : [],
    sections.education
      ? db.query.education.findMany({
          where: eq(education.talentProfileId, profile.id),
          orderBy: [asc(education.sortOrder)],
        })
      : [],
    sections.headshots
      ? db.query.headshots.findMany({
          where: eq(headshots.talentProfileId, profile.id),
          orderBy: [asc(headshots.sortOrder)],
        })
      : [],
    sections.videos
      ? db.query.videoSamples.findMany({
          where: eq(videoSamples.talentProfileId, profile.id),
          orderBy: [asc(videoSamples.sortOrder)],
        })
      : [],
    sections.skills
      ? db.query.talentSkills.findMany({
          where: eq(talentSkills.talentProfileId, profile.id),
        })
      : [],
  ]);

  const skillIds = userSkills.map((s) => s.skillId);
  const skillDetails =
    skillIds.length > 0
      ? await db.query.skills.findMany({ where: inArray(skills.id, skillIds) })
      : [];

  return (
    <div className="from-base-200 to-base-100 min-h-screen bg-gradient-to-b">
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <PublicProfile
          profile={profile}
          sections={sections}
          workHistory={work}
          education={edu}
          headshots={photos}
          videos={videos}
          skills={skillDetails}
        />
        {sections.contact && (
          <div className="mt-8">
            <ContactForm username={username} />
          </div>
        )}
      </div>
    </div>
  );
}
