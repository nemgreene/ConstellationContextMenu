import { View, Text, Pressable } from "react-native";
import React from "react";

interface ButtonProps {
  title: String;
  className: String;
}
const StyledButton = ({ title = "Default title", className = "" }) => {
  return (
    <Pressable className={"bg-sky-700 px-5 py-2 rounded" + className}>
      <Text className="text-cyan-200">{title}</Text>
    </Pressable>
  );
};

export default StyledButton;
