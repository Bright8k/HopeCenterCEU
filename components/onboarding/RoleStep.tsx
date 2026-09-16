import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { InteractivePressable } from '@/components/ui/InteractivePressable';
import { usePreferences } from '@/context/PreferencesContext';
import { ROLE_LABELS, ROLE_CEU_REQUIREMENTS, type UserRole } from '@/constants/roles';
import { Typography, withAlpha } from '@/constants/theme';

const ROLES: UserRole[] = ['RBT', 'BCBA', 'STUDENT'];

export function RoleStep({
  selectedRole,
  onSelect,
}: {
  selectedRole: UserRole | null;
  onSelect: (role: UserRole) => void;
}) {
  const { colors, textScale } = usePreferences();
  const styles = createStyles(colors, textScale);

  function Pill({ label, active }: { label: string; active: boolean }) {
    return (
      <View style={[styles.pill, active && styles.pillActive]}>
        <Text style={[styles.pillText, active && styles.pillTextActive]}>{label}</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.stepContainer} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepEyebrow}>Step 1 of 2</Text>
      <Text style={styles.stepTitle}>Choose your learning path</Text>
      <Text style={styles.stepSubtitle}>
        Pick the role that matches your training track. This shapes your library, CEU targets, and renewal plan.
      </Text>
      {ROLES.map((role) => {
        const isSelected = selectedRole === role;
        const req = ROLE_CEU_REQUIREMENTS[role];
        const isStudent = role === 'STUDENT';
        return (
          <InteractivePressable
            key={role}
            style={[styles.roleCard, isSelected && styles.roleCardSelected]}
            hoverStyle={styles.roleCardHover}
            onPress={() => onSelect(role)}
            accessibilityLabel={ROLE_LABELS[role]}
            accessibilityHint={`Selects the ${role} learning track`}
            accessibilityState={{ selected: isSelected }}
          >
            <View style={styles.roleCardHeader}>
              <View style={styles.roleCardCopy}>
                <Text style={[styles.roleCode, isSelected && styles.roleCodeSelected]}>{role}</Text>
                <Text style={[styles.roleTitle, isSelected && styles.roleTitleSelected]}>{ROLE_LABELS[role]}</Text>
              </View>
              <View style={[styles.roleIconWrap, isSelected && styles.roleIconWrapSelected]}>
                <Ionicons name={isStudent ? 'school-outline' : role === 'BCBA' ? 'ribbon-outline' : 'medkit-outline'} size={20} color={isSelected ? colors.white : colors.primary} />
              </View>
            </View>
            <Text style={[styles.roleDesc, isSelected && styles.roleDescSelected]}>{req.description}</Text>
            <View style={styles.rolePillRow}>
              <Pill label={isStudent ? 'Board prep' : `${req.total} CEUs`} active={isSelected} />
              <Pill label={isStudent ? 'Student track' : `${req.cycleYears}-year cycle`} active={isSelected} />
            </View>
          </InteractivePressable>
        );
      })}
    </ScrollView>
  );
}

const createStyles = (colors: ReturnType<typeof usePreferences>['colors'], textScale: number) =>
  StyleSheet.create({
    stepContainer: { padding: 24, paddingBottom: 16 },
    stepEyebrow: { fontSize: 12 * textScale, fontFamily: Typography.bodyBold, letterSpacing: 0.5, textTransform: 'uppercase', color: colors.primary, marginBottom: 8 },
    stepTitle: { fontSize: 28 * textScale, lineHeight: 35, fontFamily: Typography.heading, color: colors.text, marginBottom: 10 },
    stepSubtitle: { fontSize: 14 * textScale, lineHeight: 21, fontFamily: Typography.body, color: colors.textSecondary, marginBottom: 22 },
    roleCard: { borderRadius: 18, padding: 18, marginBottom: 12, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.card },
    roleCardSelected: { borderColor: colors.primary, backgroundColor: withAlpha(colors.primary, '10') },
    roleCardHover: { transform: [{ translateY: -1 }], borderColor: colors.primary, shadowColor: colors.primary, shadowOpacity: 0.12, shadowRadius: 12 },
    roleCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 10 },
    roleCardCopy: { flex: 1 },
    roleCode: { fontSize: 11 * textScale, fontFamily: Typography.bodyBold, color: colors.textSecondary, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 },
    roleCodeSelected: { color: colors.primary },
    roleTitle: { fontSize: 18 * textScale, fontFamily: Typography.bodyBold, color: colors.text },
    roleTitleSelected: { color: colors.primary },
    roleIconWrap: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: withAlpha(colors.primary, '12') },
    roleIconWrapSelected: { backgroundColor: colors.primary },
    roleDesc: { fontSize: 13 * textScale, lineHeight: 19, fontFamily: Typography.body, color: colors.textSecondary, marginBottom: 12 },
    roleDescSelected: { color: withAlpha(colors.primary, 'CC') },
    rolePillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    pill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: colors.surfaceMuted },
    pillActive: { backgroundColor: withAlpha(colors.accent, '2A') },
    pillText: { fontSize: 12 * textScale, fontFamily: Typography.bodyBold, color: colors.textSecondary },
    pillTextActive: { color: colors.accentDark },
  });
