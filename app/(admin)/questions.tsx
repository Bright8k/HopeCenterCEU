import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { InteractivePressable } from '@/components/ui/InteractivePressable';
import { usePreferences } from '@/context/PreferencesContext';
import { hasSupabaseEnv, supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';
import { Typography, withAlpha } from '@/constants/theme';

type Course = Pick<Database['public']['Tables']['courses']['Row'], 'id' | 'title' | 'track'>;
type Question = Database['public']['Tables']['questions']['Row'];

export default function AdminQuestions() {
  const { colors, textScale } = usePreferences();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [questionQuery, setQuestionQuery] = useState('');
  const styles = createStyles(colors, textScale);

  useEffect(() => {
    if (!hasSupabaseEnv) { setLoadingCourses(false); return; }
    supabase
      .from('courses')
      .select('id, title, track')
      .order('title')
      .then(({ data }) => {
        setCourses((data as Course[]) ?? []);
        setLoadingCourses(false);
      });
  }, []);

  const fetchQuestions = useCallback(async (courseId: string) => {
    if (!hasSupabaseEnv) return;
    setLoadingQuestions(true);
    const { data } = await supabase
      .from('questions')
      .select('*')
      .eq('course_id', courseId)
      .order('domain');
    setQuestions((data as Question[]) ?? []);
    setLoadingQuestions(false);
  }, []);

  const selectCourse = (course: Course) => {
    setSelectedCourse(course);
    setQuestionQuery('');
    fetchQuestions(course.id);
  };

  const deleteQuestion = (q: Question) => {
    Alert.alert('Delete question?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('questions').delete().eq('id', q.id);
          if (error) Alert.alert('Error', error.message);
          else setQuestions((prev) => prev.filter((item) => item.id !== q.id));
        },
      },
    ]);
  };

  const filteredQuestions = useMemo(() => {
    const q = questionQuery.trim().toLowerCase();
    if (!q) return questions;
    return questions.filter(
      (item) =>
        item.stem.toLowerCase().includes(q) ||
        (item.domain?.toLowerCase().includes(q) ?? false),
    );
  }, [questions, questionQuery]);

  return (
    <View style={styles.container}>
      {/* Course selector strip */}
      <View style={styles.selectorSection}>
        <Text style={styles.selectorLabel}>Select course</Text>
        {loadingCourses ? (
          <ActivityIndicator color={colors.primary} style={{ marginVertical: 8 }} />
        ) : courses.length === 0 ? (
          <Text style={styles.noCoursesText}>No courses found. Create a course first.</Text>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.courseChips}
          >
            {courses.map((c) => {
              const selected = selectedCourse?.id === c.id;
              return (
                <Pressable
                  key={c.id}
                  onPress={() => selectCourse(c)}
                  accessibilityRole="button"
                  accessibilityLabel={`Select course: ${c.title}`}
                  accessibilityState={{ selected }}
                  style={({ pressed }) => [
                    styles.courseChip,
                    selected && styles.courseChipSelected,
                    pressed && { opacity: 0.75 },
                  ]}
                >
                  <Text
                    style={[styles.courseChipText, selected && styles.courseChipTextSelected]}
                    numberOfLines={1}
                  >
                    {c.title}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        )}
      </View>

      {!selectedCourse ? (
        <View style={styles.empty}>
          <Ionicons name="help-circle-outline" size={48} color={colors.textMuted} />
          <Text style={styles.emptyText}>Select a course above to view its questions.</Text>
        </View>
      ) : (
        <View style={styles.questionSection}>
          <View style={styles.questionHeader}>
            <View style={styles.questionSearchWrap}>
              <Ionicons name="search-outline" size={15} color={colors.textSecondary} />
              <TextInput
                value={questionQuery}
                onChangeText={setQuestionQuery}
                placeholder="Filter questions…"
                placeholderTextColor={colors.textSecondary}
                style={styles.questionSearchInput}
                autoCapitalize="none"
                accessibilityLabel="Filter questions"
              />
              {questionQuery.length > 0 && (
                <Pressable onPress={() => setQuestionQuery('')} accessibilityLabel="Clear filter">
                  <Ionicons name="close-circle" size={15} color={colors.textSecondary} />
                </Pressable>
              )}
            </View>
            <Button
              title="+ Add"
              onPress={() =>
                router.push({
                  pathname: '/(admin)/question-edit',
                  params: { courseId: selectedCourse.id },
                })
              }
              style={styles.addBtn}
              accessibilityLabel={`Add question to ${selectedCourse.title}`}
            />
          </View>

          <View style={styles.countRow}>
            <Text style={styles.questionCount}>
              {loadingQuestions
                ? '…'
                : questionQuery
                ? `${filteredQuestions.length} of ${questions.length}`
                : `${questions.length} question${questions.length !== 1 ? 's' : ''}`}
            </Text>
          </View>

          {loadingQuestions ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
          ) : filteredQuestions.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>
                {questionQuery ? `No questions match "${questionQuery}".` : 'No questions yet for this course.'}
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredQuestions}
              keyExtractor={(q) => q.id}
              contentContainerStyle={styles.questionList}
              renderItem={({ item, index }) => (
                <Card style={styles.qCard}>
                  <View style={styles.qRow}>
                    <View style={[styles.qIndexWrap, { backgroundColor: withAlpha(colors.primary, '14') }]}>
                      <Text style={styles.qIndex}>{index + 1}</Text>
                    </View>
                    <View style={styles.qMeta}>
                      <Text style={styles.qStem} numberOfLines={3}>{item.stem}</Text>
                      <View style={styles.qBadgeRow}>
                        {item.domain ? <Badge label={item.domain} variant="muted" /> : null}
                        {item.track ? <Badge label={item.track} variant="primary" /> : null}
                      </View>
                    </View>
                    <View style={styles.qActions}>
                      <InteractivePressable
                        onPress={() =>
                          router.push({ pathname: '/(admin)/question-edit', params: { id: item.id } })
                        }
                        accessibilityLabel="Edit question"
                      >
                        {() => (
                          <View style={[styles.qBtn, { backgroundColor: withAlpha(colors.primary, '14') }]}>
                            <Ionicons name="pencil-outline" size={16} color={colors.primary} />
                          </View>
                        )}
                      </InteractivePressable>
                      <InteractivePressable
                        onPress={() => deleteQuestion(item)}
                        accessibilityLabel="Delete question"
                      >
                        {() => (
                          <View style={[styles.qBtn, { backgroundColor: withAlpha(colors.error, '14') }]}>
                            <Ionicons name="trash-outline" size={16} color={colors.error} />
                          </View>
                        )}
                      </InteractivePressable>
                    </View>
                  </View>
                </Card>
              )}
            />
          )}
        </View>
      )}
    </View>
  );
}

