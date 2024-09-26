import Animated, {
  useSharedValue,
  SharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withTiming,
  withSpring,
  interpolateColor,
  interpolate,
  withClamp,
} from "react-native-reanimated";

export interface ConnectionInterface {
  x1: SharedValue<number>;
  y1: SharedValue<number>;
  index: number;
}
