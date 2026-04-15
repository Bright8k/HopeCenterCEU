import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Colors } from '@/constants/Colors';
import { ROLE_LABELS, ROLE_CEU_REQUIREMENTS, type UserRole } from '@/constants/roles';

const ROLES: UserRole[] = ['RBT', 'BCBA', 'STUDENT'];

export default function Onboarding() {
  const { user } = useAuth();
  const [selected, setSelected] = useState<UserRole | null>(null);
  const [saving, setSaving] = useState(false);

  const handleContinue = async () => {
    if (!selected || !user) return;

    setSaving(true);
    const { error } = await supabase.from('profiles').update({ role: selected }).eq('id', user.id);
    setSaving(false);

    if (error) {
      Alert.alert('Error', error.message);
      return;
    }

    router.replace('/(tabs)');
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <Text style={styles.logo}>Hope Center CEU</Text>
        <Text style={styles.title}>What's your role?</Text>
        <Text style={styles.subtitle}>
          Choose your learning track to get personalized CEU content.
        </Text>
      </View>

      {ROLES.map((role) => {
        const isSelected = selected === role;
        const requirement = ROLE_CEU_REQUIREMENTS[role];

        return (
          <TouchableOpacity
            key={role}
            style={[styles.card, isSelected && styles.cardSelected]}
            onPress={() => setSelected(role)}
            activeOpacity={0.8}
          >
            <View style={styles.cardTop}>
              <View>
                <Text style={[styles.roleCode, isSelected && styles.roleCodeSelected]}>
                  {role}
                </Text>
                <Text style={[styles.roleLabel, isSelected && styles.roleLabelSelected]}>
                  {ROLE_LABELS[role]}
                </Text>
              </View>
              {isSelected ? (
                <View style={styles.checkBadge}>
                  <Text style={styles.checkText}>OK</Text>
                </View>
              ) : null}
            </View>
            <Text style={[styles.roleDesc, isSelected && styles.roleDescSelected]}>
              {requirement.description}
            </Text>
          </TouchableOpacity>
        );
      })}

      <TouchableOpacity
        style={[styles.button, (!selected || saving) && styles.buttonDisabled]}
        onPress={handleContinue}
        disabled={!selected || saving}
        activeOpacity={0.8}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Get Started</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 60,
    backgroundColor: Colors.background,
  },
  header: {
    marginBottom: 32,
  },
  logo: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 24,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  card: {
    borderRadius: 14,
    padding: 18,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  cardSelected: {
    borderColor: Colors.primary,
    backgroundColor: `${Colors.primary}0D`,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  roleCode: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  roleCodeSelected: {
    color: Colors.primary,
  },
  roleLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
  },
  roleLabelSelected: {
    color: Colors.primary,
  },
  roleDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  roleDescSelected: {
    color: Colors.primaryDark,
  },
  checkBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: 0.5,
  },
  button: {
    marginTop: 12,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
});
