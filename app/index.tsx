import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Image, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { colors } from '../components/ui';
import { useFinanceStore } from '../store/useFinanceStore';

// The launch screen gets a smaller image than the in-app illustration so it can
// render immediately on web and lower-spec phones.
const lamp = require('../assets/lamp-startup.png');

/** A short branded welcome before routing to the user's next screen. */
export default function IndexRoute() {
  const router = useRouter();
  const onboardingComplete = useFinanceStore((state) => state.onboardingComplete);
  const opacity = useRef(new Animated.Value(0)).current;
  const lift = useRef(new Animated.Value(12)).current;
  const lampScale = useRef(new Animated.Value(0.94)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(lift, { toValue: 0, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(lampScale, { toValue: 1, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      router.replace(onboardingComplete ? '/(tabs)' : '/onboarding');
    }, 1050);

    return () => { clearTimeout(timer); };
  }, [lampScale, lift, onboardingComplete, opacity, router]);

  return <SafeAreaView style={s.safe}>
    <View style={s.light} />
    <Animated.View style={[s.content, { opacity, transform: [{ translateY: lift }] }]}>
      <View style={s.lampStage}><Animated.View style={{ transform: [{ scale: lampScale }] }}><Image source={lamp} style={s.lamp} resizeMode="contain" /></Animated.View></View>
      <Text style={s.name}>一盏余额</Text>
      <Text style={s.copy}>用一盏灯，看见还剩多少。</Text>
    </Animated.View>
  </SafeAreaView>;
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  light: { position: 'absolute', width: 330, height: 330, borderRadius: 165, backgroundColor: '#E9DDFF' },
  content: { alignItems: 'center', paddingHorizontal: 28 },
  lampStage: { height: 255, width: 255, borderRadius: 62, backgroundColor: colors.purple, borderWidth: 1.3, borderColor: colors.ink, alignItems: 'center', justifyContent: 'center', shadowColor: '#4F34BA', shadowOpacity: 0.22, shadowRadius: 22, shadowOffset: { width: 0, height: 12 }, elevation: 7 },
  lamp: { width: 185, height: 220 },
  name: { marginTop: 28, color: colors.ink, fontSize: 31, fontWeight: '900', letterSpacing: -0.6 },
  copy: { marginTop: 9, color: colors.muted, fontSize: 15, fontWeight: '600' },
});
