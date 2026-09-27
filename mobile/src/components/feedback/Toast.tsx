import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Animated, StyleSheet, Text, useAnimatedValue } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, font } from "@/theme";

const DURATION_MS = 2200;

const ToastContext = createContext<(message: string) => void>(() => {});

/** Show a short dark message at the top of the screen, e.g. "Room published" */
export function useToast() {
  return useContext(ToastContext);
}

/** `onToast` hears every message, e.g. to celebrate good news */
export function ToastProvider({ children, onToast }: { children: ReactNode; onToast?: (message: string) => void }) {
  // id restarts the entrance animation when a new toast replaces a visible one
  const [toast, setToast] = useState<{ id: number; text: string } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const show = useCallback((text: string) => {
    setToast((prev) => ({ id: (prev?.id ?? 0) + 1, text }));
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), DURATION_MS);
    onToast?.(text);
  }, [onToast]);

  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      {toast && <ToastBubble key={toast.id} message={toast.text} />}
    </ToastContext.Provider>
  );
}

function ToastBubble({ message }: { message: string }) {
  const insets = useSafeAreaInsets();
  const anim = useAnimatedValue(0);

  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
  }, [anim]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.toast,
        {
          top: insets.top + 26,
          opacity: anim,
          transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }],
        },
      ]}
    >
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    alignSelf: "center",
    maxWidth: "90%",
    zIndex: 50,
    backgroundColor: colors.ink,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 11,
    shadowColor: colors.ink,
    shadowOpacity: 0.3,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  text: { color: colors.surface, textAlign: "center", ...font(700, 13.5) },
});
