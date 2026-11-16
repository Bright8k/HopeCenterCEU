import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { usePreferences } from '@/context/PreferencesContext';
import type { AceSettings, AceSettingsUpdate } from '@/hooks/useAceSettings';
import { Typography } from '@/constants/theme';

interface AceSettingsFormProps {
  settings: AceSettings;
  onSave: (update: AceSettingsUpdate) => Promise<string | null>;
  onDone: () => void;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function AceSettingsForm({ settings, onSave, onDone }: AceSettingsFormProps) {
  const { colors, textScale } = usePreferences();
  const styles = createStyles(colors, textScale);
  const [providerName, setProviderName] = useState(settings.provider_name);
  const [providerNumber, setProviderNumber] = useState(settings.provider_number ?? '');
  const [coordinatorName, setCoordinatorName] = useState(settings.coordinator_name ?? '');
  const [coordinatorEmail, setCoordinatorEmail] = useState(settings.coordinator_email ?? '');
  const [expires, setExpires] = useState(settings.approval_expires_on ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const errs: Record<string, string> = {};
    if (!providerName.trim()) errs.providerName = 'Provider name is required';
    if (coordinatorEmail.trim() && !EMAIL_RE.test(coordinatorEmail.trim())) errs.email = 'Enter a valid email';
    if (expires.trim() && (!DATE_RE.test(expires.trim()) || isNaN(Date.parse(expires.trim())))) errs.expires = 'Use YYYY-MM-DD';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSaving(true);
    const err = await onSave({
      provider_name: providerName.trim(),
      provider_number: providerNumber.trim() || null,
      coordinator_name: coordinatorName.trim() || null,
      coordinator_email: coordinatorEmail.trim() || null,
      approval_expires_on: expires.trim() || null,
    });
    setSaving(false);
    setSaveError(err);
    if (!err) onDone();
  }

  return (
    <View style={styles.form}>
      <Input label="Provider name *" value={providerName} onChangeText={setProviderName} error={errors.providerName} />
      <Input label="ACE provider number" value={providerNumber} onChangeText={setProviderNumber} autoCapitalize="characters" autoCorrect={false} hint="From your BACB ACE approval." />
      <Input label="ACE Coordinator name" value={coordinatorName} onChangeText={setCoordinatorName} autoCapitalize="words" />
      <Input label="ACE Coordinator email" value={coordinatorEmail} onChangeText={setCoordinatorEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} error={errors.email} hint="Shown to learners for questions and complaints." />
      <Input label="Approval expires on" value={expires} onChangeText={setExpires} placeholder="YYYY-MM-DD" autoCorrect={false} error={errors.expires} />
      {saveError ? <Text style={styles.error} accessibilityRole="alert">{saveError}</Text> : null}
      <View style={styles.actions}>
        <Button title="Cancel" variant="ghost" onPress={onDone} style={styles.action} />
        <Button title="Save details" onPress={handleSave} loading={saving} style={styles.action} />
      </View>
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof usePreferences>['colors'], textScale: number) =>
  StyleSheet.create({
    form: { marginTop: 12 },
    error: { fontSize: 13 * textScale, fontFamily: Typography.bodySemiBold, color: colors.error, marginBottom: 10 },
    actions: { flexDirection: 'row', gap: 10 },
    action: { flex: 1 },
  });
