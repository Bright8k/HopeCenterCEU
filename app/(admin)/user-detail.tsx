import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { usePreferences } from '@/context/PreferencesContext';
import { useAdminUserDetail, type AdminUserCompletion } from '@/hooks/useAdminUsers';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { formatRenewalDate } from '@/hooks/useProfile';
import { ROLE_CEU_REQUIREMENTS, ROLE_LABELS, type UserRole } from '@/constants/roles';
import { hasSupabaseEnv, supabase } from '@/lib/supabase';
import { Typography, withAlpha } from '@/constants/theme';

const ROLES: UserRole[] = ['RBT', 'BCBA', 'STUDENT'];

export default function AdminUserDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, textScale } = usePreferences();
  const { detail, loading, refetch } = useAdminUserDetail(id ?? '');
  const [roleModal, setRoleModal] = useState(false);
  const [pendingRole, setPendingRole] = useState<UserRole | null>(null);
  const [roleSaving, setRoleSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminChecked, setAdminChecked] = useState(false);
  const [adminToggling, setAdminToggling] = useState(false);
  const [resetSending, setResetSending] = useState(false);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const styles = createStyles(colors, textScale);

  // Check whether the target user has admin status via a security-definer RPC.
  // Direct admin_roles queries are blocked by RLS for cross-user reads.
  // Cast needed: is_user_admin is a new migration not yet reflected in generated types.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useEffect(() => {
    if (!id || !hasSupabaseEnv) return;
    (supabase as any)
      .rpc('is_user_admin', { target_user_id: id })
      .then(({ data }: { data: boolean | null }) => {
        setIsAdmin(data === true);
        setAdminChecked(true);
      });
  }, [id]);

  async function handleSaveRole() {
    if (!pendingRole || !id || !hasSupabaseEnv) return;
    setRoleSaving(true);
    const { error } = await supabase.functions.invoke('set-user-role', {
      body: { userId: id, role: pendingRole },
    });
    setRoleSaving(false);
    if (error) {
      Alert.alert('Could not update role', 'Please try again shortly.');
      return;
    }
    setRoleModal(false);
    setPendingRole(null);
    refetch();
  }

  async function handleSendReset() {
    if (!id || !hasSupabaseEnv) return;
    setResetSending(true);
    const { error } = await supabase.functions.invoke('send-password-reset', {
      body: { userId: id },
    });
    setResetSending(false);
    if (error) {
      Alert.alert('Could not send reset email', error.message ?? 'Please try again.');
      return;
    }
    Alert.alert('Reset email sent', `A password reset link has been sent to ${detail?.displayName}.`);
  }

  async function handleToggleAdmin() {
    if (!id || !hasSupabaseEnv) return;
    const grant = !isAdmin;
    setAdminToggling(true);
    const { error } = await supabase.functions.invoke('toggle-admin', {
      body: { userId: id, grant },
    });
    setAdminToggling(false);
    if (error) {
      Alert.alert('Could not update admin status', error.message ?? 'Please try again.');
      return;
    }
    setIsAdmin(grant);
  }

  async function handleDeleteUser() {
    if (!id || !hasSupabaseEnv) return;
    setDeleting(true);
    const { error } = await supabase.functions.invoke('delete-user', {
      body: { userId: id },
    });
    setDeleting(false);
    if (error) {
      Alert.alert('Could not delete user', error.message ?? 'Please try again.');
      setDeleteConfirmModal(false);
      return;
    }
    setDeleteConfirmModal(false);
    router.back();
  }

  function openRoleModal() {
    setPendingRole((detail?.role as UserRole) ?? null);
    setRoleModal(true);
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!detail) {
    return (
      <View style={styles.center}>
        <Ionicons name="person-outline" size={40} color={colors.textMuted} />
        <Text style={styles.emptyTitle}>User not found</Text>
      </View>
    );
  }

  const req = ROLE_CEU_REQUIREMENTS[detail.role as keyof typeof ROLE_CEU_REQUIREMENTS];
  const passedCompletions = detail.completions.filter((c) => c.passed);
  const earnedCeus = passedCompletions.reduce((sum, c) => sum + c.ceuValue, 0);
  const requiredCeus = req?.total ?? 0;
  const ceuPercent = requiredCeus > 0 ? Math.min(100, (earnedCeus / requiredCeus) * 100) : 0;

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header card */}
        <Card variant="elevated" style={styles.headerCard}>
          <View style={styles.headerRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{detail.displayName[0]?.toUpperCase() ?? '?'}</Text>
            </View>
            <View style={styles.headerCopy}>
              <Text style={styles.displayName}>{detail.displayName}</Text>
              <View style={styles.badgeRow}>
                <Badge label={detail.role} variant="primary" />
                {detail.currentStreak > 0 && (
                  <Badge label={`🔥 ${detail.currentStreak}-day streak`} variant="accent" />
                )}
                {adminChecked && isAdmin && (
                  <Badge label="Admin" variant="error" />
                )}
                <Pressable
                  onPress={openRoleModal}
                  style={styles.editRoleBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Change user role"
                  accessibilityHint="Opens a dialog to reassign this learner's role"
                >
                  <Ionicons name="pencil-outline" size={14} color={colors.primary} />
                  <Text style={styles.editRoleText}>Change role</Text>
                </Pressable>
              </View>
            </View>
          </View>

          <View style={styles.metaGrid}>
            <MetaTile
              label="Renewal"
              value={detail.renewalDate ? formatRenewalDate(detail.renewalDate) : 'Not set'}
              icon="calendar-outline"
              colors={colors}
              textScale={textScale}
            />
            <MetaTile
              label="Completions"
              value={String(passedCompletions.length)}
              icon="checkmark-circle-outline"
              colors={colors}
              textScale={textScale}
            />
            <MetaTile
              label="Best streak"
              value={`${detail.longestStreak} days`}
              icon="flame-outline"
              colors={colors}
              textScale={textScale}
            />
          </View>
        </Card>

        {/* Admin actions */}
        <Card variant="elevated" style={styles.actionsCard}>
          <Text style={styles.actionsTitle}>Account actions</Text>
          <View style={styles.actionRow}>
            <Pressable
              onPress={handleSendReset}
              disabled={resetSending}
              style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.7 }]}
              accessibilityRole="button"
              accessibilityLabel="Send password reset email"
              accessibilityHint="Sends a password reset link to this user's email address"
            >
              <View style={[styles.actionIcon, { backgroundColor: withAlpha(colors.primary, '14') }]}>
                <Ionicons name="key-outline" size={18} color={colors.primary} />
              </View>
              <Text style={styles.actionLabel}>{resetSending ? 'Sending…' : 'Reset password'}</Text>
            </Pressable>

            {adminChecked && (
              <Pressable
                onPress={handleToggleAdmin}
                disabled={adminToggling}
                style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.7 }]}
                accessibilityRole="button"
                accessibilityLabel={isAdmin ? 'Revoke admin access' : 'Grant admin access'}
                accessibilityHint={isAdmin ? 'Removes admin portal access from this user' : 'Gives this user admin portal access'}
              >
                <View style={[styles.actionIcon, { backgroundColor: withAlpha(colors.accent, '14') }]}>
                  <Ionicons name={isAdmin ? 'shield-outline' : 'shield-checkmark-outline'} size={18} color={colors.accent} />
                </View>
                <Text style={styles.actionLabel}>
                  {adminToggling ? 'Updating…' : isAdmin ? 'Revoke admin' : 'Grant admin'}
                </Text>
              </Pressable>
            )}

            <Pressable
              onPress={() => setDeleteConfirmModal(true)}
              style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.7 }]}
              accessibilityRole="button"
              accessibilityLabel="Delete learner account"
              accessibilityHint="Permanently deletes this user and all their data"
            >
              <View style={[styles.actionIcon, { backgroundColor: withAlpha(colors.error, '14') }]}>
                <Ionicons name="trash-outline" size={18} color={colors.error} />
              </View>
              <Text style={[styles.actionLabel, { color: colors.error }]}>Delete account</Text>
            </Pressable>
          </View>
        </Card>

        {/* CEU progress (professional roles only) */}
        {req && (
          <Card variant="elevated" style={styles.ceuCard}>
            <View style={styles.ceuHeader}>
              <Text style={styles.ceuTitle}>CEU Progress</Text>
              <Text style={styles.ceuCount}>{earnedCeus.toFixed(1)} / {requiredCeus}</Text>
            </View>
            <ProgressBar value={earnedCeus} max={requiredCeus} color={colors.primary} />
            <Text style={styles.ceuSub}>
              {Math.round(ceuPercent)}% complete · {req.cycleYears}-year renewal cycle
            </Text>
          </Card>
        )}

        {/* Completion history */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Activity history</Text>
          <Text style={styles.sectionCount}>{detail.completions.length}</Text>
        </View>

        {detail.completions.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>No quiz attempts yet.</Text>
          </Card>
        ) : (
          detail.completions.map((c) => (
            <CompletionRow key={c.id} item={c} colors={colors} styles={styles} />
          ))
        )}
      </ScrollView>

      {/* Role change modal */}
      <Modal
        visible={roleModal}
        transparent
        animationType="fade"
        onRequestClose={() => setRoleModal(false)}
        accessibilityViewIsModal
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setRoleModal(false)}
          accessibilityLabel="Close dialog"
        >
          <Pressable style={styles.modalCard} onPress={() => { /* stops propagation */ }}>
            <Text style={styles.modalTitle}>Change role</Text>
            <Text style={styles.modalSub}>{detail.displayName}</Text>

            <View style={styles.roleList}>
              {ROLES.map((r) => {
                const selected = (pendingRole ?? detail.role) === r;
                return (
                  <Pressable
                    key={r}
                    onPress={() => setPendingRole(r)}
                    style={[styles.roleRow, selected && styles.roleRowSelected]}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selected }}
                    accessibilityLabel={ROLE_LABELS[r]}
                  >
                    <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
                      {selected && <View style={styles.radioInner} />}
                    </View>
                    <View style={styles.roleCopy}>
                      <Text style={[styles.roleLabel, selected && styles.roleLabelSelected]}>{r}</Text>
                      <Text style={styles.roleDesc}>{ROLE_LABELS[r]}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>

            <Button
              title={roleSaving ? 'Saving…' : 'Save role'}
              onPress={handleSaveRole}
              disabled={roleSaving || pendingRole === detail.role}
              style={styles.saveBtn}
              accessibilityLabel="Save role change"
            />
            <Pressable
              onPress={() => setRoleModal(false)}
              style={styles.cancelBtn}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Delete confirmation modal */}
      <Modal
        visible={deleteConfirmModal}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteConfirmModal(false)}
        accessibilityViewIsModal
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setDeleteConfirmModal(false)}
          accessibilityLabel="Close dialog"
        >
          <Pressable style={styles.modalCard} onPress={() => { /* stops propagation */ }}>
            <View style={styles.deleteIconWrap}>
              <Ionicons name="warning-outline" size={28} color={colors.error} />
            </View>
            <Text style={styles.modalTitle}>Delete account?</Text>
            <Text style={styles.deleteWarning}>
              This will permanently delete{' '}
              <Text style={{ fontFamily: Typography.bodyBold }}>{detail.displayName}</Text>'s account,
              all completions, quiz history, and certificates. This cannot be undone.
            </Text>

            <Button
              title={deleting ? 'Deleting…' : 'Yes, delete account'}
              onPress={handleDeleteUser}
              disabled={deleting}
              style={styles.deleteBtn}
              accessibilityLabel="Confirm delete account"
            />
            <Pressable
              onPress={() => setDeleteConfirmModal(false)}
              style={styles.cancelBtn}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

