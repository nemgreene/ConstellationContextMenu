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
  activePath: SharedValue<string>;
  translationX: SharedValue<number>;
  translationY: SharedValue<number>;
  active: boolean;
  setActive: Dispatch<SetStateAction<boolean>>;
  elementPath: string;
} & NumberSlotProps;

interface NumberSlotProps {
  index: number;
  targets: { x: SharedValue<number>; y: SharedValue<number> }[];
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
      targets,
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
    const [origin, setOrigin] = useState<{ x: number; y: number }>({
      x: 0,
      y: 0,
    });

    // function clamp(val, min, max) {
    //   return Math.min(Math.max(val, min), max);
    // }

    const { width, height } = Dimensions.get("screen");

    //Offset between where drag begins and the center of the element

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
        onStart &&
          onStart({
            event,
            ...props,
            ...common,
          });
      })
      .onUpdate((event) => {
        const { absoluteX, absoluteY } = event;
        onUpdate &&
          onUpdate({
            event,
            ...props,
            ...common,
          });

        try {
          buttons.forEach((ref, index) => {
            ref.current?.measure((fx, fy, width, height, px, py) => {
              if (
                overlapping({
                  x: px,
                  y: py,
                  width,
                  height,
                  mx: absoluteX,
                  my: absoluteY,
                }) &&
                index !== hoveredIndex.value
              ) {
                onHoverIn &&
                  onHoverIn({
                    event,
                    ...props,
                    ...common,
                    index,
                  });
                // hoveredIndex.value = index;
              }
            });
          });
        } catch (err) {}

        // onUpdate(absoluteX - offsetX.value, absoluteY - offsetY.value);

        // targets[0].x.value = absoluteX - offsetX.value;
        // targets[0].y.value = absoluteY - offsetY.value;
        // translationX.value = event.translationX;
        // translationY.value = event.translationY;
      })
      .onEnd((event) => {
        //snap back animated line
        translationX.value = withSpring(0);
        translationY.value = withSpring(0);
        targets[0].x.value = withSpring(origin.x);
        targets[0].y.value = withSpring(origin.y);
        onEnd &&
          onEnd({
            event,
            ...props,
            ...common,
          });
      });

    useEffect(() => {
      ref.current.measure((fx, fy, width, height, px, py) => {
        setOrigin({ x: px + width / 2, y: py + height / 2 });
      });
    }, [width, height]);

    const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

    // const animatedStyles = useAnimatedStyle(() => ({
    //   transform: [
    //     { translateX: translationX.value },
    //     { translateY: translationY.value },
    //   ],
    // }));

    const animatedButtonStyles = useAnimatedStyle(() => ({
      borderColor: hoveredIndex.value === index ? "red" : "rgb(3 105 161)",
      borderWidth: 2,
      borderStyle: "solid",
      opacity: activePath.value === elementPath ? 1 : 0.5,
    }));

    const composed = Gesture.Simultaneous(pan, hover);

    return (
      <GestureDetector gesture={composed}>
        {/* <Animated.View ref={ref} style={[animatedStyles]}> */}
        <Animated.View ref={ref}>
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
