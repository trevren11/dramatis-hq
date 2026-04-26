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
    paddingTop: 0,
    paddingBottom: 30,
    paddingHorizontal: 0,
    backgroundColor: "#ffffff",
  },
  headerBanner: {
    backgroundColor: "#18181b",
    paddingTop: 35,
    paddingBottom: 25,
    paddingHorizontal: 40,
    marginBottom: 20,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    width: 90,
  },
  headshot: {
    width: 80,
    height: 100,
    objectFit: "cover",
    borderWidth: 3,
    borderColor: "#ffffff",
  },
  name: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 8,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 10,
    color: "#a1a1aa",
    marginBottom: 4,
  },
  unionBadge: {
    backgroundColor: "#dc2626",
    color: "#ffffff",
    fontSize: 8,
    fontWeight: "bold",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 2,
    marginTop: 8,
    alignSelf: "flex-start",
  },
  body: {
    paddingHorizontal: 40,
  },
  twoColumn: {
    flexDirection: "row",
    gap: 30,
  },
  mainColumn: {
    flex: 2,
  },
  sideColumn: {
    flex: 1,
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#18181b",
    marginBottom: 10,
    paddingBottom: 4,
    borderBottomWidth: 2,
    borderBottomColor: "#dc2626",
  },
  creditItem: {
    marginBottom: 8,
  },
  creditProject: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#18181b",
  },
  creditDetails: {
    fontSize: 9,
    color: "#52525b",
    marginTop: 1,
  },
  trainingItem: {
    marginBottom: 8,
  },
  trainingProgram: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#18181b",
  },
  trainingDetails: {
    fontSize: 9,
    color: "#52525b",
    marginTop: 1,
  },
  skillsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  skillItem: {
    backgroundColor: "#f4f4f5",
    color: "#18181b",
    fontSize: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 2,
  },
  infoItem: {
    marginBottom: 6,
  },
  infoLabel: {
    fontSize: 8,
    color: "#71717a",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 10,
    color: "#18181b",
    marginTop: 1,
  },
  noHeadshotHeader: {
    backgroundColor: "#18181b",
    paddingTop: 45,
    paddingBottom: 35,
    paddingHorizontal: 40,
    marginBottom: 20,
    alignItems: "center",
  },
  centeredName: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 8,
    letterSpacing: 2,
  },
});

export function CreativeResume({
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
  const allCredits = [...theaterCredits, ...filmCredits, ...otherCredits];

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {hasHeadshot ? (
          <View style={styles.headerBanner}>
            <View style={styles.headerContent}>
              <View style={styles.headerLeft}>
                <Text style={styles.name}>{profile.name}</Text>
                {physicalAttributes && <Text style={styles.subtitle}>{physicalAttributes}</Text>}
                {profile.unionStatus.length > 0 && (
                  <Text style={styles.unionBadge}>{profile.unionStatus.join(" | ")}</Text>
                )}
              </View>
              <View style={styles.headerRight}>
                <Image style={styles.headshot} src={profile.headshot} />
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.noHeadshotHeader}>
            <Text style={styles.centeredName}>{profile.name}</Text>
            {physicalAttributes && <Text style={styles.subtitle}>{physicalAttributes}</Text>}
            {profile.unionStatus.length > 0 && (
              <Text style={styles.unionBadge}>{profile.unionStatus.join(" | ")}</Text>
            )}
          </View>
        )}

        <View style={styles.body}>
          <View style={styles.twoColumn}>
            <View style={styles.mainColumn}>
              {allCredits.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Credits</Text>
                  {allCredits.map((credit) => (
                    <View key={credit.id} style={styles.creditItem}>
                      <Text style={styles.creditProject}>{credit.projectName}</Text>
                      <Text style={styles.creditDetails}>
                        {credit.role}
                        {credit.company ? ` | ${credit.company}` : ""}
                        {credit.director ? ` | Dir. ${credit.director}` : ""}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {education.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Training</Text>
                  {education.map((item) => (
                    <View key={item.id} style={styles.trainingItem}>
                      <Text style={styles.trainingProgram}>{item.program}</Text>
                      <Text style={styles.trainingDetails}>
                        {item.institution}
                        {item.instructor ? ` | ${item.instructor}` : ""}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.sideColumn}>
              {includeContact && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Contact</Text>
                  {profile.contactEmail && (
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Email</Text>
                      <Text style={styles.infoValue}>{profile.contactEmail}</Text>
                    </View>
                  )}
                  {profile.phone && (
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Phone</Text>
                      <Text style={styles.infoValue}>{profile.phone}</Text>
                    </View>
                  )}
                </View>
              )}

              {skills.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Skills</Text>
                  <View style={styles.skillsGrid}>
                    {skills.map((skill) => (
                      <Text key={skill} style={styles.skillItem}>
                        {skill}
                      </Text>
                    ))}
                  </View>
                </View>
              )}
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}

export default CreativeResume;
