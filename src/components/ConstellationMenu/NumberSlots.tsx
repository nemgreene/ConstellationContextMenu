import { Link } from "expo-router";
import React, { RefObject, useContext } from "react";
import { Pressable, Text } from "react-native";
import Animated, {
  SharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";
import {
  Gesture,
  GestureDetector,
  GestureStateChangeEvent,
  PanGestureHandlerEventPayload,
} from "react-native-gesture-handler";
import { GestureHandlerEvent } from "react-native-reanimated/lib/typescript/reanimated2/hook";
import { HoverGestureHandlerEventPayload } from "react-native-gesture-handler/lib/typescript/handlers/gestures/hoverGesture";
import { FlattenedButton } from "./types";
import { ConstellationContext } from "@/app/utilities/math";

interface NumberSlotProps {
  buttonData: FlattenedButton;
  index: number;
  // onHoverIn?: (args: InjectionContext) => void;
  // onHoverOut?: (args: InjectionContext) => void;
}

const NumberSlot = React.forwardRef(
  (props: NumberSlotProps, ref: RefObject<any>) => {
    const { buttonData, index } = props;
    const { activePath, hoveredIndex } = useContext(ConstellationContext);
    const { label, visible, active, top, left, height, width } = buttonData;

    // const common: CommonInjectionContext = {
    //   active,
    //   visible,
    //   buttonData,
    //   activePath,
    //   top,
    //   left,
    //   height,
    //   width,
    // };

    const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

    const animatedButtonStyles = useAnimatedStyle(() => ({
      borderColor: hoveredIndex.value === index ? "red" : "blue",
      borderWidth: 2,
      borderStyle: "solid",
      backgroundColor: active.value ? "red" : "blue",
      opacity: visible.value ? 1 : 0.1,
    }));

    return (
      // <GestureDetector gesture={hover}>
      <Animated.View
        ref={ref}
        className="GestureDetector"
        style={{ alignItems: "center" }}
        onLayout={() => {
          ref.current?.measure((x, y, elemWidth, elemHeight, pageX, pageY) => {
            top.value = pageY;
            left.value = pageX;
            width.value = elemWidth;
            height.value = elemHeight;
          });
        }}
      >
        <AnimatedPressable
          style={[animatedButtonStyles]}
          className={"bg-sky-700 px-5 py-2 rounded box-border"}
        >
          <Text className="text-cyan-200">{label}</Text>
        </AnimatedPressable>
      </Animated.View>
      // </GestureDetector>
    );
  }
);

export default NumberSlot;
