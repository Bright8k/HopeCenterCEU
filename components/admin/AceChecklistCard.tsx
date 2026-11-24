import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AceSettingsForm } from '@/components/admin/AceSettingsForm';
import { AceExportButtons } from '@/components/admin/AceExportButtons';
import { usePreferences } from '@/context/PreferencesContext';
import { useAceChecklist, type AceChecklistItem } from '@/hooks/useAceChecklist';
import { tapHaptic } from '@/lib/haptics';
import { Typography, withAlpha } from '@/constants/theme';

export function AceChecklistCard() {
  const { colors, textScale, preferences } = usePreferences();
  const styles = createStyles(colors, textScale);
  const { items, courseIssues, settings, save, toggleManual, loading, remaining } = useAceChecklist();
  const [editing, setEditing] = useState(false);
  const [toggleError, setToggleError] = useState<string | null>(null);

  async function handleToggle(item: AceChecklistItem) {
    tapHaptic(preferences.haptics);
    setToggleError(await toggleManual(item.key));
  }

  return (
    <Card variant="elevated" style={styles.card}>
      <View style={styles.headerRow}>
        <Ionicons name="clipboard-outline" size={20} color={colors.primary} accessibilityElementsHidden />
        <Text style={styles.title} accessibilityRole="header">ACE compliance to-do</Text>
        {!loading && (
          <Text style={[styles.count, remaining === 0 && { color: colors.success }]}>
            {remaining === 0 ? 'All done' : `${remaining} left`}
          </Text>
        )}
      </View>
      <Text style={styles.intro}>
        Required by the BACB ACE Provider Handbook before courses can award CEUs or PDUs.
      </Text>

      {loading || !settings ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} accessibilityLabel="Loading checklist" />
      ) : (
        <>
          {items.map((item) => {
            const icon = item.done ? 'checkmark-circle' : item.manual ? 'ellipse-outline' : 'alert-circle-outline';
            const iconColor = item.done ? colors.success : item.manual ? colors.textSecondary : colors.warning;
            const body = (
              <>
                <Ionicons name={icon} size={22} color={iconColor} accessibilityElementsHidden />
                <View style={styles.itemCopy}>
                  <Text style={[styles.itemTitle, item.done && styles.itemDone]}>{item.title}</Text>
                  <Text style={styles.itemDetail}>{item.detail}</Text>
                  {item.key === 'course_compliance' && courseIssues.map((c) => (
                    <Pressable
                      key={c.id}
                      onPress={() => router.push({ pathname: '/(admin)/course-edit', params: { id: c.id } })}
                      accessibilityRole="link"
                      accessibilityLabel={`Edit ${c.title}`}
                      accessibilityHint={c.issues.join('. ')}
                      style={({ pressed }) => [styles.issueRow, pressed && { opacity: 0.7 }]}
                    >
                      <Text style={styles.issueTitle}>{c.title}</Text>
                      <Text style={styles.issueText}>{c.issues.join(' · ')}</Text>
                    </Pressable>
                  ))}
                </View>
              </>
            );
            return item.manual ? (
              <Pressable
                key={item.key}
                onPress={() => handleToggle(item)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: item.done }}
                accessibilityLabel={item.title}
                accessibilityHint="Marks this step done or not done"
                style={({ pressed }) => [styles.item, pressed && { opacity: 0.75 }]}
              >
                {body}
              </Pressable>
            ) : (
              <View
                key={item.key}
                style={styles.item}
                accessible={item.key !== 'course_compliance' || courseIssues.length === 0}
                accessibilityLabel={`${item.done ? 'Done' : 'To do'}: ${item.title}`}
              >
                {body}
              </View>
            );
          })}

          {toggleError ? <Text style={styles.error} accessibilityRole="alert">{toggleError}</Text> : null}

          {editing ? (
            <AceSettingsForm settings={settings} onSave={save} onDone={() => setEditing(false)} />
          ) : (
            <Button
              title="Edit provider details"
              variant="outline"
              onPress={() => setEditing(true)}
              style={styles.editBtn}
              accessibilityHint="Enter the ACE provider number, coordinator, and approval date"
            />
          )}

          <AceExportButtons />
        </>
      )}
    </Card>
  );
}

const createStyles = (colors: ReturnType<typeof usePreferences>['colors'], textScale: number) =>
  StyleSheet.create({
    card: { marginBottom: 28 },
    headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    title: { flex: 1, fontSize: 16 * textScale, fontFamily: Typography.bodyBold, color: colors.text },
    count: { fontSize: 13 * textScale, fontFamily: Typography.bodyBold, color: colors.warning },
    intro: { fontSize: 13 * textScale, fontFamily: Typography.body, color: colors.textSecondary, marginBottom: 12, lineHeight: 19 },
    loader: { marginVertical: 16 },
    item: { flexDirection: 'row', gap: 10, paddingVertical: 10, minHeight: 44, borderTopWidth: 1, borderTopColor: colors.border },
    itemCopy: { flex: 1, gap: 2 },
    itemTitle: { fontSize: 14 * textScale, fontFamily: Typography.bodySemiBold, color: colors.text },
    itemDone: { color: colors.textSecondary },
    itemDetail: { fontSize: 12 * textScale, fontFamily: Typography.body, color: colors.textSecondary, lineHeight: 17 },
    issueRow: { marginTop: 8, padding: 10, borderRadius: 10, backgroundColor: withAlpha(colors.warning, '12'), minHeight: 44 },
    issueTitle: { fontSize: 13 * textScale, fontFamily: Typography.bodyBold, color: colors.text },
    issueText: { fontSize: 12 * textScale, fontFamily: Typography.body, color: colors.textSecondary, marginTop: 2 },
    error: { fontSize: 13 * textScale, fontFamily: Typography.bodySemiBold, color: colors.error, marginTop: 8 },
    editBtn: { marginTop: 12 },
  });
