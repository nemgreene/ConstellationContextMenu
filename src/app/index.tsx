import { View, Text } from "react-native";
import React from "react";
import ConstellationMenu from "@/components/ConstellationMenu/ConstellationMenu";

const Page = () => {
  return (
    <View className="w-full h-full">
      <ConstellationMenu>
        <View className="p-4 bg-slate-600">
          <Text>GestureStart</Text>
        </View>
      </ConstellationMenu>
    </View>
  );
};

export default Page;
