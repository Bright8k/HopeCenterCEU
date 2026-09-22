import { useEffect, useState } from 'react';
import { FlatList, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { usePreferences } from '@/context/PreferencesContext';
import { hasSupabaseEnv, supabase } from '@/lib/supabase';
import { Typography, withAlpha } from '@/constants/theme';
import type { Resource } from '@/hooks/useResources';

const TYPE_ICON: Record<Resource['type'], keyof typeof Ionicons.glyphMap> = {
  book:    'book-outline',
  article: 'document-text-outline',
  website: 'globe-outline',
};

export default function AdminResourcesScreen() {
  const { colors, textScale } = usePreferences();
  const styles = createStyles(colors, textScale);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasSupabaseEnv) { setLoading(false); return; }
    supabase.from('resources').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      setResources(data ?? []);
      setLoading(false);
    });
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back" style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Study Resources</Text>
        <Pressable
          onPress={() => router.push('/(admin)/resource-edit')}
          accessibilityRole="button"
          accessibilityLabel="Add new resource"
          style={styles.addBtn}
        >
          <Ionicons name="add" size={24} color={colors.primary} />
        </Pressable>
      </View>

      {loading ? (
        <View style={{ padding: 16, gap: 12 }}>
          {[0, 1, 2].map((i) => <Skeleton key={i} height={90} borderRadius={16} />)}
        </View>
      ) : resources.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Ionicons name="library-outline" size={48} color={colors.textMuted} accessibilityElementsHidden />
          <Text style={styles.emptyTitle}>No resources yet</Text>
          <Text style={styles.emptyText}>Tap + to add the first study resource.</Text>
        </View>
      ) : (
        <FlatList
          data={resources}
          keyExtractor={(r) => r.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push({ pathname: '/(admin)/resource-edit', params: { id: item.id } })}
              accessibilityRole="button"
              accessibilityLabel={`Edit ${item.title}`}
            >
              <Card variant="elevated" style={styles.card}>
                <View style={styles.cardRow}>
                  <View style={[styles.typeIcon, { backgroundColor: withAlpha(colors.primary, '14') }]}>
                    <Ionicons name={TYPE_ICON[item.type]} size={18} color={colors.primary} accessibilityElementsHidden />
                  </View>
                  <View style={styles.cardBody}>
                    <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                    {item.author ? <Text style={styles.cardAuthor} numberOfLines={1}>{item.author}</Text> : null}
                    <View style={styles.badgeRow}>
                      <Badge label={item.type} variant="muted" />
                      {item.track ? <Badge label={item.track} variant="primary" /> : null}
                      {item.is_featured ? <Badge label="Featured" variant="accent" /> : null}
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} accessibilityElementsHidden />
                </View>
              </Card>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const createStyles = (colors: ReturnType<typeof usePreferences>['colors'], textScale: number) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 10 },
    backBtn: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
    headerTitle: { flex: 1, fontSize: 17 * textScale, fontFamily: Typography.bodyBold, color: colors.text },
    addBtn: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: withAlpha(colors.primary, '12') },
    emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 },
    emptyTitle: { fontSize: 17 * textScale, fontFamily: Typography.headingSemiBold, color: colors.text },
    emptyText: { fontSize: 14 * textScale, fontFamily: Typography.body, color: colors.textSecondary, textAlign: 'center' },
    listContent: { padding: 16, paddingBottom: 32 },
    card: { marginBottom: 10 },
    cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    typeIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    cardBody: { flex: 1, gap: 3 },
    cardTitle: { fontSize: 15 * textScale, fontFamily: Typography.bodyBold, color: colors.text },
    cardAuthor: { fontSize: 13 * textScale, fontFamily: Typography.body, color: colors.textSecondary },
    badgeRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  });
