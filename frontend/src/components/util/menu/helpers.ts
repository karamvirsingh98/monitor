import s from "./Menu.module.css";

export type Position =
  | "left"
  | "right"
  | "right center"
  | "bottom"
  | "bottom right";

export function getPositionClass(
  position: Position = "bottom"
) {
  switch (position) {
    case "left":
      return s.Left;
    case "right":
      return s.Right;
    case "right center":
      return s.RightCenter;
    case "bottom":
      return s.Bottom;
    case "bottom right":
      return s.BottomRight;
  }
}
