import { Link } from "expo-router";
import React, {
  Dispatch,
  RefObject,
  SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react";
import { Button, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import StyledButton from "@/styled/StyledButton";
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
import {
  Gesture,
  GestureDetector,
  GestureEvent,
  GestureHandlerRootView,
  GestureStateChangeEvent,
  PanGestureHandlerEventPayload,
  PanGestureHandlerGestureEvent,
} from "react-native-gesture-handler";
import { StyleSheet, Dimensions } from "react-native";
import Svg, { Line, Circle } from "react-native-svg";
import { GestureHandlerEvent } from "react-native-reanimated/lib/typescript/reanimated2/hook";
import { PanGestureType } from "react-native-gesture-handler/lib/typescript/handlers/gestures/panGesture";
import {
  HoverGestureChangeEventPayload,
  HoverGestureHandlerEventPayload,
} from "react-native-gesture-handler/lib/typescript/handlers/gestures/hoverGesture";
import {
  origin,
  overlapping,
  pathToArray,
  pathWithoutPins,
} from "@/app/utilities/math";
import { adaptViewConfig } from "react-native-reanimated/lib/typescript/ConfigHelper";
import { ConnectionInterface, FlattenedButton } from "./types";
import { GestureDetectorBridge } from "react-native-screens";

type InjectionContext = {
  event:
    | GestureStateChangeEvent<PanGestureHandlerEventPayload>
    | GestureHandlerEvent<PanGestureHandlerEventPayload>
    | GestureHandlerEvent<HoverGestureHandlerEventPayload>;
  activePath: SharedValue<string>;
  // active: boolean;
  // setActive: Dispatch<SetStateAction<boolean>>;
  top: number;
  left: number;
  height: number;
  width: number;
  buttonData: FlattenedButton;
} & NumberSlotProps;

interface NumberSlotProps {
  activePath: SharedValue<string>;
  buttons: any[];
  buttonData: FlattenedButton;
  hoveredIndex: SharedValue<number>;
  index: number;
  onHoverIn?: (args: InjectionContext) => void;
  onHoverOut?: (args: InjectionContext) => void;
}

const NumberSlot = React.forwardRef(
  (props: NumberSlotProps, ref: RefObject<any>) => {
    const {
      activePath,
      buttons,
      buttonData,
      hoveredIndex,
      index,
      onHoverIn,
      onHoverOut,
    } = props;
    const [active, setActive] = useState<boolean>(false);

    const { top, left, height, width } = buttons[index];
    const { id, path: elementPath, label } = buttonData;

    //Offset between where drag begins and the center of the element

    const common = {
      // active,
      // setActive,
      buttonData,
      activePath,
      top,
      left,
      height,
      width,
    };

    const hover = Gesture.Hover()
      .runOnJS(true)
      .onStart(
        (event: GestureHandlerEvent<HoverGestureHandlerEventPayload>) => {
          if (onHoverIn) {
            onHoverIn({
              event,
              ...props,
              ...common,
            });
          }
        }
      )
      .onEnd(
        (event: GestureStateChangeEvent<HoverGestureHandlerEventPayload>) => {
          if (onHoverOut) {
            onHoverOut({
              event,
              ...props,
              ...common,
            });
          }
        }
      );

    const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

    const animatedButtonStyles = useAnimatedStyle(() => ({
      borderColor: hoveredIndex.value === index ? "red" : "rgb(3 105 161)",
      borderWidth: 2,
      borderStyle: "solid",
      backgroundColor: activePath.value.includes(id) ? "red" : "rgb(3 105 161)",
      opacity: activePath.value.includes(pathToArray(elementPath).reverse()[0])
        ? 1
        : 0.1,
    }));

    return (
      <GestureDetector gesture={hover}>
        {/* <Animated.View ref={ref} style={[animatedStyles]}> */}
        <Animated.View
          ref={ref}
          className="GestureDetector"
          style={{ alignItems: "center" }}
          onLayout={() => {
            ref.current?.measure(
              (x, y, elemWidth, elemHeight, pageX, pageY) => {
                top.value = pageY;
                left.value = pageX;
                width.value = elemWidth;
                height.value = elemHeight;
              }
            );
          }}
        >
          <AnimatedPressable
            style={[animatedButtonStyles]}
            className={"bg-sky-700 px-5 py-2 rounded box-border"}
          >
            <Text className="text-cyan-200">{label}</Text>
          </AnimatedPressable>
        </Animated.View>
      </GestureDetector>
    );
  }
);

export default NumberSlot;
