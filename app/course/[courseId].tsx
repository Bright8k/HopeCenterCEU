import {
  ActivityIndicator,
  ImageBackground,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Skeleton } from '@/components/ui/Skeleton';
import { router, useLocalSearchParams } from 'expo-router';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { usePreferences } from '@/context/PreferencesContext';
import { useCourse } from '@/hooks/useCourse';
import { useOfflineCourse } from '@/hooks/useOfflineStorage';
import { Typography, withAlpha } from '@/constants/theme';

export default function CourseViewerScreen() {
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const { colors, textScale } = usePreferences();
  const { course, loading, error } = useCourse(courseId);
  const { isCached, saving, download, remove, available } = useOfflineCourse(courseId);
  const styles = createStyles(colors, textScale);

  // Always called unconditionally; source updates reactively as course loads
  const player = useVideoPlayer(course?.video_url ?? null, (p) => {
    p.loop = false;
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} accessibilityLabel="Loading course">
        {/* Header */}
        <View style={styles.header}>
          <Skeleton width={36} height={36} borderRadius={12} />
          <Skeleton width="58%" height={18} borderRadius={6} style={{ flex: 0 }} />
          <Skeleton width={36} height={36} borderRadius={12} />
        </View>
        {/* Video placeholder */}
        <View style={[styles.videoSection, { opacity: 0.6 }]} />
        {/* Body */}
        <ScrollView
          contentContainerStyle={{ padding: 20, gap: 14 }}
          scrollEnabled={false}
        >
          {/* Meta badges */}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Skeleton width={68} height={24} borderRadius={12} />
            <Skeleton width={58} height={24} borderRadius={12} />
            <Skeleton width={78} height={24} borderRadius={12} />
          </View>
          {/* Title */}
          <Skeleton width="82%" height={28} borderRadius={8} />
          {/* Description */}
          <View style={{ gap: 8 }}>
            <Skeleton height={15} borderRadius={6} />
            <Skeleton height={15} borderRadius={6} />
            <Skeleton width="65%" height={15} borderRadius={6} />
          </View>
          {/* Requirements card */}
          <Skeleton height={92} borderRadius={16} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (error || !course) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <BackButton label="Go back to course library" />
        </View>
        <View style={styles.loadingWrap}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.textMuted} />
          <Text style={styles.errorTitle}>Course unavailable</Text>
          <Text style={styles.errorText}>{error ?? 'This course could not be found.'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const durationLabel = course.duration_seconds
    ? formatDuration(course.duration_seconds)
    : null;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <BackButton label={`Go back from ${course.title}`} />
        <Text style={styles.headerTitle} numberOfLines={1}>
          {course.title}
        </Text>
        {available ? (
          <Pressable
            onPress={isCached ? remove : download}
            disabled={saving}
            accessibilityRole="button"
            accessibilityLabel={isCached ? 'Remove offline copy' : 'Save course for offline use'}
            style={styles.downloadBtn}
          >
            {saving ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Ionicons
                name={isCached ? 'cloud-done-outline' : 'cloud-download-outline'}
                size={22}
                color={isCached ? colors.primary : colors.textSecondary}
              />
            )}
          </Pressable>
        ) : (
          <View style={styles.headerRight} />
        )}
      </View>

      {/* ── Scrollable content ──────────────────────────────────────────── */}
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Video section */}
        <View
          style={styles.videoSection}
          accessibilityLabel={
            course.video_url
              ? `Video player for ${course.title}`
              : `${course.title} — video coming soon`
          }
          accessibilityRole="none"
        >
          {course.video_url ? (
            <VideoView
              player={player}
              style={styles.video}
              nativeControls
              contentFit="contain"
              allowsFullscreen
              accessibilityLabel={`Video: ${course.title}`}
            />
          ) : course.thumbnail_url ? (
            <ImageBackground
              source={{ uri: course.thumbnail_url }}
              style={styles.videoPlaceholder}
              resizeMode="cover"
              accessibilityElementsHidden
            >
              <View style={styles.thumbnailDim} />
              <View style={[styles.playIconWrap, { backgroundColor: withAlpha('#000000', '44') }]}>
                <Ionicons name="play-circle-outline" size={64} color={colors.white} />
              </View>
              <Text style={styles.placeholderText}>Video coming soon</Text>
              <Text style={styles.placeholderSubtext}>
                Complete the quiz below to earn your CEUs
              </Text>
            </ImageBackground>
          ) : (
            <View style={styles.videoPlaceholder}>
              <View style={[styles.playIconWrap, { backgroundColor: withAlpha(colors.white, '18') }]}>
                <Ionicons name="play-circle-outline" size={64} color={colors.white} />
              </View>
              <Text style={styles.placeholderText}>Video coming soon</Text>
              <Text style={styles.placeholderSubtext}>
                Complete the quiz below to earn your CEUs
              </Text>
            </View>
          )}
        </View>

        {/* Course body */}
        <View style={styles.body}>
          {/* Meta badges */}
          <View style={styles.metaRow}>
            <Badge label={course.track ?? 'General'} variant="primary" />
            {durationLabel ? <Badge label={durationLabel} variant="muted" /> : null}
            <Badge
              label={`${course.ceu_value} CEU${course.ceu_value !== 1 ? 's' : ''}`}
              variant="success"
            />
            {isCached && <Badge label="Offline" variant="accent" />}
          </View>

          {/* Title */}
          <Text style={styles.title}>{course.title}</Text>

          {/* Description */}
          {course.description ? (
            <Text style={styles.description}>{course.description}</Text>
          ) : null}

          {/* Quiz requirements card */}
          <Card style={styles.requirementsCard}>
            <Text style={styles.requirementsTitle}>Quiz requirements</Text>
            <View style={styles.requirementRow}>
              <Ionicons
                name="checkmark-circle-outline"
                size={18}
                color={colors.success}
                accessibilityElementsHidden
              />
              <Text style={styles.requirementText}>
                Passing score:{' '}
                <Text style={styles.requirementValue}>{course.pass_score}%</Text>
              </Text>
            </View>
            <View style={styles.requirementRow}>
              <Ionicons
                name="ribbon-outline"
                size={18}
                color={colors.primary}
                accessibilityElementsHidden
              />
              <Text style={styles.requirementText}>
                Earn{' '}
                <Text style={styles.requirementValue}>
                  {course.ceu_value} CEU{course.ceu_value !== 1 ? 's' : ''}
                </Text>{' '}
                on passing
              </Text>
            </View>
          </Card>
        </View>
      </ScrollView>

      {/* ── Sticky footer ───────────────────────────────────────────────── */}
      <View style={styles.footer}>
        <Button
          title="Take Quiz"
          onPress={() => router.push(`/quiz/${courseId}`)}
          style={styles.quizButton}
          accessibilityLabel="Start the quiz for this course"
          accessibilityHint="Navigates to the quiz screen"
        />
      </View>
    </SafeAreaView>
  );

  function BackButton({ label }: { label: string }) {
    return (
      <Pressable
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={styles.backBtn}
      >
        <Ionicons name="arrow-back" size={22} color={colors.text} />
      </Pressable>
    );
  }
}

