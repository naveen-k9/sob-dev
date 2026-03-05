import { Dimensions } from "react-native";
import { SCREEN_PADDING } from "@/src/ui/layout";
import { scale } from "@/src/ui/responsive";

export const CARD_GAP = scale(9);

const screenWidth = Dimensions.get("window").width;
export const CARD_WIDTH =
  (screenWidth - SCREEN_PADDING * 2 - CARD_GAP) / 2;
