import React from "react";
import { View, Text, StyleSheet, TextInput, Button } from "react-native";
import Animated, {
  useAnimatedProps,
  useAnimatedRef,
  useAnimatedStyle,
  useDerivedValue,
  useScrollViewOffset,
} from "react-native-reanimated";
import type { DerivedValue } from "react-native-reanimated";

export default function ConstellationPathElement() {
  const animatedRef = useAnimatedRef<Animated.ScrollView>();
  // highlight-start
  const offset = useScrollViewOffset(animatedRef);
  const text = useDerivedValue(() => `${offset.value.toFixed(1)}`);
  // highlight-end
  const [isScrollHorizontal, setIsScrollHorizontal] =
    React.useState<boolean>(false);

  return (
    <View style={styles.container}>
      <AnimatedText text={text} />
      <Animated.ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        ref={animatedRef}
        horizontal={isScrollHorizontal}
      >
        {Array.from({ length: 10 }).map((_, i) => (
          <View key={i} style={styles.box}>
            <Text style={styles.center}>{i}</Text>
          </View>
        ))}
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  scroll: {
    borderWidth: 1,
    borderColor: "gray",
    height: 250,
    width: 250,
    margin: 20,
  },
  scrollContent: {
    alignItems: "center",
  },
  box: {
    width: 100,
    height: 100,
    margin: 10,
    borderRadius: 15,
    backgroundColor: "#b58df1",
    alignItems: "center",
    justifyContent: "center",
  },
  center: {
    textAlign: "center",
  },
});

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);
Animated.addWhitelistedNativeProps({ text: true, value: true });

function AnimatedText({ text, ...props }: { text: DerivedValue<string> }) {
  const animatedProps = useAnimatedProps(() => ({
    text: text.value,
    value: text.value,
    placeholder: `Box width: ${text.value}`,
  }));
  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: Number(text.value) < 200 ? "red" : "blue",
  }));
  return (
    <AnimatedTextInput
      readOnly={true}
      {...props}
      value={text.value}
      style={[animatedStyle]}
      animatedProps={animatedProps}
    />
  );
}
