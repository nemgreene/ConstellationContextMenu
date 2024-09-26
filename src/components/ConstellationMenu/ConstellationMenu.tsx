import { Link } from "expo-router";
import React, { RefObject, useEffect, useRef, useState } from "react";
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
  useAnimatedReaction,
  runOnJS,
} from "react-native-reanimated";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import { StyleSheet, Dimensions } from "react-native";
import Svg, { Line, Circle } from "react-native-svg";
import NumberSlot from "@/components/ConstellationMenu/NumberSlots";
import {
  AnimatedInput,
  AnimatedLine,
  AnimatedText,
} from "@/components/AnimatedComponents";
import ConnectionHandler from "./ConnectionHandler";
import { ObjectFlatten, orign } from "@/app/utilities/math";

interface CommonButtonProps {
  label: string;
  onClick?: () => void;
}

interface ConstellationButton extends CommonButtonProps {
  buttons?: any[];
}

interface FlattenedButton extends CommonButtonProps {
  buttons?: any[];
  path: string;
  index: number;
}

const schema: ConstellationButton[] = [
  { label: "Button0" },
  {
    label: "Button1",
    buttons: [
      { label: "ChildButton1" },
      { label: "ChildButton2", buttons: [{ label: "subChild" }] },
      { label: "ChildButton3" },
    ],
  },
  { label: "Button2" },
  { label: "Button3" },
];

export default function ConstellationMenu() {
  const [buttons, setButtons] = useState<FlattenedButton[]>(
    ObjectFlatten(schema)
  );
  const [commandChain, setCommandChain] = useState("");

  const maxNesting =
    buttons.map((v) => v.path.split(">").length).sort((a, b) => b - a)[0] || 1;

  //inverted chain of connections to draw
  //connection 0 is always bound to mouse
  //connection 1 bound to most recent chaining
  //all further connections are synamic
  const connections: {
    x1: SharedValue<number>;
    y1: SharedValue<number>;
    x2: SharedValue<number>;
    y2: SharedValue<number>;
    index: number;
  }[] = new Array(maxNesting).fill("").map((v, i) => ({
    index: i,
    x1: useSharedValue(0),
    x2: useSharedValue(0),
    y1: useSharedValue(0),
    y2: useSharedValue(0),
  }));

  console.log(buttons);

  const refs: any[] = React.useMemo(
    () => Object.keys(buttons).map((item) => ({ ref: React.createRef() })),
    []
  );
  const dictLookup = buttons
    .map((v, i) => ({ ...v, ref: refs[i] }))
    .reduce((acc, curr) => ({ ...acc, [curr.path]: curr }), {});

  const activePath: SharedValue<string> = useSharedValue("");
  const hoveredIndex: SharedValue<number> = useSharedValue(
    Object.keys(buttons).length + 1
  );

  const onHoverIn = (args) => {
    const { index } = args;
    hoveredIndex.value = index;
    activePath.value = buttons[index].path + `>${buttons[index].label}`;
  };

  return (
    <GestureHandlerRootView>
      <ConnectionHandler
        connections={connections}
        activePath={activePath}
        maxNesting={maxNesting}
      />
      <View className="flex flex-1 justify-center items-center">
        <View className="m-2">
          <Text>Command Chain: {commandChain ? commandChain : "None"}</Text>
        </View>
        <View className=" flex flex-row gap-2 flex-wrap w-1/2 items-center justify-center">
          {buttons.map((v, i, a) => (
            <NumberSlot
              buttons={refs}
              connections={connections}
              index={i}
              key={i}
              ref={refs[i]}
              activePath={activePath}
              elementPath={v.path}
              hoveredIndex={hoveredIndex}
              label={v.label && v.label.toString()}
              onHoverIn={onHoverIn}
              onHoverOut={(args) => {
                hoveredIndex.value = -1;
              }}
              onStart={(args) => {}}
              onUpdate={({ event }) => {
                console.log(activePath.value);
              }}
              onEnd={({ event, index }) => {
                if (hoveredIndex.value !== -1) {
                  setCommandChain(
                    buttons[hoveredIndex.value].path +
                      `>${buttons[hoveredIndex.value].label}`
                  );
                  hoveredIndex.value = -1;
                }
              }}
            />
          ))}
        </View>
      </View>
    </GestureHandlerRootView>
  );
}
