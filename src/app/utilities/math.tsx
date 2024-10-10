import {
  ConnectionInterface,
  FlattenedButton,
} from "@/components/ConstellationMenu/types";
import { RefObject } from "react";
import { SharedValue } from "react-native-reanimated";
import uuid from "react-native-uuid";

interface OverlappingProps {
  top: number;
  left: number;
  width: number;
  height: number;
  mouseX: number;
  mouseY: number;
}
//check if absolute mouse position is overlapping with an element

function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

export const overlapping = ({
  top,
  left,
  width,
  height,
  mouseX,
  mouseY,
}: OverlappingProps): boolean => {
  "worklet";
  return (
    mouseX >= left &&
    mouseX <= left + width &&
    mouseY >= top &&
    mouseY <= top + height
  );
};

export const origin = (
  top: SharedValue<number>,
  left: SharedValue<number>,
  height: SharedValue<number>,
  width: SharedValue<number>
): { x: number; y: number } => {
  return { x: left.value + width.value / 2, y: top.value + height.value / 2 };
};

export const ObjectFlatten = (obj, path = "root") => {
  const flat = [];

  const recurs = (obj, path) => {
    if (!Array.isArray(obj) && typeof obj === "object") {
      obj.id = uuid.v4();
    }
    const append = Object.keys(obj).reduce((acc, curr) => {
      // const pathAppend = obj.label ? `>${obj.label}` : "";
      const pathAppend = obj.id ? `>${obj.id}` : "";

      if (typeof obj[curr] !== "object") {
        return {
          ...acc,
          [curr]: obj[curr],
          label: obj.label + ` ${obj.id.split("-").slice(-1)}`,
        };
      }

      if (Array.isArray(obj[curr])) {
        recurs(obj[curr], path + pathAppend);
        return { ...acc, [curr]: obj[curr].length };
      }

      return recurs(obj[curr], path + pathAppend);
    }, {});
    if (append) flat.push({ ...append, path });
  };

  recurs(obj, path);
  return flat.sort((a, b) => a.path.length - b.path.length);
  // .map((v, i) => ({ ...v}));
};

export const modifiers = (activePath: string): string[] => {
  "worklet";
  return activePath.split(">").filter((v) => v.includes("$"));
};

export const removeIdFromPath = (
  path: SharedValue<string>,
  id: string
): string => {
  "worklet";
  return path.value
    .split(">")
    .filter((v) => v !== id)
    .join(">");
};

export const pathToArray = (path: SharedValue<string> | string): string[] => {
  "worklet";
  return typeof path === "string" ? path.split(">") : path.value.split(">");
};
export const filterPath = (path: SharedValue<string>, id: string) => {
  "worklet";
  path.value = pathToArray(path)
    .filter((v) => v !== id)
    .join(">");
};

export const safeId = (id: string): string => {
  "worklet";
  return id
    .split("")
    .filter((v) => v !== "$")
    .join("");
};

export const pathWithoutPins = (path: string): string => {
  "worklet";
  return pathToArray(path)
    .filter((v) => !v.includes("$"))
    .join(">");
};

//Animate along the strands to rebind the connection location to the origin of the button by label as found on the path
export const rebindConnections = (
  activePath: SharedValue<string>,
  dictLookup: { [key: string]: FlattenedButton },
  connections: ConnectionInterface[],
  absoluteX: number,
  absoluteY: number
): void => {
  "worklet";
  const pathArray = pathToArray(activePath);
  connections.forEach((v, i) => {
    if (i === 0) {
      return;
    }
    // if (i < pathArray.length - 1) {
    const lookup = pathArray[i] ? safeId(pathArray[i]) : undefined;
    console.log(pathArray, i, lookup);
    if (lookup) {
      const { top, left, height, width } = dictLookup[lookup];
      const { x, y } = origin(top, left, height, width);
      connections[i].x1.value = x;
      connections[i].y1.value = y;
      return;
    }
    // }
    v.x1.value = absoluteX;
    v.y1.value = absoluteY;
  });
  return;
};
export const TerminalRebind = ({
  activePath,
  dictLookup,
  connections,
  absoluteX,
  absoluteY,
  hoveredIndex,
  index,
}) => {
  "worklet";
  console.log("rebinding");
  //this case is never thrown, but may be hit after the Remove case
  rebindConnections(activePath, dictLookup, connections, absoluteX, absoluteY);
  // hoveredIndex.value = index;
  hoveredIndex.value = index;
};
export const TerminalRemove = ({
  activePath,
  dictLookup,
  connections,
  absoluteX,
  absoluteY,
  hoveredIndex,
  index,
  id,
}) => {
  //Verify if button can be rmoved from path
  const pathArray = pathToArray(activePath);
  const hoveredDepth = pathArray.slice(1).length;
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
    return;
  }
  activePath.value = pathArray.slice(0, targetDepth).join(">");
  TerminalRebind({
    activePath,
    dictLookup,
    connections,
    absoluteX,
    absoluteY,
    hoveredIndex,
    index,
  });
  // console.log("removing");
  // filterPath(activePath, id);
};

export const TerminalUpdate = ({
  activePath,
  buttons,
  index,
  connections,
  absoluteX,
  absoluteY,
  hoveredIndex,
}): void => {
  "worklet";
  const pathArray = pathToArray(activePath);
  const hoveredDepth = pathArray.slice(1).length;
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
  hoveredIndex.value = index;
};
