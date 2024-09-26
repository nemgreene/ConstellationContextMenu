import { RefObject } from "react";

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
  return (
    mouseX >= left &&
    mouseX <= left + width &&
    mouseY >= top &&
    mouseY <= top + height
  );
};

export const origin = (
  top: number,
  left: number,
  height: number,
  width: number
): { x: number; y: number } => {
  return { x: left + width / 2, y: top + height / 2 };
};

export const ObjectFlatten = (obj, path = "root") => {
  const flat = [];

  const recurs = (obj, path) => {
    const append = Object.keys(obj).reduce((acc, curr) => {
      if (typeof obj[curr] !== "object") {
        return { ...acc, [curr]: obj[curr] };
      }
      if (Array.isArray(obj[curr])) {
        recurs(obj[curr], path + (obj.label ? `>${obj.label}` : ""));
        return { ...acc, [curr]: obj[curr].length };
      }
      return recurs(obj[curr], path + (obj.label ? `>${obj.label}` : ""));
    }, {});
    if (append) flat.push({ ...append, path });
  };

  recurs(obj, path);
  return flat
    .sort((a, b) => a.path.length - b.path.length)
    .map((v, i) => ({ ...v, index: i }));
};
