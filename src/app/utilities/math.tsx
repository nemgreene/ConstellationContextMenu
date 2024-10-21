import {
  ConnectionInterface,
  ConstellationButtonPrefix,
  ConstellationButtonType,
  ConstellationButtonTypeLookup,
  FlattenedButton,
} from "@/components/ConstellationMenu/types";
import { createContext, RefObject, useContext } from "react";
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

const typeLookup: ConstellationButtonTypeLookup = {
  default: "",
  pin: "$",
  modifier: "&",
};

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
  "worklet";
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
          // label: obj.label + ` ${obj.id.split("-").slice(-1)}`,
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
    .filter((v) => !v.includes(id))
    .join(">");
};

export const safeId = (id: string): string => {
  "worklet";
  return id
    .split("")
    .filter((v) => v !== "$" && v !== "&")
    .join("");
};

export const buttonTypePrefix = (
  type: ConstellationButtonType
): ConstellationButtonPrefix => {
  "worklet";
  return typeLookup[type] || "";
};

export const pathWithoutPins = (path: string): string => {
  "worklet";
  //pins are denoted with a $, modifiers an &
  return pathToArray(path)
    .filter((v) => !v.includes("$") || !v.includes("&"))
    .join(">");
};

export const ConstellationContext = createContext(null);

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
  //this case is never thrown, but may be hit after the Remove case
  rebindConnections(activePath, dictLookup, connections, absoluteX, absoluteY);
  // hoveredIndex.value = index;
  hoveredIndex.value = index;
};
export const TerminalReject = ({
  connections,
  hoveredDepth,
  absoluteX,
  absoluteY,
}) => {
  "worklet";
  connections.forEach((v, i) => {
    if (i > hoveredDepth) {
      v.x1.value = absoluteX;
      v.y1.value = absoluteY;
    }
  });
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
  type,
}: {
  activePath: any;
  dictLookup: any;
  connections: any;
  absoluteX: any;
  absoluteY: any;
  hoveredIndex: any;
  index: any;
  id: string;
  type: ConstellationButtonType;
}) => {
  "worklet";
  //Verify if button can be rmoved from path
  const pathArray = pathToArray(activePath);
  const hoveredDepth = pathArray.slice(1).length;
  const lookupId = `${buttonTypePrefix(type)}${id}`;
  const targetDepth = pathArray.indexOf(lookupId);
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
  // activePath.value = pathArray.slice(0, targetDepth).join(">");
  filterPath(activePath, id);
  TerminalRebind({
    activePath,
    dictLookup,
    connections,
    absoluteX,
    absoluteY,
    hoveredIndex,
    index,
  });
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

export const onHoverIn = (args) => {
  "worklet";
  const {
    index,
    event: { absoluteX, absoluteY },
    buttons,
    connections,
    hoveredIndex,
    maxConnections,
    activePath,
    dictLookup,
  } = args;
  const { path, type, id } = buttons[index];
  const pathArray = pathToArray(activePath.value);
  let hoveredDepth = pathToArray(activePath).slice(1).length;
  //If not new button, escape out
  //if at max depth, do nothing
  if (hoveredIndex.value === index || pathArray.length >= maxConnections) {
    return TerminalReject({
      connections,
      hoveredDepth,
      absoluteX,
      absoluteY,
    });
  }

  //If button in the path
  if (activePath.value.includes(id)) {
    // if pinned, the button cannot be removed
    if (type === "pin") {
      return TerminalReject({
        connections,
        hoveredDepth,
        absoluteX,
        absoluteY,
      });
    }
    // else, pass to the catch to see if the id can be rmoved
    // throw "Remove";
    return TerminalRemove({
      activePath,
      dictLookup,
      connections,
      absoluteX,
      absoluteY,
      hoveredIndex,
      index,
      id,
      type,
    });
  }

  const newPath = activePath.value + `>${buttonTypePrefix(type)}${id}`;
  //Finally, handle adding new buttons to the chain
  if (pathArray.length === 1) {
    // at root
    activePath.value = newPath;
    // hoveredIndex.value = index;
    return TerminalUpdate({
      activePath,
      buttons,
      index,
      connections,
      absoluteX,
      absoluteY,
      hoveredIndex,
    });
  }

  const lastButtonId = pathToArray(activePath).reverse()[0];
  const { path: previousPath, type: previousType } =
    dictLookup[safeId(lastButtonId)];
  const previousDepth = pathToArray(pathWithoutPins(previousPath)).length;

  hoveredDepth = pathToArray(path).length;

  //If button hovered is less shallow then previous, standard proceedure
  if (previousDepth < hoveredDepth) {
    activePath.value = newPath;
    return TerminalUpdate({
      activePath,
      buttons,
      index,
      connections,
      absoluteX,
      absoluteY,
      hoveredIndex,
    });
  }

  //If these are siblings
  if (previousDepth === hoveredDepth) {
    // if either are pins/modifiers, add to path
    if (type === "pin" || previousType === "pin") {
      activePath.value = newPath;
      return TerminalUpdate({
        activePath,
        buttons,
        index,
        connections,
        absoluteX,
        absoluteY,
        hoveredIndex,
      });
    }
    if (type === "modifier" || previousType === "modifier") {
      activePath.value = newPath;
      return TerminalUpdate({
        activePath,
        buttons,
        index,
        connections,
        absoluteX,
        absoluteY,
        hoveredIndex,
      });
    }
    //else replace siblings in path
    activePath.value = [...pathToArray(activePath).slice(0, -1), id].join(">");
    hoveredIndex.value = index;
    return TerminalUpdate({
      activePath,
      buttons,
      index,
      connections,
      absoluteX,
      absoluteY,
      hoveredIndex,
    });
  }
  //finally, if the hovered depth is more shallow
  activePath.value = path;
  return TerminalReject({
    connections,
    hoveredDepth,
    absoluteX,
    absoluteY,
  });
};
