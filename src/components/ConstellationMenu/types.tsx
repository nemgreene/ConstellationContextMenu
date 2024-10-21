import { MutableRefObject, PropsWithChildren, RefObject } from "react";
import {
  GestureStateChangeEvent,
  PanGestureHandlerEventPayload,
} from "react-native-gesture-handler";
import { HoverGestureHandlerEventPayload } from "react-native-gesture-handler/lib/typescript/handlers/gestures/hoverGesture";
import { SharedValue } from "react-native-reanimated";
import { GestureHandlerEvent } from "react-native-reanimated/lib/typescript/reanimated2/hook";

export type ConstellationButtonType = "default" | "pin" | "modifier";
export type ConstellationButtonPrefix = "" | "$" | "&";
export type ConstellationButtonTypeLookup = Record<
  ConstellationButtonType,
  ConstellationButtonPrefix
>;

export interface ConstellationProps extends PropsWithChildren {
  schema: ConstellationButton[];
  maxVelocity?: number;
  pathElement: any;
}

export interface ConnectionInterface {
  x1: SharedValue<number>;
  y1: SharedValue<number>;
  index: number;
}

export interface CommonButtonProps {
  label: string;
  onClick?: () => void;
}

export interface ConstellationButton extends CommonButtonProps {
  buttons?: any[];
  type?: ConstellationButtonType;
  onExecute?: (value: any, context: any) => any;
}

export interface FlattenedButton extends CommonButtonProps {
  id: any;
  buttons?: any[];
  path: string;
  index: number;
  top: SharedValue<number>;
  left: SharedValue<number>;
  height: SharedValue<number>;
  width: SharedValue<number>;
  visible: SharedValue<boolean>;
  active: SharedValue<boolean>;
  ref: RefObject<any>;
  type: ConstellationButtonType;
}

export interface NumberSlotProps {
  buttonData: FlattenedButton;
  index: number;
  // onHoverIn?: (args: InjectionContext) => void;
  // onHoverOut?: (args: InjectionContext) => void;
}
export interface CommonInjectionContext {
  activePath: SharedValue<string>;
  active: SharedValue<boolean>;
  visible: SharedValue<boolean>;
  top: SharedValue<number>;
  left: SharedValue<number>;
  height: SharedValue<number>;
  width: SharedValue<number>;
  buttonData: FlattenedButton;
}

export interface InjectionContext
  extends NumberSlotProps,
    CommonInjectionContext {
  event:
    | GestureStateChangeEvent<PanGestureHandlerEventPayload>
    | GestureHandlerEvent<PanGestureHandlerEventPayload>
    | GestureHandlerEvent<HoverGestureHandlerEventPayload>;
}
