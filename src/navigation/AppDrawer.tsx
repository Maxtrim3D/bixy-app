import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
} from 'react-native';
import { createDrawerNavigator, DrawerContentComponentProps } from '@react-navigation/drawer';
import { useAuthStore } from '@/store/authStore';
import { useConnectionStore } from '@/store/connectionStore';
import { hasPermission } from '@/utils/rbac';
import { Colors } from '@/constants/colors';
import type { Permission, Role } from '@/types';

// Screens
import { DashboardScreen }    from '@/screens/dashboard/DashboardScreen';
import { PreparationScreen }  from '@/screens/preparation/PreparationScreen';
import { MachinesScreen }     from '@/screens/machines/MachinesScreen';
import { AttendanceScreen }   from '@/screens/attendance/AttendanceScreen';
import { CommissionsScreen }  from '@/screens/commissions/CommissionsScreen';
import { TasksScreen }        from '@/screens/tasks/TasksScreen';
import { RestockScreen }      from '@/screens/restock/RestockScreen';
import { UsersScreen }        from '@/screens/users/UsersScreen';
import { SettingsScreen }     from '@/screens/settings/SettingsScreen';
import { OrdersScreen }       from '@/screens/orders/OrdersScreen';

interface NavItem {
  name: string;
  label: string;
  icon: string;
  component: React.ComponentType<object>;
  permission: Permission | null;
}

const NAV_ITEMS: NavItem[] = [
  { name: 'Dashboard',    label: 'Tableau de bord',  icon: '⊞', component: DashboardScreen,   permission: null },
  { name: 'Orders',       label: 'Commandes',         icon: '📦', component: OrdersScreen,      permission: 'orders:read' },
  { name: 'Preparation',  label: 'Préparation',       icon: '🏭', component: PreparationScreen, permission: 'orders:prepare' },
  { name: 'Machines',     label: 'Machines 3D',       icon: '🖨', component: MachinesScreen,    permission: 'machines:read' },
  { name: 'Attendance',   label: 'Pointeuse',         icon: '🕐', component: AttendanceScreen,  permission: 'attendance:read' },
  { name: 'Commissions',  label: 'Commissions',       icon: '💶', component: CommissionsScreen, permission: 'commissions:read' },
  { name: 'Tasks',        label: 'Tâches',            icon: '✅', component: TasksScreen,       permission: 'tasks:read' },
  { name: 'Restock',      label: 'Réassort',          icon: '🔄', component: RestockScreen,     permission: 'restock:read' },
  { name: 'Users',        label: 'Utilisateurs',      icon: '👥', component: UsersScreen,       permission: 'users:write' },
  { name: 'Settings',     label: 'Paramètres',        icon: '⚙', component: SettingsScreen,    permission: 'settings:read' },
];

// ── Custom drawer content ─────────────────────────────────────────────────────

function DrawerContent({ navigation, state }: DrawerContentComponentProps) {
  const { user, logout } = useAuthStore();
  const mode = useConnectionStore((s) => s.mode);
  const role = (user?.role ?? 'viewer') as Role;

  const visibleItems = NAV_ITEMS.filter(
    (item) => item.permission === null || hasPermission(role, item.permission),
  );

  const currentIndex = state.index;

  const modeColor = mode === 'local' ? Colors.success
    : mode === 'vpn' ? Colors.brand
    : mode === 'offline' ? Colors.error
    : Colors.warning;

  const modeLabel = mode === 'local' ? 'LAN'
    : mode === 'vpn' ? 'VPN'
    : mode === 'offline' ? 'Hors ligne'
    : '…';

  return (
    <View style={styles.drawer}>
      {/* Header */}
      <View style={styles.drawerHeader}>
        <Text style={styles.appName}>Bixy</Text>
        <View style={styles.modeBadge}>
          <View style={[styles.modeDot, { backgroundColor: modeColor }]} />
          <Text style={[styles.modeText, { color: modeColor }]}>{modeLabel}</Text>
        </View>
      </View>

      {/* User info */}
      <View style={styles.userCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarLetter}>
            {(user?.app_name ?? user?.full_name ?? '?').charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user?.app_name ?? user?.full_name}</Text>
          <Text style={styles.userRole}>{user?.role}</Text>
        </View>
      </View>

      {/* Nav items */}
      <ScrollView style={styles.nav} showsVerticalScrollIndicator={false}>
        {visibleItems.map((item, idx) => {
          const isActive = state.routes[currentIndex]?.name === item.name;
          return (
            <TouchableOpacity
              key={item.name}
              style={[styles.navItem, isActive && styles.navItemActive]}
              onPress={() => navigation.navigate(item.name)}
              activeOpacity={0.7}
            >
              <Text style={styles.navIcon}>{item.icon}</Text>
              <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.8}>
        <Text style={styles.logoutText}>⎋  Déconnexion</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Drawer navigator ──────────────────────────────────────────────────────────

const Drawer = createDrawerNavigator();

export function AppDrawer() {
  const { user } = useAuthStore();
  const role = (user?.role ?? 'viewer') as Role;

  const visibleItems = NAV_ITEMS.filter(
    (item) => item.permission === null || hasPermission(role, item.permission),
  );

  return (
    <Drawer.Navigator
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={{
        headerStyle:      { backgroundColor: Colors.surface },
        headerTintColor:  Colors.textPrimary,
        headerTitleStyle: { fontWeight: '700' },
        drawerStyle:      { backgroundColor: Colors.surface, width: 260 },
      }}
    >
      {visibleItems.map((item) => (
        <Drawer.Screen
          key={item.name}
          name={item.name}
          component={item.component}
          options={{ title: item.label }}
        />
      ))}
    </Drawer.Navigator>
  );
}

const styles = StyleSheet.create({
  drawer:          { flex: 1, backgroundColor: Colors.surface },
  drawerHeader:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  appName:         { fontSize: 22, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.5 },
  modeBadge:       { flexDirection: 'row', alignItems: 'center', gap: 4 },
  modeDot:         { width: 7, height: 7, borderRadius: 4 },
  modeText:        { fontSize: 11, fontWeight: '600' },
  userCard:        { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.border },
  avatar:          { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.brand, alignItems: 'center', justifyContent: 'center' },
  avatarLetter:    { color: '#fff', fontWeight: '700', fontSize: 15 },
  userInfo:        { flex: 1 },
  userName:        { color: Colors.textPrimary, fontWeight: '600', fontSize: 14 },
  userRole:        { color: Colors.textSecondary, fontSize: 12, marginTop: 1 },
  nav:             { flex: 1, paddingTop: 8, paddingHorizontal: 8 },
  navItem:         { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, marginBottom: 2 },
  navItemActive:   { backgroundColor: Colors.brand + '22' },
  navIcon:         { fontSize: 16, width: 22, textAlign: 'center' },
  navLabel:        { color: Colors.textSecondary, fontSize: 14, fontWeight: '500' },
  navLabelActive:  { color: Colors.brand, fontWeight: '700' },
  logoutBtn:       { margin: 16, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  logoutText:      { color: Colors.textSecondary, fontWeight: '500', fontSize: 14 },
});
