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
import { ObjectFlatten, origin } from "@/app/utilities/math";

interface CommonButtonProps {
  label: string;
  onClick?: () => void;
  pin?: boolean;
}

interface ConstellationButton extends CommonButtonProps {
  buttons?: any[];
}

interface FlattenedButton extends CommonButtonProps {
  buttons?: any[];
  path: string;
  index: number;
  top: SharedValue<number>;
  left: SharedValue<number>;
  height: SharedValue<number>;
  width: SharedValue<number>;
  ref: RefObject<any>;
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
  { label: "Button2 (Pin)", pin: true },
  { label: "Button3" },
];

export default function ConstellationMenu() {
  const [commandChain, setCommandChain] = useState("");
  const [buttons, setButtons] = useState<FlattenedButton[]>(
    ObjectFlatten(schema).map((v) => ({
      ...v,
      top: useSharedValue(0),
      left: useSharedValue(0),
      height: useSharedValue(0),
      width: useSharedValue(0),
      ref: React.createRef(),
    }))
  );

  const maxNesting =
    buttons.map((v) => v.path.split(">").length).sort((a, b) => b - a)[0] || 1;

  //inverted chain of connections to draw
  //connection 0(x1, y1) is always bound to mouse
  //connection 0(x2, y2) bound to most recent chaining
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

  // const dictLookup = buttons
  //   .map((v, i) => ({ ...v, ref: refs[i] }))
  //   .reduce((acc, curr) => ({ ...acc, [curr.path]: curr }), {});

  const activePath: SharedValue<string> = useSharedValue("");
  const hoveredIndex: SharedValue<number> = useSharedValue(
    Object.keys(buttons).length + 1
  );

  const onHoverIn = (args) => {
    const { index, event } = args;
    const target = buttons[index];
    hoveredIndex.value = index;
    activePath.value = target.path + `>${target.label}`;

    if (target.buttons || target.pin) {
      // if (dictLookup[target.path]?.ref?.current) {
      //   const targetOriginX = useSharedValue(0);
      //   const targetOriginY = useSharedValue(0);
      //   // dictLookup[target.path]?.ref?.current.measure((x, y, width, height, pageX, pageY) => {
      //   //   targetOriginX =
      //   // });
      // }
      // const {x, y} = orign()
      // connections[0].x1.value = originX.value;
      // connections[0].y1.value = originY.value;
      // connections[0].x2.value = event.absoluteX;
      // connections[0].y2.value = event.absoluteY;
    }
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
              buttons={buttons}
              connections={connections}
              index={i}
              key={i}
              ref={v.ref}
              activePath={activePath}
              elementPath={v.path}
              hoveredIndex={hoveredIndex}
              label={v.label && v.label.toString()}
              onHoverIn={onHoverIn}
              onHoverOut={(args) => {
                hoveredIndex.value = -1;
              }}
              onStart={(args) => {}}
              onUpdate={({ event }) => {}}
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
