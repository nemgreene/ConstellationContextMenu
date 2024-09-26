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
import { orign, overlapping } from "@/app/utilities/math";
import { adaptViewConfig } from "react-native-reanimated/lib/typescript/ConfigHelper";

type InjectionContext = {
  event:
    | GestureStateChangeEvent<PanGestureHandlerEventPayload>
    | GestureHandlerEvent<PanGestureHandlerEventPayload>
    | GestureHandlerEvent<HoverGestureHandlerEventPayload>;
  // origin: { x: number; y: number };
  offsetX: SharedValue<number>;
  offsetY: SharedValue<number>;
  activePath: SharedValue<string>;
  translationX: SharedValue<number>;
  translationY: SharedValue<number>;
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

    // function clamp(val, min, max) {
    //   return Math.min(Math.max(val, min), max);
    // }

    const { width, height } = Dimensions.get("screen");

    //Offset between where drag begins and the center of the element

    const offsetX: SharedValue<number> = useSharedValue(0);
    const offsetY: SharedValue<number> = useSharedValue(0);
    const translationX: SharedValue<number> = useSharedValue(0);
    const translationY: SharedValue<number> = useSharedValue(0);
    const originX: SharedValue<number> = useSharedValue(0);
    const originY: SharedValue<number> = useSharedValue(0);
    const found = useSharedValue(0);

    const common = {
      offsetX,
      offsetY,
      translationX,
      translationY,
      active,
      setActive,
      elementPath,
      activePath,
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
          connections[0].x1.value = originX.value;
          connections[0].y1.value = originY.value;
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
        buttons.forEach((ref, index) => {
          ref.current?.measure((x, y, width, height, pageX, pageY) => {
            if (
              overlapping({
                x: pageX,
                y: pageY,
                width,
                height,
                mx: absoluteX,
                my: absoluteY,
              })
            ) {
              found.value = index + 1;
            }
          });

          if (found.value) {
            onHoverIn &&
              onHoverIn({
                event,
                ...props,
                ...common,
                index: found.value - 1,
              });
            return;
          }
          hoveredIndex.value = -1;
        });
      })
      .onEnd((event) => {
        //snap back animated line
        const [x, y] = [originX.value, originY.value];
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
            ref.current?.measure((x, y, width, height, pageX, pageY) => {
              originX.value = pageX + width / 2;
              originY.value = pageY + height / 2;
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
      </GestureDetector>
    );
  }
);

export default NumberSlot;
