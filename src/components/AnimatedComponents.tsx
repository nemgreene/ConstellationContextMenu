import { Text, View } from "react-native";
import { TextInput } from "react-native-gesture-handler";
import Animated from "react-native-reanimated";
import { Line, Polyline } from "react-native-svg";

export const AnimatedView = Animated.createAnimatedComponent(View);
export const AnimatedLine = Animated.createAnimatedComponent(Line);
export const AnimatedText = Animated.createAnimatedComponent(Text);
export const AnimatedInput = Animated.createAnimatedComponent(TextInput);
export const AnimatedPolyLine = Animated.createAnimatedComponent(Polyline);
