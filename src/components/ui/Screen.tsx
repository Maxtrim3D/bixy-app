import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ConnectionBanner } from './ConnectionBanner';
import { Colors } from '@/constants/colors';

interface ScreenProps {
  children: React.ReactNode;
  scrollable?: boolean;
  padding?: boolean;
}

export function Screen({ children, scrollable = true, padding = true }: ScreenProps) {
  const insets = useSafeAreaInsets();
  const content = (
    <View style={[styles.inner, padding && styles.padded]}>
      {children}
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ConnectionBanner />
      {scrollable
        ? <ScrollView style={styles.flex} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">{content}</ScrollView>
        : <View style={styles.flex}>{content}</View>
      }
    </View>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: Colors.bg },
  flex:          { flex: 1 },
  inner:         { flex: 1 },
  padded:        { padding: 16 },
  scrollContent: { flexGrow: 1 },
});
