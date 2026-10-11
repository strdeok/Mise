import type { ReactNode } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { Easing, ReduceMotion, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const motion = {
  pressInMs: 90,
  pressOutMs: 150,
  tabEnterMs: 180,
  treeMs: 180,
} as const;

type MotionPressableProps = Omit<PressableProps, 'style' | 'children'> & {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  pressedScale?: number;
};

/** Keeps touch feedback short and follows the device's Reduce Motion setting. */
export function MotionPressable({ children, style, pressedScale = 0.97, onPressIn, onPressOut, disabled, ...props }: MotionPressableProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return <AnimatedPressable
    {...props}
    disabled={disabled}
    style={[style, animatedStyle]}
    onPressIn={(event) => {
      if (!disabled) scale.value = withTiming(pressedScale, { duration: motion.pressInMs, easing: Easing.out(Easing.quad), reduceMotion: ReduceMotion.System });
      onPressIn?.(event);
    }}
    onPressOut={(event) => {
      scale.value = withTiming(1, { duration: motion.pressOutMs, easing: Easing.out(Easing.cubic), reduceMotion: ReduceMotion.System });
      onPressOut?.(event);
    }}
  >{children}</AnimatedPressable>;
}
