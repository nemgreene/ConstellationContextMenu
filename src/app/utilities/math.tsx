import { RefObject } from "react";

interface OverlappingProps {
  x: number;
  y: number;
  width: number;
  height: number;
  mx: number;
  my: number;
}
//check if absolute mouse position is overlapping with an element

export const overlapping = ({
  x,
  y,
  width,
  height,
  mx,
  my,
}: OverlappingProps): boolean => {
  return mx >= x && mx <= x + width && my >= y && my <= y + height;
};

export const orign = (ref: RefObject<any>): { x: number; y: number } => {
  if (!ref.current.getBoundingClientRect) {
    return { x: 0, y: 0 };
  }
  const { width, height, top, left } = ref.current.getBoundingClientRect();
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
