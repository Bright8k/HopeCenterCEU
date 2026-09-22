import { useEffect, useState } from 'react';
import {
  Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Switch, Text, View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { usePreferences } from '@/context/PreferencesContext';
import { hasSupabaseEnv, supabase } from '@/lib/supabase';
import { Typography, withAlpha } from '@/constants/theme';
import type { Database } from '@/types/database';

type ResourceRow    = Database['public']['Tables']['resources']['Row'];
type ResourceType   = ResourceRow['type'];
type ResourceTrack  = 'all' | 'RBT' | 'BCBA' | 'STUDENT';
type ResourceCat    = ResourceRow['category'];

const TYPES: ResourceType[]    = ['book', 'article', 'website'];
const TRACKS: ResourceTrack[]  = ['all', 'RBT', 'BCBA', 'STUDENT'];
const CATEGORIES: (ResourceCat | null)[] = [null, 'ethics', 'supervision', 'behavior-reduction', 'measurement', 'general'];
const CAT_LABELS: Record<string, string> = {
  ethics: 'Ethics', supervision: 'Supervision', 'behavior-reduction': 'Behavior reduction',
  measurement: 'Measurement', general: 'General',
};

export default function ResourceEditScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { colors, textScale } = usePreferences();
  const styles = createStyles(colors, textScale);
  const isNew = !id;

  const [title,     setTitle]     = useState('');
  const [author,    setAuthor]    = useState('');
  const [type,      setType]      = useState<ResourceType>('book');
  const [description, setDescription] = useState('');
  const [url,       setUrl]       = useState('');
  const [track,     setTrack]     = useState<ResourceTrack | 'all'>('all');
  const [category,  setCategory]  = useState<ResourceCat | null>(null);
  const [featured,  setFeatured]  = useState(false);
  const [pubYear,   setPubYear]   = useState('');
  const [saving,    setSaving]    = useState(false);
  const [deleting,  setDeleting]  = useState(false);

  useEffect(() => {
    if (!id || !hasSupabaseEnv) return;
    supabase.from('resources').select('*').eq('id', id).single().then(({ data }) => {
      if (!data) return;
      setTitle(data.title);
      setAuthor(data.author ?? '');
      setType(data.type);
      setDescription(data.description ?? '');
      setUrl(data.url ?? '');
      setTrack((data.track ?? 'all') as ResourceTrack);
      setCategory(data.category);
      setFeatured(data.is_featured);
      setPubYear(data.published_year ? String(data.published_year) : '');
    });
  }, [id]);

  async function handleSave() {
    if (!title.trim()) { Alert.alert('Required', 'Title is required.'); return; }
    if (!hasSupabaseEnv) { Alert.alert('Supabase not configured', 'Add your project values to .env first.'); return; }
    setSaving(true);
    const payload = {
      title: title.trim(),
      author:       author.trim() || null,
      type,
      description:  description.trim() || null,
      url:          url.trim() || null,
      track:        track === 'all' ? null : track,
      category,
      is_featured:  featured,
      published_year: pubYear.trim() ? parseInt(pubYear.trim(), 10) : null,
    };
    const { error } = isNew
      ? await supabase.from('resources').insert(payload)
      : await supabase.from('resources').update(payload).eq('id', id!);
    setSaving(false);
    if (error) { Alert.alert('Save failed', error.message); return; }
    router.back();
  }

  async function handleDelete() {
    if (!id || !hasSupabaseEnv) return;
    Alert.alert('Delete resource', 'This cannot be undone. Delete anyway?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          setDeleting(true);
          const { error } = await supabase.from('resources').delete().eq('id', id);
          setDeleting(false);
          if (error) { Alert.alert('Delete failed', error.message); return; }
          router.back();
        },
      },
    ]);
  }

  function ChipRow<T extends string>({
    label, values, current, labelFn, onSelect,
  }: { label: string; values: T[]; current: T; labelFn?: (v: T) => string; onSelect: (v: T) => void }) {
    return (
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <View style={styles.chipRow} accessibilityRole="radiogroup" accessibilityLabel={label}>
          {values.map((v) => {
            const sel = current === v;
            const lbl = labelFn ? labelFn(v) : String(v);
            return (
              <Pressable
                key={String(v)}
                onPress={() => onSelect(v)}
                accessibilityRole="radio"
                accessibilityLabel={lbl}
                accessibilityState={{ checked: sel }}
                style={[styles.chip, sel && { backgroundColor: colors.primary, borderColor: colors.primary }]}
              >
                <Text style={[styles.chipText, sel && { color: colors.white }]}>{lbl}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back" style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>{isNew ? 'Add resource' : 'Edit resource'}</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Input label="Title *" value={title} onChangeText={setTitle} placeholder="Resource title" />
        <Input label="Author / Source" value={author} onChangeText={setAuthor} placeholder="Author name or organization" />
        <Input label="URL" value={url} onChangeText={setUrl} placeholder="https://…" autoCapitalize="none" keyboardType="url" />
        <Input label="Published year" value={pubYear} onChangeText={setPubYear} placeholder="e.g. 2023" keyboardType="number-pad" />
        <Input label="Description" value={description} onChangeText={setDescription} placeholder="Brief description for learners…" multiline numberOfLines={3} />

        <ChipRow
          label="Type"
          values={TYPES}
          current={type}
          labelFn={(v) => v.charAt(0).toUpperCase() + v.slice(1)}
          onSelect={setType}
        />

        <ChipRow
          label="Track"
          values={TRACKS as ('all' | 'RBT' | 'BCBA' | 'STUDENT')[]}
          current={track}
          labelFn={(v) => v === 'all' ? 'All tracks' : v}
          onSelect={setTrack}
        />

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Category</Text>
          <View style={styles.chipRow}>
            {CATEGORIES.map((cat) => {
              const sel = category === cat;
              const lbl = cat === null ? 'None' : CAT_LABELS[cat];
              return (
                <Pressable
                  key={cat ?? 'none'}
                  onPress={() => setCategory(cat)}
                  accessibilityRole="radio"
                  accessibilityLabel={lbl}
                  accessibilityState={{ checked: sel }}
                  style={[styles.chip, sel && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                >
                  <Text style={[styles.chipText, sel && { color: colors.white }]}>{lbl}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.switchRow}>
          <View style={styles.switchLabel}>
            <Text style={styles.fieldLabel}>Featured</Text>
            <Text style={styles.fieldHint}>Featured resources appear at the top of the list.</Text>
          </View>
          <Switch
            value={featured}
            onValueChange={setFeatured}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.white}
            accessibilityLabel="Toggle featured"
            accessibilityRole="switch"
          />
        </View>

        <Button title={saving ? 'Saving…' : 'Save resource'} onPress={handleSave} disabled={saving} style={styles.saveBtn} />

        {!isNew && (
          <Button
            title={deleting ? 'Deleting…' : 'Delete resource'}
            onPress={handleDelete}
            disabled={deleting}
            variant="ghost"
            style={styles.deleteBtn}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ReturnType<typeof usePreferences>['colors'], textScale: number) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 10 },
    backBtn: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
    headerTitle: { flex: 1, fontSize: 17 * textScale, fontFamily: Typography.bodyBold, color: colors.text },
    headerRight: { width: 44 },
    content: { padding: 16, paddingBottom: 40, gap: 16 },
    fieldGroup: { gap: 8 },
    fieldLabel: { fontSize: 14 * textScale, fontFamily: Typography.bodyBold, color: colors.text },
    fieldHint: { fontSize: 12 * textScale, fontFamily: Typography.body, color: colors.textSecondary },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
    chipText: { fontSize: 13 * textScale, fontFamily: Typography.bodySemiBold, color: colors.textSecondary },
    switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
    switchLabel: { flex: 1, gap: 2 },
    saveBtn: { marginTop: 8 },
    deleteBtn: { borderColor: withAlpha(colors.error, '60') },
  });
