import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { usePreferences } from '@/context/PreferencesContext';
import { hasSupabaseEnv, supabase } from '@/lib/supabase';
import { SLIDES_BUCKET } from '@/hooks/useCourseSlides';
import { Typography } from '@/constants/theme';

interface SlidesUploadProps {
  slidesPath: string;
  onChange: (path: string) => void;
}

export function SlidesUpload({ slidesPath, onChange }: SlidesUploadProps) {
  const { colors, textScale } = usePreferences();
  const styles = createStyles(colors, textScale);
  const [uploading, setUploading] = useState(false);

  const pick = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
    if (result.canceled || !result.assets[0]) return;
    if (!hasSupabaseEnv) { Alert.alert('Preview mode', 'Supabase is not configured — upload is unavailable.'); return; }
    const asset = result.assets[0];
    setUploading(true);
    try {
      const bytes = await (await fetch(asset.uri)).arrayBuffer();
      const safeName = asset.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = `${Date.now()}/${safeName}`;
      const { error } = await supabase.storage
        .from(SLIDES_BUCKET)
        .upload(path, bytes, { contentType: 'application/pdf', upsert: true });
      if (error) throw error;
      onChange(path);
    } catch (e) {
      Alert.alert('Upload failed', e instanceof Error ? e.message : 'Try again.');
    } finally {
      setUploading(false);
    }
  };

  const fileName = slidesPath ? slidesPath.split('/').pop() : null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Follow-along slides (PDF)</Text>
      <Pressable
        onPress={pick}
        disabled={uploading}
        accessibilityRole="button"
        accessibilityLabel={fileName ? `Replace slides, currently ${fileName}` : 'Upload slides PDF'}
        style={({ pressed }) => [styles.picker, pressed && { opacity: 0.75 }]}
      >
        {uploading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <Ionicons name={fileName ? 'document-attach-outline' : 'cloud-upload-outline'} size={20} color={colors.primary} accessibilityElementsHidden />
        )}
        <Text style={styles.pickerText} numberOfLines={1}>
          {uploading ? 'Uploading…' : fileName ?? 'Upload PDF'}
        </Text>
      </Pressable>
      {fileName && !uploading ? (
        <Pressable onPress={() => onChange('')} accessibilityRole="button" accessibilityLabel="Remove slides from this course" style={styles.removeBtn}>
          <Text style={styles.removeText}>Remove slides</Text>
        </Pressable>
      ) : null}
      <Text style={styles.hint}>Export your PowerPoint as PDF. Learners open it from the lesson screen.</Text>
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof usePreferences>['colors'], textScale: number) =>
  StyleSheet.create({
    wrap: { marginBottom: 16 },
    label: { fontSize: 14, fontFamily: Typography.bodySemiBold, color: colors.text, marginBottom: 6 },
    picker: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 48, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.border, backgroundColor: colors.surface },
    pickerText: { flex: 1, fontSize: 14 * textScale, fontFamily: Typography.bodySemiBold, color: colors.textSecondary },
    removeBtn: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center' },
    removeText: { fontSize: 13 * textScale, fontFamily: Typography.bodySemiBold, color: colors.error },
    hint: { fontSize: 12 * textScale, fontFamily: Typography.body, color: colors.textSecondary, lineHeight: 17 },
  });
