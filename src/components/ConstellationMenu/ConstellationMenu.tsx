import React, { PropsWithChildren, useState } from "react";
import { View } from "react-native";
import {
  useSharedValue,
  SharedValue,
  withSpring,
  useDerivedValue,
  withClamp,
} from "react-native-reanimated";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
  GestureStateChangeEvent,
  PanGestureHandlerEventPayload,
} from "react-native-gesture-handler";
import {
  buttonTypePrefix,
  ConstellationContext,
  ObjectFlatten,
  onHoverIn,
  overlapping,
  pathToArray,
  pathWithoutPins,
  safeId,
  TerminalReject,
  TerminalRemove,
  TerminalUpdate,
} from "@/app/utilities/math";
import {
  ConnectionInterface,
  ConstellationButton,
  ConstellationProps,
  FlattenedButton,
} from "./types";
import ConnectionHandler from "./ConnectionHandler";
import NumberSlot from "./NumberSlots";
import ConstellationPathElement from "./ConstellationPathElement";

export default function ConstellationMenu({
  children,
  schema,
  maxVelocity,
}: ConstellationProps) {
  // const [commandChain, setCommandChain] = useState("");
  const activePath: SharedValue<string> = useSharedValue("root");
  const [buttons, setButtons] = useState<FlattenedButton[]>(
    ObjectFlatten(schema).map((v) => ({
      ...v,
      top: useSharedValue(0),
      left: useSharedValue(0),
      height: useSharedValue(0),
      width: useSharedValue(0),
      visible: useDerivedValue(() =>
        activePath.value.includes(pathToArray(v.path).reverse()[0])
      ),
      active: useDerivedValue(() => activePath.value.includes(v.id)),
      ref: React.createRef(),
    }))
  );

  const longestPath =
    buttons.map((v) => v.path.split(">").length).sort((a, b) => b - a)[0] + 1 ||
    1;
  const totalPins = buttons.reduce(
    (acc, curr) => acc + (curr.type !== "default" ? 1 : 0),
    0
  );

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
  const hoveredIndex: SharedValue<number> = useSharedValue(
    Object.keys(buttons).length + 1
  );

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
      const { velocityX, velocityY, absoluteX, absoluteY } = event;
      //orchestrate line drag

      try {
        if (velocityX <= maxVelocity && velocityY <= maxVelocity) {
          buttons.forEach((button, index) => {
            const { top, left, height, width, visible } = button;
            if (!visible.value) {
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
        }
        connections.forEach((v, i) => {
          if (i > activePath.value.split(">").length - 1) {
            v.x1.value = absoluteX;
            v.y1.value = absoluteY;
          }
        });
        hoveredIndex.value !== -1 && (hoveredIndex.value = -1);
        // lastHoveredIndex.value !== -1 && (lastHoveredIndex.value = -1);
      } catch (index) {
        onHoverIn({
          index,
          event,
          buttons,
          connections,
          hoveredIndex,
          maxConnections,
          activePath,
          dictLookup,
        });
      }
    })
    .onEnd((event) => {
      activePath.value = "root";
      lastHoveredIndex.value = -1;
      //snap back animated line
      // const { x, y } = origin(top, left, height, width);
      // const [cx, cy] = [connections[0].x1.value, connections[0].y1.value];

      connections.forEach((v, i) => {
        // v.x1.value = withSpring(gestureOriginX.value);
        // v.y1.value = withSpring(gestureOriginY.value);
        //   if (i > activePath.value.split(">").length) {
        v.x1.value = withSpring(gestureOriginX.value, {
          overshootClamping: true,
        });

        v.y1.value = withSpring(gestureOriginY.value, {
          overshootClamping: true,
        });
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
    <ConstellationContext.Provider
      value={{
        buttons,
        activePath,
        hoveredIndex,
        connections,
        gestureOriginX,
        gestureOriginY,
      }}
    >
      <GestureHandlerRootView>
        {/* {Boolean(pathElement) && (
        <ConstellationPathElement pathElement={pathElement} activePath={acti}/>
        )} */}
        <ConnectionHandler />
        <View className="flex flex-1 justify-center items-center">
          <GestureDetector gesture={pan}>{children}</GestureDetector>
          <View className=" flex flex-row gap-2 flex-wrap w-1/2 items-center justify-center">
            {buttons.map((v, i, a) => (
              <NumberSlot index={i} key={i} ref={v.ref} buttonData={v} />
            ))}
          </View>
        </View>
      </GestureHandlerRootView>
    </ConstellationContext.Provider>
  );
}
