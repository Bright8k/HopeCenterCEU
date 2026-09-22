import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { LightColors } from '@/constants/theme';

interface Props { children: React.ReactNode; }
interface State { hasError: boolean; error: Error | null; }

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Replace with a crash-reporting SDK (Sentry, etc.) when integrated
    console.error('[ErrorBoundary]', error.message, info.componentStack);
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
    router.replace('/');
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={s.wrap}>
          <Text style={s.title}>Something went wrong</Text>
          <Text style={s.body}>
            The app hit an unexpected error. Tap below to restart, or contact support if it keeps happening.
          </Text>
          <Pressable onPress={this.reset} style={s.btn} accessibilityRole="button" accessibilityLabel="Restart the app">
            <Text style={s.btnText}>Restart</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}

const s = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16, backgroundColor: LightColors.background },
  title: { fontSize: 20, fontWeight: '700', color: LightColors.text, textAlign: 'center' },
  body: { fontSize: 14, color: LightColors.textSecondary, textAlign: 'center', lineHeight: 21, maxWidth: 320 },
  btn: { marginTop: 8, paddingVertical: 12, paddingHorizontal: 32, borderRadius: 12, backgroundColor: LightColors.primary, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  btnText: { fontSize: 15, fontWeight: '600', color: '#fff' },
});
