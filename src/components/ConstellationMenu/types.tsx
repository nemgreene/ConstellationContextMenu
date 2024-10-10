import { RefObject } from "react";
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

export interface CommonButtonProps {
  label: string;
  onClick?: () => void;
  pin?: boolean;
}

export interface ConstellationButton extends CommonButtonProps {
  buttons?: any[];
}

export interface FlattenedButton extends CommonButtonProps {
  id: any;
  buttons?: any[];
  path: string;
  index: number;
  top: SharedValue<number>;
  left: SharedValue<number>;
  height: SharedValue<number>;
  width: SharedValue<number>;
  visible: SharedValue<boolean>;
  ref: RefObject<any>;
}
