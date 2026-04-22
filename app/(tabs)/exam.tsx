import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { InteractivePressable } from '@/components/ui/InteractivePressable';
import { useExamPrep } from '@/hooks/useExamPrep';
import { usePreferences } from '@/context/PreferencesContext';
import { Typography, getWebTransitionStyle, withAlpha } from '@/constants/theme';

export default function ExamPrepScreen() {
  const { displayDomains, usingPreviewData } = useExamPrep();
  const { colors, textScale, preferences } = usePreferences();
  const styles = createStyles(colors, textScale);
  const totalQuestions = displayDomains.reduce((sum, domain) => sum + domain.questions, 0);
  const totalAttempts = displayDomains.reduce((sum, domain) => sum + domain.attempts, 0);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <View style={styles.heroHeader}>
          <Badge label="Student Analyst" variant="accent" />
          <Text style={styles.heroStat}>{totalQuestions} practice questions</Text>
        </View>
        <Text style={styles.heroTitle}>BCBA exam prep</Text>
        <Text style={styles.heroText}>
          {usingPreviewData
            ? 'Work through domain-based practice sets, keep your pacing steady, and focus on board-style reasoning instead of cramming everything at once.'
            : 'Your live question bank is loaded. Use domain-by-domain repetition first, then shift into mixed review once your reasoning feels steady.'}
        </Text>
      </View>

      <View style={styles.summaryRow}>
        <SummaryCard
          title="Current focus"
          value={usingPreviewData ? 'Mixed review' : `${displayDomains.length} domains`}
          icon="shuffle-outline"
        />
        <SummaryCard
          title="Attempts logged"
          value={String(totalAttempts)}
          icon="timer-outline"
        />
      </View>

      <Card variant="elevated" style={styles.strategyCard}>
        <Text style={styles.sectionEyebrow}>Study strategy</Text>
        <Text style={styles.sectionTitle}>Build confidence by domain</Text>
        <Text style={styles.strategyText}>
          Start with one domain per session, then mix in random review once you can explain why the correct answer is right and why the distractors are wrong.
        </Text>
      </Card>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Practice domains</Text>
        <Text style={styles.sectionHint}>Designed for calm, repeatable reps.</Text>
      </View>

      {displayDomains.map((domain) => (
        <InteractivePressable
          key={domain.name}
          style={styles.domainPressable}
          hoverStyle={!preferences.reducedMotion ? styles.hoverLift : undefined}
        >
          {({ hovered }) => (
            <Card variant="elevated" style={[styles.domainCard, hovered && styles.domainCardHovered]}>
              <View style={styles.domainHeader}>
                <View style={[styles.domainIconWrap, hovered && styles.domainIconWrapHovered]}>
                  <Ionicons name="school-outline" size={20} color={hovered ? colors.primaryLight : colors.primary} />
                </View>
                <View style={styles.domainCopy}>
                  <Text style={[styles.domainName, hovered && styles.domainNameHovered]}>{domain.name}</Text>
                  <Text style={styles.domainDesc}>{domain.description}</Text>
                </View>
              </View>

              <View style={styles.metaRow}>
                <Badge label={`${domain.questions} questions`} variant="primary" />
                <Badge label={domain.difficulty} variant="muted" />
                <Badge
                  label={
                    domain.accuracy == null
                      ? `${domain.attempts} attempts`
                      : `${domain.accuracy}% accuracy`
                  }
                  variant="accent"
                />
              </View>
            </Card>
          )}
        </InteractivePressable>
      ))}

      <Card style={styles.footerCard}>
        <Text style={styles.footerTitle}>Next milestone</Text>
        <Text style={styles.footerText}>
          The next build can turn these domain cards into playable question sessions with score review and spaced practice loops.
        </Text>
      </Card>
    </ScrollView>
  );

  function SummaryCard({
    title,
    value,
    icon,
  }: {
    title: string;
    value: string;
    icon: keyof typeof Ionicons.glyphMap;
  }) {
    return (
      <View style={styles.summaryCard}>
        <View style={styles.summaryIconWrap}>
          <Ionicons name={icon} size={18} color={colors.primary} />
        </View>
        <Text style={styles.summaryValue}>{value}</Text>
        <Text style={styles.summaryTitle}>{title}</Text>
      </View>
    );
  }
}

