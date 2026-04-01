import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router, usePathname } from 'expo-router';
import Svg, { Path, Rect } from 'react-native-svg';
import { C } from '../constants/colors';

// ─────────────────────────────────────────
// NAV ICONS
// ─────────────────────────────────────────
const NavHome = ({ active = false }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
      stroke={active ? C.blue : C.subtle} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const NavDoc = ({ active = false }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      stroke={active ? C.blue : C.subtle} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
const NavMonitor = ({ active = false }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Rect x={2} y={3} width={20} height={14} rx={2} stroke={active ? C.blue : C.subtle} strokeWidth={2} />
    <Path d="M8 21h8M12 17v4" stroke={active ? C.blue : C.subtle} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);
const NavUser = ({ active = false }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      stroke={active ? C.blue : C.subtle} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// ─────────────────────────────────────────
// TAB CONFIG
// ─────────────────────────────────────────
type TabId = 'home' | 'proposals' | 'services' | 'profile';

const TABS: { id: TabId; label: string; route: string; Icon: React.FC<{ active: boolean }> }[] = [
  { id: 'home',      label: 'Início',    route: '/home',      Icon: NavHome },
  { id: 'proposals', label: 'Propostas', route: '/proposals', Icon: NavDoc },
  { id: 'services',  label: 'Serviços',  route: '/services',  Icon: NavMonitor },
  { id: 'profile',   label: 'Perfil',    route: '/profile',   Icon: NavUser },
];

// ─────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────
interface BottomNavProps {
  active: TabId;
}

export default function BottomNav({ active }: BottomNavProps) {
  return (
    <View style={s.bar}>
      {TABS.map(tab => {
        const isActive = tab.id === active;
        return (
          <TouchableOpacity
            key={tab.id}
            style={s.tab}
            activeOpacity={0.7}
            onPress={() => {
              if (!isActive) router.push(tab.route as any);
            }}
          >
            <tab.Icon active={isActive} />
            <Text style={[s.label, isActive && s.labelActive]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: C.borderDark,
    backgroundColor: C.white,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 4 },
  label: { fontSize: 11, color: C.subtle, marginTop: 6, fontWeight: '500' },
  labelActive: { color: C.blue, fontWeight: '700' },
});
