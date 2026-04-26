import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import type { ResumeTemplateProps } from "./shared";
import { getPhysicalAttributeOptions, categorizeWorkHistory } from "./shared";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    paddingTop: 35,
    paddingBottom: 35,
    paddingHorizontal: 45,
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    marginBottom: 20,
    alignItems: "flex-start",
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    width: 110,
    alignItems: "center",
  },
  headshot: {
    width: 100,
    height: 130,
    objectFit: "cover",
  },
  name: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 4,
  },
  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 15,
    marginTop: 8,
    marginBottom: 6,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  statLabel: {
    fontSize: 8,
    color: "#64748b",
    marginRight: 4,
    textTransform: "uppercase",
  },
  statValue: {
    fontSize: 9,
    color: "#0f172a",
    fontWeight: "bold",
  },
  contactRow: {
    flexDirection: "row",
    gap: 15,
    marginTop: 4,
  },
  contactItem: {
    fontSize: 9,
    color: "#475569",
  },
  unionRow: {
    marginTop: 6,
  },
  unionText: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#059669",
  },
  sectionDivider: {
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    marginVertical: 12,
  },
  section: {
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#0f172a",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sectionCount: {
    fontSize: 8,
    color: "#94a3b8",
    marginLeft: 8,
  },
  creditTable: {
    borderWidth: 0.5,
    borderColor: "#e2e8f0",
  },
  creditHeader: {
    flexDirection: "row",
    backgroundColor: "#f8fafc",
    borderBottomWidth: 0.5,
    borderBottomColor: "#e2e8f0",
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  creditHeaderText: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#64748b",
    textTransform: "uppercase",
  },
  creditRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#f1f5f9",
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  creditCol1: { width: "28%" },
  creditCol2: { width: "22%" },
  creditCol3: { width: "28%" },
  creditCol4: { width: "22%" },
  creditText: {
    fontSize: 9,
    color: "#334155",
  },
  trainingRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  trainingProgram: {
    width: "40%",
    fontSize: 9,
    color: "#0f172a",
  },
  trainingInstitution: {
    width: "35%",
    fontSize: 9,
    color: "#475569",
  },
  trainingInstructor: {
    width: "25%",
    fontSize: 9,
    color: "#64748b",
  },
  skillsText: {
    fontSize: 9,
    color: "#334155",
    lineHeight: 1.5,
  },
  noHeadshotHeader: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: "#0f172a",
  },
  centeredName: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#0f172a",
    textAlign: "center",
    marginBottom: 8,
  },
  centeredStats: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    marginTop: 6,
  },
});