const createStyles = (
  colors: ReturnType<typeof usePreferences>['colors'],
  textScale: number,
) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: 16,
      paddingBottom: 36,
    },
    hero: {
      borderRadius: 24,
      padding: 20,
      marginBottom: 14,
      backgroundColor: colors.primary,
    },
    heroHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 10,
      marginBottom: 14,
    },
    heroStat: {
      fontSize: 12 * textScale,
      fontFamily: Typography.bodyBold,
      color: colors.white,
    },
    heroTitle: {
      fontSize: 28 * textScale,
      fontFamily: Typography.heading,
      color: colors.white,
      marginBottom: 8,
    },
    heroText: {
      fontSize: 14 * textScale,
      lineHeight: 21,
      color: colors.white,
      fontFamily: Typography.body,
    },
    summaryRow: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 14,
    },
    summaryCard: {
      flex: 1,
      borderRadius: 18,
      padding: 16,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    summaryIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 10,
      backgroundColor: withAlpha(colors.primary, '12'),
    },
    summaryValue: {
      fontSize: 20 * textScale,
      fontFamily: Typography.headingSemiBold,
      color: colors.text,
      marginBottom: 4,
    },
    summaryTitle: {
      fontSize: 12 * textScale,
      color: colors.textSecondary,
      fontFamily: Typography.bodySemiBold,
    },
    strategyCard: {
      marginBottom: 18,
    },
    sectionEyebrow: {
      fontSize: 12 * textScale,
      fontFamily: Typography.bodyBold,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      color: colors.primary,
      marginBottom: 6,
    },
    sectionTitle: {
      fontSize: 18 * textScale,
      fontFamily: Typography.headingSemiBold,
      color: colors.text,
      marginBottom: 4,
    },
    sectionHint: {
      fontSize: 13 * textScale,
      color: colors.textSecondary,
      fontFamily: Typography.body,
    },
    strategyText: {
      fontSize: 14 * textScale,
      lineHeight: 21,
      color: colors.textSecondary,
      fontFamily: Typography.body,
    },
    sectionHeader: {
      marginBottom: 10,
    },
    domainPressable: {
      marginBottom: 12,
    },
    domainCard: {},
    domainCardHovered: {
      borderColor: withAlpha(colors.primary, '44'),
      shadowColor: colors.primary,
      shadowOpacity: 0.18,
      shadowRadius: 18,
      backgroundColor: colors.card,
    },
    hoverLift: {
      transform: [{ translateY: -2 }],
    },
    domainHeader: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 14,
    },
    domainIconWrap: {
      width: 42,
      height: 42,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: withAlpha(colors.primary, '12'),
    },
    domainIconWrapHovered: {
      backgroundColor: withAlpha(colors.primary, '1A'),
    },
    domainCopy: {
      flex: 1,
    },
    domainName: {
      fontSize: 16 * textScale,
      lineHeight: 22,
      fontFamily: Typography.bodyBold,
      color: colors.text,
      marginBottom: 4,
      ...(getWebTransitionStyle('color') ?? {}),
    },
    domainNameHovered: {
      color: colors.primary,
    },
    domainDesc: {
      fontSize: 13 * textScale,
      lineHeight: 20,
      color: colors.textSecondary,
      fontFamily: Typography.body,
    },
    metaRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    footerCard: {
      marginTop: 4,
    },
    footerTitle: {
      fontSize: 16 * textScale,
      fontFamily: Typography.headingSemiBold,
      color: colors.text,
      marginBottom: 8,
    },
    footerText: {
      fontSize: 13 * textScale,
      lineHeight: 20,
      color: colors.textSecondary,
      fontFamily: Typography.body,
    },
  });