function MetaTile({
  label, value, icon, colors, textScale,
}: {
  label: string; value: string; icon: keyof typeof Ionicons.glyphMap;
  colors: ReturnType<typeof usePreferences>['colors']; textScale: number;
}) {
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 4 }}>
      <Ionicons name={icon} size={16} color={colors.textSecondary} />
      <Text style={{ fontSize: 13 * textScale, fontFamily: Typography.bodyBold, color: colors.text, textAlign: 'center' }}>
        {value}
      </Text>
      <Text style={{ fontSize: 10 * textScale, fontFamily: Typography.body, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.3 }}>
        {label}
      </Text>
    </View>
  );
}

function CompletionRow({
  item, colors, styles,
}: {
  item: AdminUserCompletion;
  colors: ReturnType<typeof usePreferences>['colors'];
  styles: ReturnType<typeof createStyles>;
}) {
  const date = new Date(item.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return (
    <View style={styles.compRow}>
      <View style={[styles.compDot, { backgroundColor: item.passed ? colors.success : colors.error }]} />
      <View style={styles.compCopy}>
        <Text style={styles.compTitle} numberOfLines={1}>{item.courseTitle}</Text>
        <Text style={styles.compDate}>{date}</Text>
      </View>
      <View style={styles.compRight}>
        <Text style={[styles.compScore, { color: item.passed ? colors.success : colors.error }]}>
          {item.score}%
        </Text>
        {item.passed && item.ceuValue > 0 && (
          <Text style={styles.compCeu}>{item.ceuValue} CEU</Text>
        )}
      </View>
    </View>
  );
}

const createStyles = (
  colors: ReturnType<typeof usePreferences>['colors'],
  textScale: number,
) =>
  StyleSheet.create({
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: colors.background },
    emptyTitle: { fontSize: 16 * textScale, fontFamily: Typography.bodyBold, color: colors.textSecondary },
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 16, paddingBottom: 40, gap: 14 },
    headerCard: { gap: 16 },
    headerRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    avatar: {
      width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center',
      backgroundColor: withAlpha(colors.primary, '16'), flexShrink: 0,
    },
    avatarText: { fontSize: 22 * textScale, fontFamily: Typography.bodyBold, color: colors.primary },
    headerCopy: { flex: 1, gap: 6 },
    displayName: { fontSize: 20 * textScale, fontFamily: Typography.headingSemiBold, color: colors.text },
    badgeRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', alignItems: 'center' },
    editRoleBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
      backgroundColor: withAlpha(colors.primary, '12'),
    },
    editRoleText: { fontSize: 12 * textScale, fontFamily: Typography.bodySemiBold, color: colors.primary },
    metaGrid: {
      flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.border,
      paddingTop: 14, gap: 8,
    },
    // Admin actions card
    actionsCard: { gap: 12 },
    actionsTitle: { fontSize: 15 * textScale, fontFamily: Typography.bodyBold, color: colors.text },
    actionRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
    actionBtn: {
      flex: 1, minWidth: 90, alignItems: 'center', gap: 8,
      paddingVertical: 12, borderRadius: 14, borderWidth: 1, borderColor: colors.border,
    },
    actionIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    actionLabel: { fontSize: 12 * textScale, fontFamily: Typography.bodySemiBold, color: colors.text, textAlign: 'center' },
    // CEU card
    ceuCard: { gap: 10 },
    ceuHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    ceuTitle: { fontSize: 15 * textScale, fontFamily: Typography.bodyBold, color: colors.text },
    ceuCount: { fontSize: 14 * textScale, fontFamily: Typography.bodyBold, color: colors.primary },
    ceuSub: { fontSize: 12 * textScale, fontFamily: Typography.body, color: colors.textSecondary },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    sectionTitle: { fontSize: 17 * textScale, fontFamily: Typography.headingSemiBold, color: colors.text },
    sectionCount: { fontSize: 13 * textScale, fontFamily: Typography.bodyBold, color: colors.primary },
    emptyCard: { paddingVertical: 20, alignItems: 'center' },
    emptyText: { fontSize: 13 * textScale, fontFamily: Typography.body, color: colors.textSecondary },
    compRow: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    compDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
    compCopy: { flex: 1 },
    compTitle: { fontSize: 14 * textScale, fontFamily: Typography.bodyBold, color: colors.text, marginBottom: 2 },
    compDate: { fontSize: 11 * textScale, fontFamily: Typography.body, color: colors.textSecondary },
    compRight: { alignItems: 'flex-end' },
    compScore: { fontSize: 15 * textScale, fontFamily: Typography.bodyBold },
    compCeu: { fontSize: 11 * textScale, fontFamily: Typography.body, color: colors.textSecondary },
    // Modals
    modalOverlay: {
      flex: 1, backgroundColor: withAlpha(colors.shadow, '8C'),
      alignItems: 'center', justifyContent: 'center', padding: 24,
    },
    modalCard: {
      width: '100%', maxWidth: 400, borderRadius: 24,
      backgroundColor: colors.card, padding: 24, gap: 4,
    },
    modalTitle: { fontSize: 20 * textScale, fontFamily: Typography.headingSemiBold, color: colors.text, marginBottom: 2 },
    modalSub: { fontSize: 14 * textScale, fontFamily: Typography.body, color: colors.textSecondary, marginBottom: 16 },
    roleList: { gap: 8, marginBottom: 20 },
    roleRow: {
      flexDirection: 'row', alignItems: 'center', gap: 14,
      padding: 14, borderRadius: 14, borderWidth: 1.5, borderColor: colors.border,
    },
    roleRowSelected: { borderColor: colors.primary, backgroundColor: withAlpha(colors.primary, '0A') },
    radioOuter: {
      width: 20, height: 20, borderRadius: 10, borderWidth: 2,
      borderColor: colors.border, alignItems: 'center', justifyContent: 'center',
    },
    radioOuterSelected: { borderColor: colors.primary },
    radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
    roleCopy: { flex: 1 },
    roleLabel: { fontSize: 14 * textScale, fontFamily: Typography.bodyBold, color: colors.textSecondary },
    roleLabelSelected: { color: colors.text },
    roleDesc: { fontSize: 12 * textScale, fontFamily: Typography.body, color: colors.textSecondary, marginTop: 1 },
    saveBtn: { marginTop: 4 },
    cancelBtn: { alignItems: 'center', paddingVertical: 14 },
    cancelText: { fontSize: 15 * textScale, fontFamily: Typography.bodySemiBold, color: colors.textSecondary },
    // Delete modal
    deleteIconWrap: {
      width: 56, height: 56, borderRadius: 28,
      backgroundColor: withAlpha(colors.error, '14'),
      alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 8,
    },
    deleteWarning: {
      fontSize: 14 * textScale, fontFamily: Typography.body,
      color: colors.textSecondary, lineHeight: 22, marginBottom: 20, marginTop: 6,
    },
    deleteBtn: { marginTop: 4, backgroundColor: colors.error },
  });
