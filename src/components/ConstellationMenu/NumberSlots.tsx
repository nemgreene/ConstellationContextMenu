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
import { origin, overlapping } from "@/app/utilities/math";
import { adaptViewConfig } from "react-native-reanimated/lib/typescript/ConfigHelper";

type InjectionContext = {
  event:
    | GestureStateChangeEvent<PanGestureHandlerEventPayload>
    | GestureHandlerEvent<PanGestureHandlerEventPayload>
    | GestureHandlerEvent<HoverGestureHandlerEventPayload>;
  activePath: SharedValue<string>;
  active: boolean;
  setActive: Dispatch<SetStateAction<boolean>>;
  elementPath: string;
} & NumberSlotProps;

interface NumberSlotProps {
  index: number;
  connections: {
    x1: SharedValue<number>;
    y1: SharedValue<number>;
    x2: SharedValue<number>;
    y2: SharedValue<number>;
    index: number;
  }[];
  label: string;
  hoveredIndex: SharedValue<number>;
  buttons: any[];
  elementPath: string;
  onUpdate?: (args: InjectionContext) => void;
  onStart?: (args: InjectionContext) => void;
  onBegin?: (args: InjectionContext) => void;
  onHoverIn?: (args: InjectionContext) => void;
  onHoverOut?: (args: InjectionContext) => void;
  onEnd?: (args: InjectionContext) => void;
  activePath: SharedValue<string>;
}

const NumberSlot = React.forwardRef(
  (props: NumberSlotProps, ref: RefObject<any>) => {
    const {
      index,
      connections,
      onUpdate,
      label,
      onStart,
      onBegin,
      hoveredIndex,
      onHoverIn,
      onHoverOut,
      onEnd,
      buttons,
      activePath,
      elementPath,
    } = props;
    const [active, setActive] = useState<boolean>(false);

    const { top, left, height, width } = buttons[index];

    //Offset between where drag begins and the center of the element

    const common = {
      active,
      setActive,
      elementPath,
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

    const pan = Gesture.Pan()
      .runOnJS(true)
      .minDistance(1)
      .onBegin(
        (event: GestureStateChangeEvent<PanGestureHandlerEventPayload>) => {
          const { x, y } = origin(
            top.value,
            left.value,
            height.value,
            width.value
          );
          connections[0].x1.value = x;
          connections[0].y1.value = y;
          connections[0].x2.value = event.absoluteX;
          connections[0].y2.value = event.absoluteY;
          onBegin &&
            onBegin({
              event,
              ...props,
              ...common,
            });
        }
      )
      .onStart((event: GestureHandlerEvent<PanGestureHandlerEventPayload>) => {
        // caluclate offset between where touch picks up element and its center
        onStart &&
          onStart({
            event,
            ...props,
            ...common,
          });
      })
      .onUpdate((event) => {
        const { velocityX, velocityY, absoluteX, absoluteY } = event;
        //orchestrate line drag
        connections[0].x2.value = absoluteX;
        connections[0].y2.value = absoluteY;
        onUpdate &&
          onUpdate({
            event,
            ...props,
            ...common,
          });
        try {
          buttons.forEach((button, index) => {
            const { top, left, height, width } = button;
            if (
              overlapping({
                top: top.value,
                left: left.value,
                width: width.value,
                height: height.value,
                mouseX: absoluteX,
                mouseY: absoluteY,
              })
            ) {
              throw index;
            }
          });
          hoveredIndex.value = -1;
        } catch (index) {
          onHoverIn &&
            onHoverIn({
              event,
              ...props,
              ...common,
              index,
            });
          return;
        }
      })
      .onEnd((event) => {
        //snap back animated line
        const { x, y } = origin(
          top.value,
          left.value,
          height.value,
          width.value
        );
        const [cx, cy] = [connections[0].x2.value, connections[0].y2.value];

        connections[0].x2.value = withClamp(
          { min: Math.min(cx, x), max: Math.max(cx, x) },
          withSpring(x)
        );
        connections[0].y2.value = withClamp(
          { min: Math.min(cy, y), max: Math.max(cy, y) },
          withSpring(y)
        );
        activePath.value = "";
        onEnd &&
          onEnd({
            event,
            ...props,
            ...common,
          });
      });

    const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

    const animatedButtonStyles = useAnimatedStyle(() => ({
      borderColor: hoveredIndex.value === index ? "red" : "rgb(3 105 161)",
      borderWidth: 2,
      borderStyle: "solid",
      opacity: activePath.value.includes(elementPath) ? 1 : 0.5,
    }));

    const composed = Gesture.Simultaneous(pan, hover);

    return (
      <GestureDetector gesture={composed}>
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
