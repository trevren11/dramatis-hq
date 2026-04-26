import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import type { TalentProfile, WorkHistoryItem, EducationItem, ResumeConfiguration } from "../types";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Times-Roman",
    fontSize: 10,
    paddingTop: 30,
    paddingBottom: 30,
    paddingHorizontal: 40,
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    marginBottom: 15,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    width: 100,
    alignItems: "flex-end",
  },
  headshot: {
    width: 90,
    height: 115,
    objectFit: "cover",
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  contactInfo: {
    fontSize: 10,
    marginBottom: 2,
    color: "#333333",
  },
  unionStatus: {
    fontSize: 10,
    fontWeight: "bold",
    marginTop: 4,
  },
  section: {
    marginTop: 12,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
    paddingBottom: 2,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  creditRow: {
    flexDirection: "row",
    marginBottom: 3,
    paddingVertical: 1,
  },
  creditProject: {
    width: "30%",
    fontStyle: "italic",
  },
  creditRole: {
    width: "25%",
  },
  creditCompany: {
    width: "25%",
  },
  creditDirector: {
    width: "20%",
    fontSize: 9,
  },
  trainingRow: {
    flexDirection: "row",
    marginBottom: 3,
  },
  trainingProgram: {
    width: "50%",
  },
  trainingInstitution: {
    width: "50%",
    fontStyle: "italic",
  },
  skillsText: {
    fontSize: 10,
    lineHeight: 1.4,
  },
  noHeadshotHeader: {
    alignItems: "center",
    marginBottom: 15,
  },
  centeredName: {
    fontSize: 28,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: 6,
  },
  centeredContact: {
    fontSize: 10,
    textAlign: "center",
    color: "#333333",
  },
});

interface TheatricalResumeProps {
  profile: TalentProfile;
  config: Partial<ResumeConfiguration>;
  selectedWorkHistory?: WorkHistoryItem[];
  selectedEducation?: EducationItem[];
  selectedSkills?: string[];
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

interface PhysicalAttributeOptions {
  includeHeight?: boolean;
  includeHair?: boolean;
  includeEyes?: boolean;
}

function formatPhysicalAttributes(
  profile: TalentProfile,
  options: PhysicalAttributeOptions = {}
): string {
  const { includeHeight = true, includeHair = true, includeEyes = true } = options;
  const parts: string[] = [];
  if (includeHeight && profile.height) parts.push(profile.height);
  if (includeHair && profile.hairColor) parts.push(`${capitalizeFirst(profile.hairColor)} Hair`);
  if (includeEyes && profile.eyeColor) parts.push(`${capitalizeFirst(profile.eyeColor)} Eyes`);
  return parts.join(" | ");
}

function UnionStatusLine({ unionStatus }: { unionStatus: string[] }): React.ReactElement | null {
  if (unionStatus.length === 0) return null;
  return <Text style={styles.unionStatus}>{unionStatus.join(" | ")}</Text>;
}

function ContactInfo({
  profile,
  physicalAttributes,
  centered = false,
}: {
  profile: TalentProfile;
  physicalAttributes: string;
  centered?: boolean;
}): React.ReactElement | null {
  const style = centered ? styles.centeredContact : styles.contactInfo;
  const hasContact = profile.contactEmail ?? profile.phone;

  return (
    <>
      {hasContact && (
        <Text style={style}>
          {[profile.contactEmail, profile.phone].filter(Boolean).join(" | ")}
        </Text>
      )}
      {physicalAttributes && <Text style={style}>{physicalAttributes}</Text>}
    </>
  );
}

function CenteredHeader({
  profile,
  includeContact,
  physicalAttributeOptions,
}: {
  profile: TalentProfile;
  includeContact: boolean;
  physicalAttributeOptions: PhysicalAttributeOptions;
}): React.ReactElement {
  const physicalAttributes = formatPhysicalAttributes(profile, physicalAttributeOptions);

  return (
    <View style={styles.noHeadshotHeader}>
      <Text style={styles.centeredName}>{profile.name}</Text>
      {includeContact && (
        <ContactInfo profile={profile} physicalAttributes={physicalAttributes} centered />
      )}
      <UnionStatusLine unionStatus={profile.unionStatus} />
    </View>
  );
}

function HeaderWithHeadshot({
  profile,
  includeContact,
  physicalAttributeOptions,
}: {
  profile: TalentProfile;
  includeContact: boolean;
  physicalAttributeOptions: PhysicalAttributeOptions;
}): React.ReactElement {
  const physicalAttributes = formatPhysicalAttributes(profile, physicalAttributeOptions);

  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Text style={styles.name}>{profile.name}</Text>
        {includeContact && (
          <ContactInfo profile={profile} physicalAttributes={physicalAttributes} />
        )}
        <UnionStatusLine unionStatus={profile.unionStatus} />
      </View>
      <View style={styles.headerRight}>
        {profile.headshot && <Image style={styles.headshot} src={profile.headshot} />}
      </View>
    </View>
  );
}

