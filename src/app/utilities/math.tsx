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
  return mx >= x && mx <= x + width && my >= y && mx <= y + height;
};
