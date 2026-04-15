import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Colors } from '@/constants/Colors';

export default function ExamPrepScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Exam Prep</Text>
      <Text style={styles.sub}>
        Practice questions for the BCBA exam are coming soon.
      </Text>

      <View style={styles.domainList}>
        {DOMAINS.map((domain) => (
          <View key={domain.name} style={styles.domainCard}>
            <View style={styles.domainTop}>
              <Text style={styles.domainName}>{domain.name}</Text>
              <Text style={styles.domainCount}>{domain.questions} questions</Text>
            </View>
            <Text style={styles.domainDesc}>{domain.description}</Text>
            <View style={styles.comingSoon}>
              <Text style={styles.comingSoonText}>Coming Soon</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const DOMAINS = [
  {
    name: 'Behavior Measurement',
    questions: 0,
    description: 'Measurement, data collection, and behavioral assessment.',
  },
  {
    name: 'Experimental Design',
    questions: 0,
    description: 'Research methods and experimental analysis of behavior.',
  },
  {
    name: 'Behavior Change Procedures',
    questions: 0,
    description: 'Reinforcement, punishment, extinction, and stimulus control.',
  },
  {
    name: 'Personnel Supervision',
    questions: 0,
    description: 'Supervision and management of behavior-change agents.',
  },
  {
    name: 'Ethics',
    questions: 0,
    description: 'Professional and ethical compliance in ABA practice.',
  },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 20,
  },
  heading: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 6,
  },
  sub: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 24,
    lineHeight: 20,
  },
  domainList: {
    gap: 12,
  },
  domainCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  domainTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  domainName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    flex: 1,
    marginRight: 8,
  },
  domainCount: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
  domainDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  comingSoon: {
    alignSelf: 'flex-start',
    backgroundColor: `${Colors.accent}22`,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  comingSoonText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.accentDark,
    letterSpacing: 0.5,
  },
});