function Header({
  profile,
  includeHeadshot,
  includeContact,
  physicalAttributeOptions,
}: {
  profile: TalentProfile;
  includeHeadshot: boolean;
  includeContact: boolean;
  physicalAttributeOptions: PhysicalAttributeOptions;
}): React.ReactElement {
  const hasHeadshot = includeHeadshot && profile.headshot;

  if (!hasHeadshot) {
    return (
      <CenteredHeader
        profile={profile}
        includeContact={includeContact}
        physicalAttributeOptions={physicalAttributeOptions}
      />
    );
  }

  return (
    <HeaderWithHeadshot
      profile={profile}
      includeContact={includeContact}
      physicalAttributeOptions={physicalAttributeOptions}
    />
  );
}

function CreditSection({
  title,
  credits,
}: {
  title: string;
  credits: WorkHistoryItem[];
}): React.ReactElement | null {
  if (credits.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {credits.map((credit) => (
        <View key={credit.id} style={styles.creditRow}>
          <Text style={styles.creditProject}>{credit.projectName}</Text>
          <Text style={styles.creditRole}>{credit.role}</Text>
          <Text style={styles.creditCompany}>{credit.company ?? ""}</Text>
          <Text style={styles.creditDirector}>{credit.director ?? ""}</Text>
        </View>
      ))}
    </View>
  );
}

function TrainingSection({ education }: { education: EducationItem[] }): React.ReactElement | null {
  if (education.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Training</Text>
      {education.map((item) => (
        <View key={item.id} style={styles.trainingRow}>
          <Text style={styles.trainingProgram}>
            {item.program}
            {item.instructor ? ` (${item.instructor})` : ""}
          </Text>
          <Text style={styles.trainingInstitution}>{item.institution}</Text>
        </View>
      ))}
    </View>
  );
}

function SkillsSection({ skills }: { skills: string[] }): React.ReactElement | null {
  if (skills.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Special Skills</Text>
      <Text style={styles.skillsText}>{skills.join(", ")}</Text>
    </View>
  );
}

export function TheatricalResume({
  profile,
  config,
  selectedWorkHistory,
  selectedEducation,
  selectedSkills,
}: TheatricalResumeProps): React.ReactElement {
  const workHistory = selectedWorkHistory ?? profile.workHistory;
  const education = selectedEducation ?? profile.education;
  const skills = selectedSkills ?? profile.skills;
  const includeHeadshot = config.includeHeadshot ?? true;
  const includeContact = config.includeContact ?? true;

  const physicalAttributeOptions: PhysicalAttributeOptions = {
    includeHeight: config.includeHeight ?? true,
    includeHair: config.includeHair ?? true,
    includeEyes: config.includeEyes ?? true,
  };

  const theaterCredits = workHistory.filter((w) => w.category === "theater");
  const filmCredits = workHistory.filter((w) => ["film", "television"].includes(w.category));
  const otherCredits = workHistory.filter(
    (w) => !["theater", "film", "television"].includes(w.category)
  );

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <Header
          profile={profile}
          includeHeadshot={includeHeadshot}
          includeContact={includeContact}
          physicalAttributeOptions={physicalAttributeOptions}
        />

        <CreditSection title="Theater" credits={theaterCredits} />
        <CreditSection title="Film / Television" credits={filmCredits} />
        {otherCredits.length > 0 && <CreditSection title="Other Credits" credits={otherCredits} />}
        <TrainingSection education={education} />
        <SkillsSection skills={skills} />
      </Page>
    </Document>
  );
}

export default TheatricalResume;
