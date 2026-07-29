import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, money } from '../../components/ui';
import { useFinanceStore } from '../../store/useFinanceStore';

const iconFor = (illustration: string): keyof typeof Ionicons.glyphMap => illustration === 'travel' ? 'airplane-outline' : illustration === 'laptop' ? 'laptop-outline' : illustration === 'concert' ? 'musical-notes-outline' : 'camera-outline';
const colorsFor = ['#7450E8', '#56D1D0', '#31325B', '#FFC52F'];

export default function Collection() {
  const router = useRouter();
  const collection = useFinanceStore((state) => state.collection);

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.page} showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <Pressable style={s.back} onPress={() => router.back()}><Ionicons name="arrow-back" size={22} color={colors.ink} /></Pressable>
          <Text style={s.kicker}>LIFE COLLECTION</Text>
        </View>
        <Text style={s.title}>我的图鉴</Text>
        <Text style={s.subtitle}>这些不是数字，是你认真为自己留下的生活。</Text>

        {collection.length ? <View style={s.grid}>{collection.map((item, index) => (
          <Pressable key={item.id} style={[s.card, { backgroundColor: colorsFor[index % colorsFor.length] }]} onPress={() => router.push(`/collection/${item.id}`)}>
            <View style={s.icon}><Ionicons name={iconFor(item.illustration)} size={37} color="#FFF" /></View>
            <Text numberOfLines={1} style={[s.cardTitle, index === 3 && { color: colors.ink }]}>{item.title}</Text>
            <Text style={[s.cardDate, index === 3 && { color: '#6E5716' }]}>{item.completedAt.slice(0, 10)}</Text>
            <View style={[s.chevron, index === 3 && { backgroundColor: 'rgba(0,0,0,.12)' }]}><Ionicons name="arrow-forward" size={15} color={index === 3 ? colors.ink : '#FFF'} /></View>
          </Pressable>
        ))}</View> : <View style={s.empty}><Text style={s.emptyEmoji}>✨</Text><Text style={s.emptyTitle}>图鉴正在等第一份成果</Text><Text style={s.emptyCopy}>完成一个存钱目标后，它会带着你的记录来到这里。</Text></View>}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg }, page: { padding: 20, paddingBottom: 38 },
  header: { height: 45, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { height: 44, width: 44, borderRadius: 16, borderWidth: 1.2, borderColor: colors.ink, backgroundColor: colors.paper, alignItems: 'center', justifyContent: 'center' },
  kicker: { color: colors.purple, fontSize: 12, fontWeight: '900', letterSpacing: .7 },
  title: { color: colors.ink, fontSize: 33, fontWeight: '900', marginTop: 18 }, subtitle: { color: colors.muted, fontSize: 15, lineHeight: 22, marginTop: 6 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 13, marginTop: 22 },
  card: { width: '47.8%', aspectRatio: .9, borderRadius: 23, borderWidth: 1.3, borderColor: colors.ink, padding: 14, justifyContent: 'flex-end', overflow: 'hidden' },
  icon: { flex: 1, alignItems: 'center', justifyContent: 'center' }, cardTitle: { color: '#FFF', fontSize: 16, fontWeight: '900' }, cardDate: { color: 'rgba(255,255,255,.82)', fontSize: 10, marginTop: 5 },
  chevron: { position: 'absolute', right: 11, top: 11, height: 28, width: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,.16)', alignItems: 'center', justifyContent: 'center' },
  empty: { marginTop: 36, backgroundColor: colors.paper, borderRadius: 25, borderWidth: 1.2, borderColor: colors.border, alignItems: 'center', paddingHorizontal: 30, paddingVertical: 48 }, emptyEmoji: { fontSize: 43 }, emptyTitle: { color: colors.ink, fontSize: 20, fontWeight: '900', marginTop: 12 }, emptyCopy: { color: colors.muted, textAlign: 'center', lineHeight: 20, marginTop: 8 },
});
