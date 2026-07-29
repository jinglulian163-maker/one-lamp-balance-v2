import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, money } from '../../components/ui';
import { useFinanceStore } from '../../store/useFinanceStore';

const iconFor = (illustration: string): keyof typeof Ionicons.glyphMap => illustration === 'travel' ? 'airplane-outline' : illustration === 'laptop' ? 'laptop-outline' : illustration === 'concert' ? 'musical-notes-outline' : 'camera-outline';

export default function CollectionDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const item = useFinanceStore((state) => state.collection.find((entry) => entry.id === id));

  if (!item) return <SafeAreaView style={s.safe}><View style={s.missing}><Text style={s.missingTitle}>这张图鉴暂时找不到了</Text><Pressable style={s.backToList} onPress={() => router.replace('/collection')}><Text style={s.backText}>回到我的图鉴</Text></Pressable></View></SafeAreaView>;

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.page} showsVerticalScrollIndicator={false}>
        <Pressable style={s.back} onPress={() => router.back()}><Ionicons name="arrow-back" size={22} color={colors.ink} /></Pressable>
        <View style={s.hero}><View style={s.heroIcon}><Ionicons name={iconFor(item.illustration)} size={80} color="#FFF" /></View><Text style={s.heroKicker}>已完成 · LIFE ARCHIVE</Text><Text style={s.heroTitle}>{item.title}</Text></View>
        <View style={s.metrics}><Metric label="完成日期" value={item.completedAt.slice(0, 10)} /><Metric label="最终金额" value={money(item.amount)} /></View>
        <View style={s.story}><Text style={s.storyTitle}>这一份成果</Text><Text style={s.storyCopy}>{item.note?.trim() || '你把很多普通日子里留下的一点，慢慢变成了现在的生活。'}</Text></View>
        <View style={s.note}><Text style={s.noteLamp}>💡</Text><Text style={s.noteText}>钱最后不是消失了，它变成了你可以看见、使用和记住的生活。</Text></View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Metric({ label, value }: { label: string; value: string }) { return <View style={s.metric}><Text style={s.metricLabel}>{label}</Text><Text style={s.metricValue}>{value}</Text></View>; }

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg }, page: { padding: 20, paddingBottom: 42, gap: 16 },
  back: { height: 44, width: 44, borderRadius: 16, borderWidth: 1.2, borderColor: colors.ink, backgroundColor: colors.paper, alignItems: 'center', justifyContent: 'center' },
  hero: { height: 310, marginTop: 4, borderRadius: 30, borderWidth: 1.3, borderColor: colors.ink, backgroundColor: colors.purple, alignItems: 'center', justifyContent: 'center', padding: 20 }, heroIcon: { height: 120, width: 120, borderRadius: 47, borderWidth: 1.2, borderColor: colors.ink, backgroundColor: 'rgba(255,255,255,.13)', alignItems: 'center', justifyContent: 'center' }, heroKicker: { color: '#EAE4FF', fontSize: 11, fontWeight: '900', letterSpacing: .6, marginTop: 20 }, heroTitle: { color: '#FFF', fontSize: 30, fontWeight: '900', marginTop: 7 },
  metrics: { backgroundColor: colors.paper, borderRadius: 22, borderWidth: 1.2, borderColor: colors.border, paddingVertical: 16, flexDirection: 'row' }, metric: { flex: 1, alignItems: 'center' }, metricLabel: { color: colors.muted, fontSize: 11, fontWeight: '700' }, metricValue: { color: colors.ink, fontSize: 16, fontWeight: '900', marginTop: 7 },
  story: { backgroundColor: colors.paper, borderRadius: 22, borderWidth: 1.2, borderColor: colors.border, padding: 18 }, storyTitle: { color: colors.ink, fontSize: 20, fontWeight: '900' }, storyCopy: { color: colors.muted, fontSize: 15, lineHeight: 24, marginTop: 10 },
  note: { flexDirection: 'row', gap: 12, alignItems: 'center', paddingHorizontal: 6, marginTop: 5 }, noteLamp: { fontSize: 35 }, noteText: { flex: 1, color: colors.ink, fontSize: 16, lineHeight: 23, fontWeight: '800' },
  missing: { flex: 1, padding: 30, justifyContent: 'center', alignItems: 'center' }, missingTitle: { color: colors.ink, fontSize: 20, fontWeight: '900' }, backToList: { marginTop: 18, height: 48, paddingHorizontal: 18, borderRadius: 16, backgroundColor: colors.yellow, borderWidth: 1.2, borderColor: colors.ink, justifyContent: 'center' }, backText: { color: colors.ink, fontWeight: '900' },
});