function formatDuration(seconds: number) {
  const minutes = Math.round(seconds / 60);
  return `${minutes} min`;
}

const createStyles = (
  colors: ReturnType<typeof usePreferences>['colors'],
  textScale: number,
) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    loadingWrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 32,
      gap: 14,
    },
    loadingText: {
      fontSize: 15 * textScale,
      fontFamily: Typography.body,
      color: colors.textSecondary,
    },
    errorTitle: {
      fontSize: 18 * textScale,
      fontFamily: Typography.headingSemiBold,
      color: colors.text,
    },
    errorText: {
      fontSize: 14 * textScale,
      fontFamily: Typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      gap: 10,
    },
    backBtn: {
      width: 36,
      height: 36,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
    },
    headerTitle: {
      flex: 1,
      fontSize: 16 * textScale,
      fontFamily: Typography.bodyBold,
      color: colors.text,
    },
    headerRight: { width: 36 },
    downloadBtn: {
      width: 36,
      height: 36,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
    },
    content: { paddingBottom: 24 },
    videoSection: {
      width: '100%',
      aspectRatio: 16 / 9,
      backgroundColor: colors.primary,
    },
    video: {
      width: '100%',
      height: '100%',
    },
    videoPlaceholder: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
    },
    thumbnailDim: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: withAlpha('#000000', '44'),
    },
    playIconWrap: {
      width: 100,
      height: 100,
      borderRadius: 50,
      alignItems: 'center',
      justifyContent: 'center',
    },
    placeholderText: {
      fontSize: 16 * textScale,
      fontFamily: Typography.bodyBold,
      color: colors.white,
    },
    placeholderSubtext: {
      fontSize: 13 * textScale,
      fontFamily: Typography.body,
      color: withAlpha(colors.white, 'CC'),
      textAlign: 'center',
      paddingHorizontal: 32,
    },
    body: {
      padding: 20,
      gap: 14,
    },
    metaRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    title: {
      fontSize: 22 * textScale,
      lineHeight: 30,
      fontFamily: Typography.heading,
      color: colors.text,
    },
    description: {
      fontSize: 15 * textScale,
      lineHeight: 23,
      fontFamily: Typography.body,
      color: colors.textSecondary,
    },
    requirementsCard: {
      gap: 10,
    },
    requirementsTitle: {
      fontSize: 14 * textScale,
      fontFamily: Typography.bodyBold,
      color: colors.text,
      marginBottom: 2,
    },
    requirementRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    requirementText: {
      fontSize: 14 * textScale,
      fontFamily: Typography.body,
      color: colors.textSecondary,
    },
    requirementValue: {
      fontFamily: Typography.bodyBold,
      color: colors.text,
    },
    footer: {
      paddingHorizontal: 20,
      paddingVertical: 14,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.card,
    },
    quizButton: {},
  });
