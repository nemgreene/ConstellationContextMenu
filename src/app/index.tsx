import { View, Text, TextInput } from "react-native";
import React, { useRef } from "react";
import ConstellationMenu from "@/components/ConstellationMenu/ConstellationMenu";
import { ConstellationButton } from "@/components/ConstellationMenu/types";

const Page = () => {
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
    { label: "Button2 (Pin)", type: "pin" },
    { label: "Button3 (Pin)", type: "pin" },
    { label: "Button4 (Modifier)", type: "modifier" },
  ];

  const onExecute = (value, context) => {
    console.log(value, context);
    return context + value;
  };

  return (
    <View className="w-full h-full">
      <ConstellationMenu
        maxVelocity={10000}
        pathElement={({ children }) => (
          <View className="p-4 bg-slate-900">{children}</View>
        )}
        // pathRef={pathRef}
        schema={[
          { label: "1", type: "pin", onExecute },
          { label: "2", type: "pin", onExecute },
          { label: "3", type: "pin", onExecute },
          { label: "4", type: "pin", onExecute },
          { label: "5", type: "pin", onExecute },
          { label: "6", type: "pin", onExecute },
          { label: "7", type: "pin", onExecute },
          { label: "8", type: "pin", onExecute },
          { label: "9", type: "pin", onExecute },
        ]}
        // schema={schema}
      >
        <View className="p-4 bg-slate-600">
          <Text>GestureStart</Text>
        </View>
      </ConstellationMenu>
    </View>
  );
};

export default Page;
