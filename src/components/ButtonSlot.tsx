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
  runOnJS,
  runOnUI,
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
import { overlapping } from "@/app/utilities/math";

type InjectionContext = {
  event:
    | GestureStateChangeEvent<PanGestureHandlerEventPayload>
    | GestureHandlerEvent<PanGestureHandlerEventPayload>
    | GestureHandlerEvent<HoverGestureHandlerEventPayload>;
  origin: { x: number; y: number };
  offsetX: SharedValue<number>;
  offsetY: SharedValue<number>;
  translationX: SharedValue<number>;
  translationY: SharedValue<number>;
  active: boolean;
  setActive: Dispatch<SetStateAction<boolean>>;
} & NumberSlotProps;

interface NumberSlotProps {
  index: number;
  targets: { x: SharedValue<number>; y: SharedValue<number> }[];
  label: string;
  hoveredIndex: SharedValue<number>;
  buttons: any[];
  onUpdate?: (args: InjectionContext) => void;
  onStart?: (args: InjectionContext) => void;
  onBegin?: (args: InjectionContext) => void;
  onHover?: (args: InjectionContext) => void;
}

const ButtonSlot = React.forwardRef(
  (props: NumberSlotProps, ref: RefObject<any>) => {
    const {
      index,
      targets,
      onUpdate,
      label,
      onStart,
      onBegin,
      hoveredIndex,
      onHover,
      buttons,
    } = props;
    const [active, setActive] = useState<boolean>(false);
    const [origin, setOrigin] = useState<{ x: number; y: number }>({
      x: 0,
      y: 0,
    });
    const offsetX: SharedValue<number> = useSharedValue(0);
    const offsetY: SharedValue<number> = useSharedValue(0);
    const translationX: SharedValue<number> = useSharedValue(0);
    const translationY: SharedValue<number> = useSharedValue(0);

    const common = {
      origin,
      offsetX,
      offsetY,
      translationX,
      translationY,
      active,
      setActive,
    };

    function someWorklet(greeting) {
      "worklet";
      console.log(greeting, "From the UI thread");
    }
    const pan = Gesture.Pan()
      .runOnJS(true)
      .minDistance(1)
      .onBegin(
        (event: GestureStateChangeEvent<PanGestureHandlerEventPayload>) => {
          offsetX.value = event.absoluteX - origin.x;
          offsetY.value = event.absoluteY - origin.y;
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
        if (onStart) {
          console.log("starting drag");
          // onStart("hello");
          runOnUI(someWorklet)("Howdy");
          // onStart({ ...props });
        }
        // onStart &&
        //   onStart({
        //     event,
        //     ...props,
        //     ...common,
        //   });
      });

    return (
      <GestureDetector gesture={pan}>
        <Animated.View ref={ref}>
          <Pressable
            onPress={() => {
              console.log("pressing", index);
            }}
            // style={[animatedButtonStyles]}
            className={"bg-sky-700 px-5 py-2 rounded"}
          >
            <Text className="text-cyan-200">{label}</Text>
          </Pressable>
        </Animated.View>
      </GestureDetector>
    );
  }
);

export default ButtonSlot;
