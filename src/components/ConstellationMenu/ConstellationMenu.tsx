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
import {
  filterPath,
  modifiers,
  ObjectFlatten,
  origin,
  overlapping,
  pathToArray,
  pathWithoutPins,
  rebindConnections,
  removeIdFromPath,
  safeId,
  TerminalUpdate,
} from "@/app/utilities/math";
import { adaptViewConfig } from "react-native-reanimated/lib/typescript/ConfigHelper";
import {
  ConnectionInterface,
  ConstellationButton,
  FlattenedButton,
} from "./types";
import ConnectionHandler from "./ConnectionHandler";
import NumberSlot from "./NumberSlots";

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
  { label: "Button3 (Pin)", pin: true },
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
      visible: useSharedValue(false),
      ref: React.createRef(),
    }))
  );

  const longestPath =
    buttons.map((v) => v.path.split(">").length).sort((a, b) => b - a)[0] + 1 ||
    1;
  const totalPins = buttons.reduce((acc, curr) => acc + (curr.pin ? 1 : 0), 0);

  const maxConnections = longestPath + totalPins;

  //inverted chain of connections to draw
  //connection 0(x1, y1) is always bound to mouse
  //connection 0(x2, y2) bound to most recent chaining
  //all further connections are synamic
  const connections: ConnectionInterface[] = new Array(maxConnections + 1)
    .fill("")
    .map((v, i) => ({
      index: i,
      x1: useSharedValue(0),
      y1: useSharedValue(0),
    }));

  const dictLookup: { [key: string]: FlattenedButton } = buttons
    .map((v, i) => ({ ...v }))
    .reduce((acc, curr) => ({ ...acc, [curr.id]: curr }), {});

  const lastHoveredIndex: SharedValue<number> = useSharedValue(-1);
  const activePins: SharedValue<number> = useSharedValue(0);
  const activePath: SharedValue<string> = useSharedValue("root");
  const hoveredIndex: SharedValue<number> = useSharedValue(
    Object.keys(buttons).length + 1
  );

  const onHoverIn = (args) => {
    "worklet";
    const {
      index,
      event: { absoluteX, absoluteY },
    } = args;
    const { path, pin, id } = buttons[index];
    const pathArray = pathToArray(activePath.value);
    try {
      //If not new button, escape out
      if (hoveredIndex.value === index) {
        throw "Reject";
      }
      //if at max depth, do nothing
      if (pathArray.length >= maxConnections) {
        throw "Reject";
      }

      //If button in the path
      if (activePath.value.includes(id)) {
        // if pinned, the button cannot be removed
        if (pin) {
          throw "Reject";
        }
        // else, pass to the catch to see if the id can be rmoved
        throw "Remove";
      }

      const newPath = activePath.value + `>${pin ? "$" : ""}${id}`;

      //Finally, handle adding new buttons to the chain
      if (pathArray.length === 1) {
        // at root
        console.log("Flagging to update");
        activePath.value = newPath;
        console.log(activePath.value, newPath);
        TerminalUpdate({
          activePath,
          buttons,
          index,
          connections,
          absoluteX,
          absoluteY,
          hoveredIndex,
        });
        return;
      }

      const lastButtonId = pathToArray(activePath).reverse()[0];
      const { path: previousPath, pin: previousPin } =
        dictLookup[safeId(lastButtonId)];
      const previousDepth = pathToArray(pathWithoutPins(previousPath)).length;

      const hoveredDepth = pathToArray(path).length;

      //If button hovered is less shallow then previous, standard proceedure
      if (previousDepth < hoveredDepth) {
        activePath.value = newPath;
        TerminalUpdate({
          activePath,
          buttons,
          index,
          connections,
          absoluteX,
          absoluteY,
          hoveredIndex,
        });
        return;
      }

      //If these are siblings
      if (previousDepth === hoveredDepth) {
        // if either are pins, add to path
        if (pin || previousPin) {
          activePath.value = newPath;
          TerminalUpdate({
            activePath,
            buttons,
            index,
            connections,
            absoluteX,
            absoluteY,
            hoveredIndex,
          });
          return;
        }
        //else replace siblings in path
        activePath.value = [...pathToArray(activePath).slice(0, -1), id].join(
          ">"
        );
        hoveredIndex.value = index;
        TerminalUpdate({
          activePath,
          buttons,
          index,
          connections,
          absoluteX,
          absoluteY,
          hoveredIndex,
        });
        return;
      }
      //finally, if the hovered depth is more shallow
      activePath.value = path;

      throw "Reject";
    } catch (execution) {
      const pathArray = pathToArray(activePath);
      let hoveredDepth = pathToArray(activePath).slice(1).length;

      switch (execution) {
        case "Reject":
          connections.forEach((v, i) => {
            if (i > hoveredDepth) {
              v.x1.value = absoluteX;
              v.y1.value = absoluteY;
            }
          });
          break;
        case "Remove":
          //Verify if button can be rmoved from path
          hoveredDepth = pathArray.slice(1).length;
          const targetDepth = pathArray.indexOf(id);
          // if id not in path (should be impossible)
          //or a pin is present later in the chain of command
          if (
            targetDepth === -1 ||
            pathArray.slice(targetDepth).join(">").includes("$")
          ) {
            connections.forEach((v, i) => {
              if (i > hoveredDepth) {
                v.x1.value = absoluteX;
                v.y1.value = absoluteY;
              }
            });
            break;
          }
          activePath.value = pathArray.slice(0, targetDepth).join(">");
        // console.log("removing");
        // filterPath(activePath, id);

        case "Rebind":
          console.log("rebinding");
          //this case is never thrown, but may be hit after the Remove case
          rebindConnections(
            activePath,
            dictLookup,
            connections,
            absoluteX,
            absoluteY
          );
          console.log(activePath.value);
          // hoveredIndex.value = index;
          hoveredIndex.value = index;
          break;
        case "Update":
          hoveredDepth = pathArray.slice(1).length;
          console.log("Update", hoveredDepth, pathArray, activePath.value);
          const { top, left, height, width } = buttons[index];
          const { x, y } = origin(top, left, height, width);
          connections.forEach((v, i) => {
            // anyhthing below hovered depth, should remain the same
            // anything AT hovered depth, should snap to hovered
            // anything above hovered depth is connected to drag
            if (i < hoveredDepth) {
              return;
            }
            if (i === hoveredDepth) {
              v.x1.value = x;
              v.y1.value = y;
              return;
            } else {
              v.x1.value = absoluteX;
              v.y1.value = absoluteY;
            }
          });
        default:
          // console.log("Updating");
          hoveredIndex.value = index;
      }
    }
  };

  const gestureOriginX = useSharedValue(0);
  const gestureOriginY = useSharedValue(0);

  const pan = Gesture.Pan()
    .minDistance(1)
    .onBegin(
      (event: GestureStateChangeEvent<PanGestureHandlerEventPayload>) => {
        gestureOriginX.value = event.absoluteX;
        gestureOriginY.value = event.absoluteY;
        activePath.value = "root";
        // const { x, y } = origin(top, left, height, width);
        connections.forEach((v) => {
          v.x1.value = event.absoluteX;
          v.y1.value = event.absoluteY;
        });
      }
    )

    .onUpdate((event) => {
      const { absoluteX, absoluteY } = event;
      //orchestrate line drag

      // if (velocityX > 150 || velocityY > 150) return;

      try {
        buttons.forEach((button, index) => {
          const { top, left, height, width, visible, path } = button;
          const vis = activePath.value.includes(pathToArray(path).reverse()[0]);
          visible.value != vis && (visible.value = vis);
          if (!vis) {
            return;
          }
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
        // lastHoveredIndex.value !== -1 && (lastHoveredIndex.value = -1);
      } catch (index) {
        onHoverIn({ index, event });
      }
    })
    .onEnd((event) => {
      activePath.value = "root";
      lastHoveredIndex.value = -1;
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
      // onEnd &&
      //   onEnd({
      //     event,
      //     ...props,
      //     ...common,
      //   });
    });

  return (
    <GestureHandlerRootView>
      <ConnectionHandler connections={connections} activePath={activePath} />
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
              buttonData={v}
              hoveredIndex={hoveredIndex}
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