const createStyles = (
  colors: ReturnType<typeof usePreferences>['colors'],
  textScale: number,
) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    selectorSection: {
      padding: 16, paddingBottom: 12,
      borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    selectorLabel: {
      fontSize: 11 * textScale, fontFamily: Typography.bodyBold,
      color: colors.primary, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10,
    },
    noCoursesText: { fontSize: 13 * textScale, fontFamily: Typography.body, color: colors.textMuted },
    courseChips: { gap: 8, paddingRight: 16 },
    courseChip: {
      paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20,
      borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.card, maxWidth: 200,
    },
    courseChipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
    courseChipText: { fontSize: 13 * textScale, fontFamily: Typography.bodySemiBold, color: colors.text },
    courseChipTextSelected: { color: colors.white },
    questionSection: { flex: 1 },
    questionHeader: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      padding: 16, paddingBottom: 8,
    },
    questionSearchWrap: {
      flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
      borderWidth: 1, borderColor: colors.border, borderRadius: 10,
      paddingHorizontal: 10, paddingVertical: 8, backgroundColor: colors.surface,
    },
    questionSearchInput: {
      flex: 1, fontSize: 13 * textScale, fontFamily: Typography.body, color: colors.text,
    },
    addBtn: { paddingVertical: 9, paddingHorizontal: 14, minHeight: 44 },
    countRow: { paddingHorizontal: 16, paddingBottom: 4 },
    questionCount: { fontSize: 12 * textScale, fontFamily: Typography.body, color: colors.textSecondary },
    questionList: { padding: 16, paddingTop: 4 },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 },
    emptyText: {
      fontSize: 14 * textScale, fontFamily: Typography.body, color: colors.textMuted, textAlign: 'center',
    },
    qCard: { marginBottom: 10 },
    qRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
    qIndexWrap: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    qIndex: { fontSize: 12 * textScale, fontFamily: Typography.bodyBold, color: colors.primary },
    qMeta: { flex: 1, gap: 6 },
    qStem: { fontSize: 14 * textScale, fontFamily: Typography.body, color: colors.text },
    qBadgeRow: { flexDirection: 'row', gap: 6 },
    qActions: { flexDirection: 'row', gap: 6 },
    qBtn: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  });
