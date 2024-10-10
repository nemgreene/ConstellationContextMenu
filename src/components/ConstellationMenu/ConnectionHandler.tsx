import { View, Text, StyleSheet } from "react-native";
import React from "react";
import Svg, { Defs, LinearGradient, Polyline, Stop } from "react-native-svg";
import { AnimatedLine, AnimatedPolyLine } from "../AnimatedComponents";
import { useAnimatedProps } from "react-native-reanimated";

const Connection = ({ connection }) => {
  const animatedProps = useAnimatedProps(() => ({
    x1: connection.x1.value,
    y1: connection.y1.value,
    x2: connection.x2.value,
    y2: connection.y2.value,
  }));
  return (
    <AnimatedLine
      animatedProps={animatedProps}
      stroke={"url(#grad1)"}
      strokeWidth={"2px"}
    />
  );
};

const ConnectionHandler = ({ connections, activePath }) => {
  const polyLineStyle = useAnimatedProps(() => ({
    points: connections.map((v) => `${v.x1.value},${v.y1.value}`).join(" "),
  }));

  return (
    <View className="z-50 absolute w-full h-full pointer-events-none">
      <Svg
        className="w-full h-full pointer-events-none"
        style={[StyleSheet.absoluteFill, { height: "100%", width: "100%" }]}
      >
        <Defs>
          <LinearGradient id="grad1">
            <Stop offset="0%" stopColor="red" />
            <Stop offset="100%" stopColor="blue" />
          </LinearGradient>
        </Defs>
        <AnimatedPolyLine
          stroke={"url(#grad1)"}
          // points="10,10 20,12 30,20 40,60 60,70 95,90"
          // points="40,90 140,190 240,290"
          fill="none"
          animatedProps={polyLineStyle}
          strokeWidth="3"
        />
        {/* {connections.map((v, i) => (
          <Connection key={i} connection={v} />
        ))} */}
      </Svg>
    </View>
  );
};

export default ConnectionHandler;
