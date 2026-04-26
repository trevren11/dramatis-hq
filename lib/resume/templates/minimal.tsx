import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import type { ResumeTemplateProps } from "./shared";
import {
  formatPhysicalAttributes,
  getPhysicalAttributeOptions,
  categorizeWorkHistory,
} from "./shared";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    paddingTop: 50,
    paddingBottom: 50,
    paddingHorizontal: 60,
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    marginBottom: 30,
    alignItems: "flex-start",
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    width: 65,
    marginLeft: 20,
  },
  headshot: {
    width: 60,
    height: 75,
    objectFit: "cover",
  },
  name: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 8,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  contactLine: {
    fontSize: 8,
    color: "#666666",
    marginBottom: 2,
  },
  divider: {
    borderBottomWidth: 0.5,
    borderBottomColor: "#cccccc",
    marginVertical: 4,
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  creditRow: {
    flexDirection: "row",
    marginBottom: 3,
  },
  creditProject: {
    width: "30%",
    fontSize: 9,
  },
  creditRole: {
    width: "25%",
    fontSize: 9,
    color: "#333333",
  },
  creditCompany: {
    width: "25%",
    fontSize: 9,
    color: "#666666",
  },
  creditDirector: {
    width: "20%",
    fontSize: 8,
    color: "#999999",
  },
  trainingRow: {
    marginBottom: 4,
  },
  trainingProgram: {
    fontSize: 9,
    color: "#000000",
  },
  trainingInstitution: {
    fontSize: 8,
    color: "#666666",
    marginTop: 1,
  },
  skillsText: {
    fontSize: 9,
    color: "#333333",
    lineHeight: 1.5,
  },
  noHeadshotHeader: {
    marginBottom: 30,
    textAlign: "center",
  },
  centeredName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 10,
    letterSpacing: 3,
    textTransform: "uppercase",
  },
  centeredContact: {
    fontSize: 8,
    color: "#666666",
    textAlign: "center",
  },
});

export function MinimalResume({
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
  const physicalAttributes = formatPhysicalAttributes(profile, physicalAttributeOptions);
  const { theaterCredits, filmCredits, otherCredits } = categorizeWorkHistory(workHistory);
  const hasHeadshot = includeHeadshot && profile.headshot;

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {hasHeadshot ? (
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.name}>{profile.name}</Text>
              {includeContact && (
                <>
                  {profile.contactEmail && (
                    <Text style={styles.contactLine}>{profile.contactEmail}</Text>
                  )}
                  {profile.phone && <Text style={styles.contactLine}>{profile.phone}</Text>}
                </>
              )}
              {physicalAttributes && (
                <>
                  <View style={styles.divider} />
                  <Text style={styles.contactLine}>{physicalAttributes}</Text>
                </>
              )}
              {profile.unionStatus.length > 0 && (
                <Text style={styles.contactLine}>{profile.unionStatus.join(" / ")}</Text>
              )}
            </View>
            <View style={styles.headerRight}>
              <Image style={styles.headshot} src={profile.headshot} />
            </View>
          </View>
        ) : (
          <View style={styles.noHeadshotHeader}>
            <Text style={styles.centeredName}>{profile.name}</Text>
            {includeContact && (
              <Text style={styles.centeredContact}>
                {[profile.contactEmail, profile.phone].filter(Boolean).join(" | ")}
              </Text>
            )}
            {physicalAttributes && <Text style={styles.centeredContact}>{physicalAttributes}</Text>}
            {profile.unionStatus.length > 0 && (
              <Text style={styles.centeredContact}>{profile.unionStatus.join(" / ")}</Text>
            )}
          </View>
        )}

        {theaterCredits.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Theater</Text>
            {theaterCredits.map((credit) => (
              <View key={credit.id} style={styles.creditRow}>
                <Text style={styles.creditProject}>{credit.projectName}</Text>
                <Text style={styles.creditRole}>{credit.role}</Text>
                <Text style={styles.creditCompany}>{credit.company ?? ""}</Text>
                <Text style={styles.creditDirector}>{credit.director ?? ""}</Text>
              </View>
            ))}
          </View>
        )}

        {filmCredits.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Film / Television</Text>
            {filmCredits.map((credit) => (
              <View key={credit.id} style={styles.creditRow}>
                <Text style={styles.creditProject}>{credit.projectName}</Text>
                <Text style={styles.creditRole}>{credit.role}</Text>
                <Text style={styles.creditCompany}>{credit.company ?? ""}</Text>
                <Text style={styles.creditDirector}>{credit.director ?? ""}</Text>
              </View>
            ))}
          </View>
        )}

        {otherCredits.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Other</Text>
            {otherCredits.map((credit) => (
              <View key={credit.id} style={styles.creditRow}>
                <Text style={styles.creditProject}>{credit.projectName}</Text>
                <Text style={styles.creditRole}>{credit.role}</Text>
                <Text style={styles.creditCompany}>{credit.company ?? ""}</Text>
                <Text style={styles.creditDirector}>{credit.director ?? ""}</Text>
              </View>
            ))}
          </View>
        )}

        {education.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Training</Text>
            {education.map((item) => (
              <View key={item.id} style={styles.trainingRow}>
                <Text style={styles.trainingProgram}>
                  {item.program}
                  {item.instructor ? ` with ${item.instructor}` : ""}
                </Text>
                <Text style={styles.trainingInstitution}>{item.institution}</Text>
              </View>
            ))}
          </View>
        )}

        {skills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Skills</Text>
            <Text style={styles.skillsText}>{skills.join(", ")}</Text>
          </View>
        )}
      </Page>
    </Document>
  );
}

export default MinimalResume;
