import { Ionicons } from '@expo/vector-icons';
import { useRouter, useSegments } from 'expo-router';
import { PropsWithChildren } from 'react';
import { Image, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

// Shared Figma tokens — applied across 首页、计划和我的 so the three screens stay cohesive.
export const colors = { bg: '#FAF7F4', paper: '#FFFEF8', ink: '#12121A', muted: '#6E6E7A', border: '#DEDEDD', purple: '#624ACF', yellow: '#FFC52F', pink: '#FB5267', coral: '#EF3D53', green: '#347347', cyan: '#56D1D0', navy: '#0A0B18', red: '#F03C53' } as const;

export const money = (value: number, digits = 0) => `¥${value.toLocaleString('zh-CN', { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;

export function Card({ children, style }: PropsWithChildren<{ style?: object }>) { return <View style={[styles.card, style]}>{children}</View>; }

export function Section({ title, action, onAction, children }: PropsWithChildren<{ title: string; action?: string; onAction?: () => void }>) { const router = useRouter(); const handler = onAction ?? (action === '查看全部' ? () => router.push('/transactions') : undefined); return <View style={{ gap: 9 }}><View style={styles.sectionHead}><Text style={styles.sectionTitle}>{title}</Text>{action ? <Pressable onPress={handler} disabled={!handler}><Text style={styles.action}>{action}</Text></Pressable> : null}</View>{children}</View>; }

export function BottomNav() {
  const router = useRouter(); const segments = useSegments(); const { width } = useWindowDimensions(); const segment = segments[segments.length - 1]; const isHome = segment === '(tabs)' || segment === 'index';
  const items = [{ id: 'index', icon: 'home-outline' as const, href: '/(tabs)' }, { id: 'plan', icon: 'grid-outline' as const, href: '/(tabs)/plan' }, { id: 'profile', icon: 'person-outline' as const, href: '/(tabs)/profile' }];
  return <View style={[styles.nav, { width: Math.min(Math.max(width - 40, 0), 440) }]}>{items.map((item) => { const current = item.id === segment || (item.id === 'index' && isHome); return <Pressable key={item.id} onPress={() => router.replace(item.href as never)} style={styles.navHit}><View style={[styles.navCircle, current && styles.navCurrent]}><Ionicons name={item.icon} size={25} color={current ? colors.ink : '#F2EFF6'} /></View></Pressable>; })}</View>;
}

export function Lamp({ level }: { level: 1 | 2 | 3 | 4 }) {
  const brightness = [0.58, 0.74, 0.9, 1][level - 1];
  const haloOpacity = [0.18, 0.3, 0.42, 0.56][level - 1];

  return <View style={styles.lampWrap}>
    <View style={[styles.haloFar, { opacity: haloOpacity }]} />
    <View style={[styles.haloNear, { opacity: haloOpacity }]} />
    <Image
      source={require('../assets/lamp-cutout-hd.png')}
      accessibilityLabel="余额亮度台灯"
      fadeDuration={0}
      style={[styles.lampImage, { opacity: brightness }]}
    />
    <View style={styles.levels}>{[4, 3, 2, 1].map(n => <View key={n} style={[styles.level, n === level && styles.levelOn]} />)}</View>
  </View>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.border, borderRadius: 20, padding: 16 }, sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, sectionTitle: { color: colors.ink, fontSize: 15, fontWeight: '900', letterSpacing: .4 }, action: { color: colors.ink, fontSize: 11, fontWeight: '700' },
  nav: { height: 62, borderRadius: 31, backgroundColor: colors.navy, position: 'absolute', bottom: 14, alignSelf: 'center', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' }, navHit: { width: 68, height: 58, alignItems: 'center', justifyContent: 'center' }, navCircle: { height: 50, width: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' }, navCurrent: { backgroundColor: '#FFFFFF' },
  lampWrap: { width: 210, height: 184, alignItems: 'center', justifyContent: 'flex-end', overflow: 'visible' }, haloFar: { position: 'absolute', bottom: 12, left: 16, width: 160, height: 54, borderRadius: 30, backgroundColor: '#C59A94' }, haloNear: { position: 'absolute', bottom: 25, left: 49, width: 98, height: 70, borderRadius: 38, backgroundColor: '#E1B176' }, lampImage: { width: 164, height: 174, resizeMode: 'contain', zIndex: 2, marginRight: 15 }, levels: { position: 'absolute', right: 2, top: 49, gap: 13, zIndex: 3 }, level: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#C9BFEA' }, levelOn: { backgroundColor: colors.yellow, transform: [{ scale: 1.2 }], borderWidth: 1, borderColor: colors.ink },
});
