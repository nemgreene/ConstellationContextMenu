// import { Link } from "expo-router";
// import React, { RefObject, useEffect, useRef, useState } from "react";
// import { Button, Text, View } from "react-native";
// import { useSafeAreaInsets } from "react-native-safe-area-context";
// import StyledButton from "@/styled/StyledButton";
// import Animated, {
//   useSharedValue,
//   SharedValue,
//   useAnimatedStyle,
//   useAnimatedProps,
//   withTiming,
//   withSpring,
//   useAnimatedReaction,
//   runOnJS,
// } from "react-native-reanimated";
// import {
//   Gesture,
//   GestureDetector,
//   GestureHandlerRootView,
// } from "react-native-gesture-handler";
// import { StyleSheet, Dimensions } from "react-native";
// import Svg, { Line, Circle } from "react-native-svg";
// import NumberSlot from "@/components/NumberSlots";
// import {
//   AnimatedInput,
//   AnimatedLine,
//   AnimatedText,
// } from "@/components/AnimatedComponents";

// const schema = {
//   otherProps: "otherProps",
//   label: "home",
//   otherProps2: "otherProps2",
//   buttons: [
//     {
//       label: "Button1",
//       buttons: [
//         { label: "ChildButton1", onClick: () => {} },
//         { label: "ChildButton2", buttons: [{ label: "subChild" }] },
//         { label: "ChildButton3" },
//       ],
//     },
//     { label: "Button2" },
//     { label: "Button3" },
//   ],
// };

// const ObjectFlatten = (obj, path = "root") => {
//   const flat = [];

//   const recurs = (obj, path) => {
//     const append = Object.keys(obj).reduce((acc, curr) => {
//       if (typeof obj[curr] !== "object") {
//         return { ...acc, [curr]: obj[curr] };
//       }
//       if (Array.isArray(obj[curr])) {
//         recurs(obj[curr], path + (obj.label ? `>${obj.label}` : ""));
//         return { ...acc, [curr]: obj[curr].length };
//       }
//       return recurs(obj[curr], path + (obj.label ? `>${obj.label}` : ""));
//     }, {});
//     if (append) flat.push({ ...append, path });
//   };

//   recurs(obj, path);
//   return flat;
// };

// // console.log([1, 2, 3, 4]);

// export default function ConstellationMenu() {
//   const [buttons, setButtons] = useState(ObjectFlatten(schema));

//   const origin: {
//     x: SharedValue<number>;
//     y: SharedValue<number>;
//   } = {
//     x: useSharedValue(100),
//     y: useSharedValue(100),
//   };
//   const [targets, setTargets] = useState<
//     { x: SharedValue<number>; y: SharedValue<number>; id: String }[]
//   >([
//     {
//       id: "1",
//       x: useSharedValue(0),
//       y: useSharedValue(0),
//     },
//     {
//       id: "2",
//       x: useSharedValue(0),
//       y: useSharedValue(0),
//     },
//   ]);

//   const animatedProps = useAnimatedProps(() => ({
//     x1: targets[0].x.value,
//     y1: targets[0].y.value,
//     x2: origin.x.value,
//     y2: origin.y.value,
//   }));

//   const refs: any[] = React.useMemo(
//     () => Object.keys(buttons).map((item) => ({ ref: React.createRef() })),
//     []
//   );

//   const activePath: SharedValue<string> = useSharedValue("root>home>Button1");

//   const hoveredIndex: SharedValue<number> = useSharedValue(
//     Object.keys(buttons).length + 1
//   );

//   return (
//     <GestureHandlerRootView>
//       <View className="z-50 absolute w-full h-full pointer-events-none">
//         <Svg
//           className="w-full h-full pointer-events-none"
//           style={[StyleSheet.absoluteFill, { height: "100%", width: "100%" }]}
//         >
//           <AnimatedLine
//             animatedProps={animatedProps}
//             stroke={"red"}
//             strokeWidth={"2px"}
//           />
//         </Svg>
//       </View>
//       <View className="flex flex-1 justify-center items-center">
//         <View className=" flex flex-col gap-2 flex-wrap w-1/2">
//           {buttons
//             .sort((a, b) => a.path.length - b.path.length)
//             .reverse()
//             .map((v, i, a) => (
//               <NumberSlot
//                 buttons={refs}
//                 targets={targets}
//                 index={i}
//                 key={i}
//                 ref={refs[i]}
//                 activePath={activePath}
//                 elementPath={v.path}
//                 hoveredIndex={hoveredIndex}
//                 label={v.label && v.label.toString()}
//                 onHoverIn={({ event, index }) => {
//                 //   activePath.value = buttons[index].path;
//                 }}
//                 onHoverOut={(args) => {
//                   hoveredIndex.value = Object.keys(buttons).length;
//                 }}
//                 onStart={(args) => {
//                   origin.x.value = args.origin.x;
//                   origin.y.value = args.origin.y;
//                 }}
//                 onUpdate={({ event }) => {
//                   const { absoluteX, absoluteY } = event;
//                   //orchestrate line drag
//                   targets[0].x.value = absoluteX;
//                   targets[0].y.value = absoluteY;
//                 }}
//                 onEnd={({ event, index }) => {
//                   hoveredIndex.value = Object.keys(buttons).length;
//                 }}
//               />
//             ))}
//         </View>
//       </View>
//     </GestureHandlerRootView>
//   );
// }

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
import ButtonSlot from "../ButtonSlot";

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
            <ButtonSlot
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
