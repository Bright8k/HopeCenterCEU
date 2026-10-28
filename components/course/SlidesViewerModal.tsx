import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { PdfViewer } from '@/components/course/PdfViewer';
import { usePreferences } from '@/context/PreferencesContext';
import { Typography } from '@/constants/theme';

interface SlidesViewerModalProps {
  url: string | null;
  onClose: () => void;
  onOpenExternal: () => void;
}

export function SlidesViewerModal({ url, onClose, onOpenExternal }: SlidesViewerModalProps) {
  const { colors, textScale } = usePreferences();
  const styles = createStyles(colors, textScale);
  const insets = useSafeAreaInsets();
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [pageCount, setPageCount] = useState(0);

  useEffect(() => {
    if (url) setStatus('loading');
  }, [url]);

  return (
    <Modal visible={!!url} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      {/* SafeAreaView measures while the slide-in modal is off-screen on iOS and gets a 0 top inset,
          leaving the header under the status bar where taps don't land; use the window insets instead. */}
      <View style={[styles.safeArea, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.header}>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close slides"
            hitSlop={8}
            style={styles.iconBtn}
          >
            <Ionicons name="close" size={22} color={colors.text} />
          </Pressable>
          <Text style={styles.title} accessibilityRole="header">
            Slides{pageCount > 0 ? ` · ${pageCount} pages` : ''}
          </Text>
          <Pressable
            onPress={onOpenExternal}
            accessibilityRole="button"
            accessibilityLabel="Open slides in another app"
            accessibilityHint="Opens the PDF outside the app to download or print"
            hitSlop={8}
            style={styles.iconBtn}
          >
            <Ionicons name="share-outline" size={20} color={colors.text} />
          </Pressable>
        </View>

        <View style={styles.body}>
          {url && status !== 'error' ? (
            <PdfViewer
              url={url}
              backgroundColor={colors.surface}
              onLoaded={(pages) => { setPageCount(pages); setStatus('ready'); }}
              onError={() => setStatus('error')}
            />
          ) : null}

          {status === 'loading' && (
            <View style={styles.overlay} accessibilityLabel="Loading slides">
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          )}

          {status === 'error' && (
            <View style={styles.overlay}>
              <Ionicons name="alert-circle-outline" size={44} color={colors.textMuted} accessibilityElementsHidden />
              <Text style={styles.errorText} accessibilityRole="alert">
                The slides couldn't be displayed here.
              </Text>
              <Button title="Open in another app" onPress={onOpenExternal} variant="outline" />
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: ReturnType<typeof usePreferences>['colors'], textScale: number) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.card },
    iconBtn: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
    title: { flex: 1, textAlign: 'center', fontSize: 16 * textScale, fontFamily: Typography.bodyBold, color: colors.text },
    body: { flex: 1, backgroundColor: colors.surface },
    overlay: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 32, backgroundColor: colors.surface },
    errorText: { fontSize: 15 * textScale, fontFamily: Typography.body, color: colors.textSecondary, textAlign: 'center' },
  });
