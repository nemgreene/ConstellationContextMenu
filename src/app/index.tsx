import { Link } from "expo-router";
import React, { RefObject, useRef, useState } from "react";
import { Button, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import StyledButton from "@/styled/StyledButton";
import Animated, {
  useSharedValue,
  SharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withTiming,
  withSpring,
} from "react-native-reanimated";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import { StyleSheet, Dimensions } from "react-native";
import Svg, { Line, Circle } from "react-native-svg";
import NumberSlot from "@/components/NumberSlots";

export default function Page() {
  const origin: {
    x: SharedValue<number>;
    y: SharedValue<number>;
  } = {
    x: useSharedValue(100),
    y: useSharedValue(100),
  };
  const [targets, setTargets] = useState<
    { x: SharedValue<number>; y: SharedValue<number>; id: String }[]
  >([
    {
      id: "1",
      x: useSharedValue(0),
      y: useSharedValue(0),
    },
    {
      id: "2",
      x: useSharedValue(0),
      y: useSharedValue(0),
    },
  ]);

  const animatedProps = useAnimatedProps(() => ({
    x1: targets[0].x.value,
    y1: targets[0].y.value,
    x2: origin.x.value,
    y2: origin.y.value,
  }));

  const AnimatedLine = Animated.createAnimatedComponent(Line);

  const buttons: RefObject<any>[] = new Array(5).fill(useRef(null));
  const refs: any[] = React.useMemo(
    () => buttons.map((item) => ({ ref: React.createRef() })),
    []
  );

  const hoveredIndex: SharedValue<number> = useSharedValue(buttons.length + 1);
  return (
    <GestureHandlerRootView>
      <View className="z-50 absolute w-full h-full pointer-events-none">
        <Svg
          className="w-full h-full pointer-events-none"
          style={[StyleSheet.absoluteFill, { height: "100%", width: "100%" }]}
        >
          <AnimatedLine
            animatedProps={animatedProps}
            stroke={"red"}
            strokeWidth={"2px"}
          />
        </Svg>
      </View>
      <View className="flex flex-1 justify-center items-center">
        <View className=" flex flex-row gap-2">
          {refs.map((v, i, a) => (
            <NumberSlot
              buttons={refs}
              targets={targets}
              index={i}
              key={i}
              ref={refs[i]}
              hoveredIndex={hoveredIndex}
              label={i.toString()}
              onHoverIn={({ event, index }) => {
                hoveredIndex.value = index;
              }}
              onHoverOut={(args) => {
                hoveredIndex.value = buttons.length;
              }}
              onStart={(args) => {
                origin.x.value = args.origin.x;
                origin.y.value = args.origin.y;
              }}
              onUpdate={({ event }) => {
                const { absoluteX, absoluteY } = event;
                //orchestrate line drag
                targets[0].x.value = absoluteX;
                targets[0].y.value = absoluteY;
              }}
              onEnd={({ event }) => {
                hoveredIndex.value = buttons.length;
              }}
            />
          ))}
        </View>
      </View>
    </GestureHandlerRootView>
  );
}
