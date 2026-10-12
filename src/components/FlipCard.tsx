import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

/** タップで表裏がめくれるカード（Y軸回転アニメーション） */
export function FlipCard({ front, back, flipped, onToggle }: { front: string; back: string; flipped: boolean; onToggle: () => void }) {
  const anim = useRef(new Animated.Value(flipped ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: flipped ? 1 : 0,
      duration: 380,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [flipped, anim]);

  const rotFront = anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const rotBack = anim.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });
  const len = (flipped ? back : front).length;
  const fontSize = len > 80 ? 20 : len > 30 ? 26 : 34;

  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="button"
      accessibilityLabel={flipped ? `答え：${back}。タップで問題に戻る` : `問題：${front}。タップで答えを見る`}
      style={styles.wrap}
    >
      <Animated.View style={[styles.face, styles.front, { transform: [{ perspective: 1000 }, { rotateY: rotFront }] }]}>
        <Text style={styles.tag}>問題</Text>
        <Text style={[styles.text, { fontSize, lineHeight: Math.round(fontSize * 1.45) }]}>{front}</Text>
        <Text style={styles.hint}>タップして答えを見る</Text>
      </Animated.View>
      <Animated.View style={[styles.face, styles.back, { transform: [{ perspective: 1000 }, { rotateY: rotBack }] }]}>
        <Text style={[styles.tag, { color: colors.purple }]}>答え</Text>
        <Text style={[styles.text, { fontSize, lineHeight: Math.round(fontSize * 1.45) }]}>{back}</Text>
        <Text style={styles.hint}>タップで問題にもどる</Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', height: 320 },
  face: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 22,
    padding: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backfaceVisibility: 'hidden',
    borderWidth: 2,
    shadowColor: '#1F2340',
    shadowOpacity: 0.1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  front: { backgroundColor: colors.surface, borderColor: colors.blueSoft },
  back: { backgroundColor: colors.purpleSoft, borderColor: '#D9CAFF' },
  tag: { position: 'absolute', top: 16, left: 20, fontSize: 15, fontWeight: '800', color: colors.blue },
  text: { color: colors.ink, fontWeight: '700', textAlign: 'center' },
  hint: { position: 'absolute', bottom: 14, fontSize: 14, color: colors.sub },
});
