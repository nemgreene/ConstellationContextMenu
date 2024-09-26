import { Link } from "expo-router";
import React, {
  Dispatch,
  PropsWithChildren,
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
import { ObjectFlatten, origin, overlapping } from "@/app/utilities/math";
import { adaptViewConfig } from "react-native-reanimated/lib/typescript/ConfigHelper";
import { ConnectionInterface } from "./types";
import ConnectionHandler from "./ConnectionHandler";
import NumberSlot from "./NumberSlots";

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

export default function ConstellationMenu({ children }: PropsWithChildren) {
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
    buttons.map((v) => v.path.split(">").length).sort((a, b) => b - a)[0] + 1 ||
    1;

  //inverted chain of connections to draw
  //connection 0(x1, y1) is always bound to mouse
  //connection 0(x2, y2) bound to most recent chaining
  //all further connections are synamic
  const connections: ConnectionInterface[] = new Array(maxNesting)
    .fill("")
    .map((v, i) => ({
      index: i,
      x1: useSharedValue(0),
      y1: useSharedValue(0),
    }));

  // const dictLookup = buttons
  //   .map((v, i) => ({ ...v, ref: refs[i] }))
  //   .reduce((acc, curr) => ({ ...acc, [curr.path]: curr }), {});

  const activePath: SharedValue<string> = useSharedValue("");
  const hoveredIndex: SharedValue<number> = useSharedValue(
    Object.keys(buttons).length + 1
  );

  // const filteredPath = (path: SharedValue<number> | string) => {
  //   const ret = typeof path === "object" ? path.value : path

  // }

  const onHoverIn = (args) => {
    "worklet";
    const {
      index,
      event: { absoluteX, absoluteY },
    } = args;
    const { path, label, buttons: hasButtons } = buttons[index];

    hoveredIndex.value = index;

    //static
    const hoveredDepth = path?.split(">").slice(1).length;

    //dynamic
    let activeDepth = activePath.value.split(">").slice(1).length;

    const { top, left, height, width } = buttons[index];
    const { x, y } = origin(top, left, height, width);

    //if activeDepth === hoveredDept, handle silbings
    if (activeDepth >= hoveredDepth) {
      let update = buttons[index]?.path + `>${buttons[index].label}`;
      activePath.value = update;
      activeDepth = update.split(">").slice(1).length;
    } else {
      activePath.value = path + `>${label}`;
    }

    connections.forEach((v, i) => {
      // anyhthing below active depth, should remain the same
      // anything AT active depth, should snap to hovered?
      // anything above active depth is connected to drag
      if (i <= Math.min(activeDepth, hoveredDepth)) {
        return;
      }
      if (i > Math.min(activeDepth, hoveredDepth)) {
        v.x1.value = x;
        v.y1.value = y;
        return;
      }
    });
  };

  const gestureOriginX = useSharedValue(0);
  const gestureOriginY = useSharedValue(0);

  const pan = Gesture.Pan()
    .runOnJS(true)
    .minDistance(1)
    .onBegin(
      (event: GestureStateChangeEvent<PanGestureHandlerEventPayload>) => {
        gestureOriginX.value = event.absoluteX;
        gestureOriginY.value = event.absoluteY;
        activePath.value = "";
        // const { x, y } = origin(top, left, height, width);
        connections.forEach((v) => {
          v.x1.value = event.absoluteX;
          v.y1.value = event.absoluteY;
        });
      }
    )

    .onUpdate((event) => {
      const { velocityX, velocityY, absoluteX, absoluteY } = event;
      //orchestrate line drag

      // if (velocityX > 150 || velocityY > 150) return;

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
        connections.forEach((v, i) => {
          if (i > activePath.value.split(">").length - 1) {
            v.x1.value = absoluteX;
            v.y1.value = absoluteY;
          }
        });
        hoveredIndex.value !== -1 && (hoveredIndex.value = -1);
      } catch (index) {
        onHoverIn({ index, event });
      }
    })
    .onEnd((event) => {
      return;
      //snap back animated line
      // const { x, y } = origin(top, left, height, width);
      // const [cx, cy] = [connections[0].x1.value, connections[0].y1.value];

      connections.forEach((v, i) => {
        v.x1.value = withSpring(gestureOriginX.value);
        v.y1.value = withSpring(gestureOriginY.value);
        //   if (i > activePath.value.split(">").length) {
        //     v.x1.value = withClamp(
        //       { min: Math.min(cx, x), max: Math.max(cx, x) },
        //       withSpring(x)
        //     );
        //     v.y1.value = withClamp(
        //       { min: Math.min(cy, y), max: Math.max(cy, y) },
        //       withSpring(y)
        //     );
        //   }
      });
      activePath.value = "";
      // onEnd &&
      //   onEnd({
      //     event,
      //     ...props,
      //     ...common,
      //   });
    });

  return (
    <GestureHandlerRootView>
      <ConnectionHandler
        connections={connections}
        activePath={activePath}
        maxNesting={maxNesting}
      />
      <View className="flex flex-1 justify-center items-center">
        <GestureDetector gesture={pan}>{children}</GestureDetector>
        <View className=" flex flex-row gap-2 flex-wrap w-1/2 items-center justify-center">
          {buttons.map((v, i, a) => (
            <NumberSlot
              buttons={buttons}
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
              // onStart={(args) => {}}
              // onUpdate={({ event }) => {}}
              // // onEnd={({ event, index }) => {
              // //   if (hoveredIndex.value !== -1) {
              // //     setCommandChain(
              // //       buttons[hoveredIndex.value].path +
              // //         `>${buttons[hoveredIndex.value].label}`
              // //     );
              // //     hoveredIndex.value = -1;
              // //   }
              // // }}
            />
          ))}
        </View>
      </View>
    </GestureHandlerRootView>
  );
}
