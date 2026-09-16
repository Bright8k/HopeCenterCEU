import { ScrollView, View } from 'react-native';
import { usePreferences } from '@/context/PreferencesContext';
import { Skeleton } from '@/components/ui/Skeleton';
import { withAlpha } from '@/constants/theme';

export function CourseLibrarySkeleton() {
  const { colors } = usePreferences();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 16, paddingBottom: 36, backgroundColor: colors.background }}
      scrollEnabled={false}
      accessibilityLabel="Loading course library"
    >
      <View style={{ borderRadius: 20, padding: 20, marginBottom: 14, backgroundColor: colors.card, gap: 10 }}>
        <Skeleton width={104} height={26} borderRadius={13} style={{ backgroundColor: withAlpha(colors.textMuted, '30') }} />
        <Skeleton width="68%" height={32} borderRadius={8} style={{ backgroundColor: withAlpha(colors.textMuted, '30') }} />
        <Skeleton height={14} borderRadius={6} style={{ backgroundColor: withAlpha(colors.textMuted, '25') }} />
        <Skeleton width="75%" height={14} borderRadius={6} style={{ backgroundColor: withAlpha(colors.textMuted, '25') }} />
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
          <Skeleton width="48%" height={54} borderRadius={18} style={{ backgroundColor: withAlpha(colors.textMuted, '22') }} />
          <Skeleton width="48%" height={54} borderRadius={18} style={{ backgroundColor: withAlpha(colors.textMuted, '22') }} />
        </View>
      </View>
      <Skeleton height={44} borderRadius={12} style={{ marginBottom: 14 }} />
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 18 }}>
        {[78, 52, 62, 78].map((w, i) => (
          <Skeleton key={i} width={w} height={34} borderRadius={17} />
        ))}
      </View>
      <Skeleton height={162} borderRadius={16} style={{ marginBottom: 18 }} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Skeleton width={148} height={18} borderRadius={6} />
        <Skeleton width={26} height={18} borderRadius={6} />
      </View>
      {[0, 1, 2, 3].map((i) => (
        <Skeleton key={i} height={104} borderRadius={16} style={{ marginBottom: 10 }} />
      ))}
    </ScrollView>
  );
}
