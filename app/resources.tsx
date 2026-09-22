import { useState, useMemo } from 'react';
import {
  FlatList,
  Linking,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { usePreferences } from '@/context/PreferencesContext';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { useResources, type Resource } from '@/hooks/useResources';
import { Typography, withAlpha } from '@/constants/theme';

type TypeFilter = 'all' | 'book' | 'article' | 'website';

const TYPE_FILTERS: { key: TypeFilter; label: string; icon: string }[] = [
  { key: 'all',     label: 'All',      icon: 'grid-outline' },
  { key: 'book',    label: 'Books',    icon: 'book-outline' },
  { key: 'article', label: 'Articles', icon: 'document-text-outline' },
  { key: 'website', label: 'Sites',    icon: 'globe-outline' },
];

const TRACK_BADGE_VARIANT: Record<string, 'primary' | 'success' | 'accent'> = {
  RBT: 'primary', BCBA: 'success', STUDENT: 'accent',
};

const TYPE_ICON: Record<Resource['type'], keyof typeof Ionicons.glyphMap> = {
  book:    'book-outline',
  article: 'document-text-outline',
  website: 'globe-outline',
};

export default function ResourcesScreen() {
  const { role } = useAuth();
  const { colors, textScale } = usePreferences();
  const { resources, loading } = useResources(role);
  const styles = createStyles(colors, textScale);

  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return resources.filter((r) => {
      if (typeFilter !== 'all' && r.type !== typeFilter) return false;
      if (!q) return true;
      return (
        r.title.toLowerCase().includes(q) ||
        (r.author?.toLowerCase().includes(q) ?? false) ||
        (r.description?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [resources, typeFilter, query]);

  const featured = filtered.filter((r) => r.is_featured);
  const rest = filtered.filter((r) => !r.is_featured);
  const listData: (Resource | { id: string; isSectionHeader: true; label: string })[] = [
    ...(featured.length > 0 ? [{ id: 'hdr-featured', isSectionHeader: true as const, label: 'Featured' }] : []),
    ...featured,
    ...(rest.length > 0 ? [{ id: 'hdr-all', isSectionHeader: true as const, label: featured.length > 0 ? 'All resources' : 'All resources' }] : []),
    ...rest,
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Study Resources</Text>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={18} color={colors.textMuted} style={styles.searchIcon} accessibilityElementsHidden />
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Search books, articles…"
          placeholderTextColor={colors.textMuted}
          returnKeyType="search"
          accessibilityLabel="Search resources"
          clearButtonMode="while-editing"
        />
      </View>

      <View style={styles.filterRow} accessibilityRole="tablist">
        {TYPE_FILTERS.map(({ key, label }) => {
          const active = typeFilter === key;
          return (
            <Pressable
              key={key}
              onPress={() => setTypeFilter(key)}
              accessibilityRole="tab"
              accessibilityLabel={label}
              accessibilityState={{ selected: active }}
              style={[styles.filterChip, active && { backgroundColor: colors.primary, borderColor: colors.primary }]}
            >
              <Text style={[styles.filterChipText, active && { color: colors.white }]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>

      {loading ? (
        <View style={styles.skeletonWrap}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={130} borderRadius={16} style={{ marginHorizontal: 16, marginBottom: 12 }} />
          ))}
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Ionicons name="library-outline" size={52} color={colors.textMuted} accessibilityElementsHidden />
          <Text style={styles.emptyTitle}>No resources found</Text>
          <Text style={styles.emptyText}>
            {query ? 'Try a different search term.' : 'Resources will appear here once added.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={listData}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            if ('isSectionHeader' in item) {
              return <Text style={styles.sectionHeader}>{item.label}</Text>;
            }
            return <ResourceCard resource={item} styles={styles} colors={colors} />;
          }}
        />
      )}
    </SafeAreaView>
  );
}

function ResourceCard({
  resource,
  styles,
  colors,
}: {
  resource: Resource;
  styles: ReturnType<typeof createStyles>;
  colors: ReturnType<typeof usePreferences>['colors'];
}) {
  async function openUrl() {
    if (!resource.url) return;
    const supported = await Linking.canOpenURL(resource.url);
    if (supported) Linking.openURL(resource.url);
  }

  return (
    <Card variant="elevated" style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.typeIcon, { backgroundColor: withAlpha(colors.primary, '14') }]}>
          <Ionicons name={TYPE_ICON[resource.type]} size={20} color={colors.primary} accessibilityElementsHidden />
        </View>
        <View style={styles.cardMeta}>
          {resource.track ? (
            <Badge label={resource.track} variant={TRACK_BADGE_VARIANT[resource.track] ?? 'primary'} />
          ) : null}
          {resource.is_featured ? (
            <Badge label="Featured" variant="accent" />
          ) : null}
        </View>
      </View>

      <Text style={styles.cardTitle}>{resource.title}</Text>

      {(resource.author || resource.published_year) ? (
        <Text style={styles.cardAuthor}>
          {[resource.author, resource.published_year].filter(Boolean).join(' · ')}
        </Text>
      ) : null}

      {resource.description ? (
        <Text style={styles.cardDesc} numberOfLines={3}>{resource.description}</Text>
      ) : null}

      {resource.url ? (
        <Pressable
          onPress={openUrl}
          accessibilityRole="link"
          accessibilityLabel={`Open ${resource.title}`}
          accessibilityHint="Opens in your browser"
          style={styles.openBtn}
        >
          <Text style={styles.openBtnText}>Open resource</Text>
          <Ionicons name="open-outline" size={14} color={colors.primary} accessibilityElementsHidden />
        </Pressable>
      ) : (
        <View style={styles.noLinkRow}>
          <Ionicons name="storefront-outline" size={14} color={colors.textMuted} accessibilityElementsHidden />
          <Text style={styles.noLinkText}>Available in print — search your library or bookstore</Text>
        </View>
      )}
    </Card>
  );
}

const createStyles = (colors: ReturnType<typeof usePreferences>['colors'], textScale: number) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 10 },
    backBtn: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
    headerTitle: { flex: 1, fontSize: 17 * textScale, fontFamily: Typography.bodyBold, color: colors.text },
    headerRight: { width: 44 },
    searchRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginTop: 14, marginBottom: 10, paddingHorizontal: 12, height: 44, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
    searchIcon: { marginRight: 8 },
    searchInput: { flex: 1, fontSize: 15 * textScale, fontFamily: Typography.body, color: colors.text },
    filterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 12 },
    filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
    filterChipText: { fontSize: 13 * textScale, fontFamily: Typography.bodySemiBold, color: colors.textSecondary },
    skeletonWrap: { marginTop: 8 },
    emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 },
    emptyTitle: { fontSize: 17 * textScale, fontFamily: Typography.headingSemiBold, color: colors.text },
    emptyText: { fontSize: 14 * textScale, fontFamily: Typography.body, color: colors.textSecondary, textAlign: 'center', maxWidth: 280 },
    listContent: { paddingHorizontal: 16, paddingBottom: 32 },
    sectionHeader: { fontSize: 12 * textScale, fontFamily: Typography.bodyBold, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10, marginTop: 4 },
    card: { marginBottom: 12, gap: 6 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
    typeIcon: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
    cardMeta: { flexDirection: 'row', gap: 6 },
    cardTitle: { fontSize: 16 * textScale, fontFamily: Typography.bodyBold, color: colors.text, lineHeight: 22 },
    cardAuthor: { fontSize: 13 * textScale, fontFamily: Typography.body, color: colors.textSecondary },
    cardDesc: { fontSize: 14 * textScale, fontFamily: Typography.body, color: colors.textSecondary, lineHeight: 21 },
    openBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', marginTop: 4 },
    openBtnText: { fontSize: 13 * textScale, fontFamily: Typography.bodySemiBold, color: colors.primary },
    noLinkRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
    noLinkText: { fontSize: 12 * textScale, fontFamily: Typography.body, color: colors.textMuted },
  });
