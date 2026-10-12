import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, font } from '../theme';

type Tone = 'primary' | 'purple' | 'ghost' | 'danger' | 'ok' | 'warn';

export function Button({
  label,
  onPress,
  tone = 'primary',
  disabled,
  style,
}: {
  label: string;
  onPress: () => void;
  tone?: Tone;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const bg: Record<Tone, string> = {
    primary: colors.blue,
    purple: colors.purple,
    ghost: colors.surface,
    danger: colors.danger,
    ok: colors.ok,
    warn: colors.warn,
  };
  const ghost = tone === 'ghost';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: bg[tone], opacity: disabled ? 0.4 : pressed ? 0.85 : 1 },
        ghost && { borderWidth: 2, borderColor: colors.line },
        style,
      ]}
    >
      <Text style={[styles.btnText, ghost && { color: colors.ink }]}>{label}</Text>
    </Pressable>
  );
}

export function ProgressBar({ percent, color = colors.blue }: { percent: number; color?: string }) {
  return (
    <View style={styles.barBg} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: percent }}>
      <View style={[styles.barFill, { width: `${Math.max(0, Math.min(100, percent))}%`, backgroundColor: color }]} />
    </View>
  );
}

export function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.dialog} accessibilityViewIsModal>
          <Text style={styles.dialogTitle}>{title}</Text>
          <Text style={styles.dialogMsg}>{message}</Text>
          <View style={{ gap: 10, marginTop: 16 }}>
            <Button label={confirmLabel} tone="danger" onPress={onConfirm} />
            <Button label="キャンセル" tone="ghost" onPress={onCancel} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function Screen({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.screenOuter}>
      <View style={styles.screenInner}>{children}</View>
    </View>
  );
}

export const styles = StyleSheet.create({
  btn: { minHeight: 52, borderRadius: 14, paddingHorizontal: 18, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: '#fff', fontSize: font.body, fontWeight: '700' },
  barBg: { height: 10, borderRadius: 5, backgroundColor: colors.line, overflow: 'hidden' },
  barFill: { height: 10, borderRadius: 5 },
  overlay: { flex: 1, backgroundColor: 'rgba(31,35,64,0.45)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  dialog: { width: '100%', maxWidth: 420, backgroundColor: colors.surface, borderRadius: 18, padding: 22 },
  dialogTitle: { fontSize: 22, fontWeight: '800', color: colors.ink },
  dialogMsg: { fontSize: font.body, color: colors.sub, marginTop: 8, lineHeight: 26 },
  screenOuter: { flex: 1, backgroundColor: colors.bg, alignItems: 'center' },
  screenInner: { flex: 1, width: '100%', maxWidth: 640 },
});
