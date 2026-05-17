import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuthStore } from '@/store/authStore';
import { AuthStack } from './AuthStack';
import { AppDrawer } from './AppDrawer';
import { Colors } from '@/constants/colors';

export function RootNavigator() {
  const { token, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.brand} />
      </View>
    );
  }

  return token ? <AppDrawer /> : <AuthStack />;
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center' },
});