export function CommercialResume({
  profile,
  config,
  selectedWorkHistory,
  selectedEducation,
  selectedSkills,
}: ResumeTemplateProps): React.ReactElement {
  const workHistory = selectedWorkHistory ?? profile.workHistory;
  const education = selectedEducation ?? profile.education;
  const skills = selectedSkills ?? profile.skills;
  const includeHeadshot = config.includeHeadshot ?? true;
  const includeContact = config.includeContact ?? true;

  const physicalAttributeOptions = getPhysicalAttributeOptions(config);
  const { theaterCredits, filmCredits, otherCredits } = categorizeWorkHistory(workHistory);
  const hasHeadshot = includeHeadshot && profile.headshot;

  const physicalStats = [];
  if (physicalAttributeOptions.includeHeight && profile.height) {
    physicalStats.push({ label: "Height", value: profile.height });
  }
  if (physicalAttributeOptions.includeHair && profile.hairColor) {
    physicalStats.push({
      label: "Hair",
      value: profile.hairColor.charAt(0).toUpperCase() + profile.hairColor.slice(1).toLowerCase(),
    });
  }
  if (physicalAttributeOptions.includeEyes && profile.eyeColor) {
    physicalStats.push({
      label: "Eyes",
      value: profile.eyeColor.charAt(0).toUpperCase() + profile.eyeColor.slice(1).toLowerCase(),
    });
  }

  const renderCreditSection = (
    title: string,
    credits: typeof theaterCredits
  ): React.ReactElement | null => {
    if (credits.length === 0) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <Text style={styles.sectionCount}>({credits.length})</Text>
        </View>
        <View style={styles.creditTable}>
          <View style={styles.creditHeader}>
            <Text style={[styles.creditHeaderText, styles.creditCol1]}>Production</Text>
            <Text style={[styles.creditHeaderText, styles.creditCol2]}>Role</Text>
            <Text style={[styles.creditHeaderText, styles.creditCol3]}>Company</Text>
            <Text style={[styles.creditHeaderText, styles.creditCol4]}>Director</Text>
          </View>
          {credits.map((credit) => (
            <View key={credit.id} style={styles.creditRow}>
              <Text style={[styles.creditText, styles.creditCol1]}>{credit.projectName}</Text>
              <Text style={[styles.creditText, styles.creditCol2]}>{credit.role}</Text>
              <Text style={[styles.creditText, styles.creditCol3]}>{credit.company ?? ""}</Text>
              <Text style={[styles.creditText, styles.creditCol4]}>{credit.director ?? ""}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {hasHeadshot ? (
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.name}>{profile.name}</Text>
              {physicalStats.length > 0 && (
                <View style={styles.statsRow}>
                  {physicalStats.map((stat) => (
                    <View key={stat.label} style={styles.statItem}>
                      <Text style={styles.statLabel}>{stat.label}:</Text>
                      <Text style={styles.statValue}>{stat.value}</Text>
                    </View>
                  ))}
                </View>
              )}
              {includeContact && (profile.contactEmail ?? profile.phone) && (
                <View style={styles.contactRow}>
                  {profile.contactEmail && (
                    <Text style={styles.contactItem}>{profile.contactEmail}</Text>
                  )}
                  {profile.phone && <Text style={styles.contactItem}>{profile.phone}</Text>}
                </View>
              )}
              {profile.unionStatus.length > 0 && (
                <View style={styles.unionRow}>
                  <Text style={styles.unionText}>{profile.unionStatus.join(" | ")}</Text>
                </View>
              )}
            </View>
            <View style={styles.headerRight}>
              <Image style={styles.headshot} src={profile.headshot} />
            </View>
          </View>
        ) : (
          <View style={styles.noHeadshotHeader}>
            <Text style={styles.centeredName}>{profile.name}</Text>
            {physicalStats.length > 0 && (
              <View style={styles.centeredStats}>
                {physicalStats.map((stat) => (
                  <View key={stat.label} style={styles.statItem}>
                    <Text style={styles.statLabel}>{stat.label}:</Text>
                    <Text style={styles.statValue}>{stat.value}</Text>
                  </View>
                ))}
              </View>
            )}
            {includeContact && (profile.contactEmail ?? profile.phone) && (
              <View style={[styles.contactRow, { justifyContent: "center", marginTop: 6 }]}>
                {profile.contactEmail && (
                  <Text style={styles.contactItem}>{profile.contactEmail}</Text>
                )}
                {profile.phone && <Text style={styles.contactItem}>{profile.phone}</Text>}
              </View>
            )}
            {profile.unionStatus.length > 0 && (
              <View style={[styles.unionRow, { textAlign: "center" }]}>
                <Text style={styles.unionText}>{profile.unionStatus.join(" | ")}</Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.sectionDivider} />

        {renderCreditSection("Theater", theaterCredits)}
        {renderCreditSection("Film / Television", filmCredits)}
        {renderCreditSection("Commercial / Industrial", otherCredits)}

        {education.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Training & Education</Text>
            </View>
            {education.map((item) => (
              <View key={item.id} style={styles.trainingRow}>
                <Text style={styles.trainingProgram}>{item.program}</Text>
                <Text style={styles.trainingInstitution}>{item.institution}</Text>
                <Text style={styles.trainingInstructor}>{item.instructor ?? ""}</Text>
              </View>
            ))}
          </View>
        )}

        {skills.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Special Skills</Text>
            </View>
            <Text style={styles.skillsText}>{skills.join(" | ")}</Text>
          </View>
        )}
      </Page>
    </Document>
  );
}

export default CommercialResume;
