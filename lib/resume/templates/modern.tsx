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
    fontSize: 10,
    paddingTop: 40,
    paddingBottom: 40,
    paddingHorizontal: 50,
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: "#2563eb",
    paddingBottom: 15,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    width: 80,
    alignItems: "flex-end",
  },
  headshot: {
    width: 70,
    height: 90,
    objectFit: "cover",
    borderRadius: 4,
  },
  name: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  contactInfo: {
    fontSize: 9,
    marginBottom: 3,
    color: "#64748b",
  },
  physicalAttributes: {
    fontSize: 9,
    color: "#64748b",
    marginTop: 4,
  },
  unionStatus: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#2563eb",
    marginTop: 6,
  },
  section: {
    marginTop: 14,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#2563eb",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  creditRow: {
    flexDirection: "row",
    marginBottom: 4,
    paddingVertical: 2,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e2e8f0",
  },
  creditProject: {
    width: "28%",
    fontWeight: "bold",
    color: "#1e293b",
  },
  creditRole: {
    width: "24%",
    color: "#475569",
  },
  creditCompany: {
    width: "28%",
    color: "#475569",
  },
  creditDirector: {
    width: "20%",
    fontSize: 9,
    color: "#64748b",
  },
  trainingRow: {
    flexDirection: "row",
    marginBottom: 4,
    paddingVertical: 2,
  },
  trainingProgram: {
    width: "50%",
    fontWeight: "bold",
    color: "#1e293b",
  },
  trainingInstitution: {
    width: "50%",
    color: "#475569",
  },
  skillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  skillTag: {
    backgroundColor: "#eff6ff",
    color: "#2563eb",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    fontSize: 9,
  },
  noHeadshotHeader: {
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: "#2563eb",
    paddingBottom: 15,
  },
});

export function ModernResume({
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
                  {(profile.contactEmail ?? profile.phone) && (
                    <Text style={styles.contactInfo}>
                      {[profile.contactEmail, profile.phone].filter(Boolean).join(" | ")}
                    </Text>
                  )}
                </>
              )}
              {physicalAttributes && (
                <Text style={styles.physicalAttributes}>{physicalAttributes}</Text>
              )}
              {profile.unionStatus.length > 0 && (
                <Text style={styles.unionStatus}>{profile.unionStatus.join(" | ")}</Text>
              )}
            </View>
            <View style={styles.headerRight}>
              <Image style={styles.headshot} src={profile.headshot} />
            </View>
          </View>
        ) : (
          <View style={styles.noHeadshotHeader}>
            <Text style={styles.name}>{profile.name}</Text>
            {includeContact && (
              <>
                {(profile.contactEmail ?? profile.phone) && (
                  <Text style={styles.contactInfo}>
                    {[profile.contactEmail, profile.phone].filter(Boolean).join(" | ")}
                  </Text>
                )}
              </>
            )}
            {physicalAttributes && (
              <Text style={styles.physicalAttributes}>{physicalAttributes}</Text>
            )}
            {profile.unionStatus.length > 0 && (
              <Text style={styles.unionStatus}>{profile.unionStatus.join(" | ")}</Text>
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
            <Text style={styles.sectionTitle}>Film & Television</Text>
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
            <Text style={styles.sectionTitle}>Additional Credits</Text>
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
            <Text style={styles.sectionTitle}>Training & Education</Text>
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
        )}

        {skills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Special Skills</Text>
            <View style={styles.skillsContainer}>
              {skills.map((skill) => (
                <Text key={skill} style={styles.skillTag}>
                  {skill}
                </Text>
              ))}
            </View>
          </View>
        )}
      </Page>
    </Document>
  );
}

export default ModernResume;
