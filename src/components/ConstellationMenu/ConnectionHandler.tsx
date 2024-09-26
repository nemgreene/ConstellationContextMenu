import { View, Text, StyleSheet } from "react-native";
import React from "react";
import Svg from "react-native-svg";
import { AnimatedLine } from "../AnimatedComponents";
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
      stroke={"red"}
      strokeWidth={"2px"}
    />
  );
};

const ConnectionHandler = ({ connections, activePath, maxNesting }) => {
  const parsedPath = activePath.value?.split(">").slice(1);
  console.log(parsedPath);

  return (
    <View className="z-50 absolute w-full h-full pointer-events-none">
      <Svg
        className="w-full h-full pointer-events-none"
        style={[StyleSheet.absoluteFill, { height: "100%", width: "100%" }]}
      >
        {connections.map((v, i) => (
          <Connection key={i} connection={v} />
        ))}
      </Svg>
    </View>
  );
};

export default ConnectionHandler;
