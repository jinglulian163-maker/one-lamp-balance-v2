import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Image, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { colors } from '../components/ui';
import { useFinanceStore } from '../store/useFinanceStore';

const lamp = require('../assets/lamp-cutout-hd.png');

/** A short branded welcome before routing to the user's next screen. */
export default function IndexRoute() {
  const router = useRouter();
  const onboardingComplete = useFinanceStore((state) => state.onboardingComplete);
  const opacity = useRef(new Animated.Value(0)).current;
  const lift = useRef(new Animated.Value(22)).current;
  const lampScale = useRef(new Animated.Value(0.82)).current;
  const pulse = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const pulseAnimation = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 0.85, duration: 860, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0.45, duration: 860, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ]));

    pulseAnimation.start();
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 430, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(lift, { toValue: 0, duration: 580, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.spring(lampScale, { toValue: 1, friction: 7, tension: 70, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      pulseAnimation.stop();
      router.replace(onboardingComplete ? '/(tabs)' : '/onboarding');
    }, 1800);

    return () => { clearTimeout(timer); pulseAnimation.stop(); };
  }, [lampScale, lift, onboardingComplete, opacity, pulse, router]);

  return <SafeAreaView style={s.safe}>
    <Animated.View style={[s.light, { opacity: pulse, transform: [{ scale: pulse.interpolate({ inputRange: [0.45, 0.85], outputRange: [0.92, 1.08] }) }] }]} />
    <Animated.View style={[s.content, { opacity, transform: [{ translateY: lift }] }]}>
      <View style={s.lampStage}><Animated.View style={{ transform: [{ scale: lampScale }] }}><Image source={lamp} style={s.lamp} resizeMode="contain" /></Animated.View></View>
      <Text style={s.name}>一盏余额</Text>
      <Text style={s.copy}>用一盏灯，看见还剩多少。</Text>
      <View style={s.dots}><View style={[s.dot, s.dotOn]} /><View style={s.dot} /><View style={s.dot} /><View style={s.dot} /></View>
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
  dots: { flexDirection: 'row', gap: 8, marginTop: 33 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#D7D2C7' },
  dotOn: { width: 23, backgroundColor: colors.yellow },
});
