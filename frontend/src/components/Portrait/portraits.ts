import GuildGirl from "@assets/portraits/AdventurersGuildGirl.svg";
import FishShop from "@assets/portraits/FishShop.svg";
import Grocery from "@assets/portraits/GroceryStore.svg";
import { bgToDark } from "src/utils/colors";

export const colors = {
  purple: "#ede9fe",
  green: "#d1fae5",
  red: "#fecaca",
  yellow: "#fef8c3",
  orange: "#ffedd5",
  blue: "#e0f2fe",
  pink: "#fbcfe8",
  gray: "#e5e7eb",
};

const portraits = {
  "guild-girl": {
    img: GuildGirl,
    bg: colors.purple,
  },
  grocery: {
    img: Grocery,
    bg: colors.green,
  },
  "fish-shop": {
    img: FishShop,
    bg: colors.blue,
  },
};

export type Portrait = keyof typeof portraits;

export function portrait(portrait: Portrait): {
  img: ImageMetadata;
  bg: string;
  bgDark: string;
} {
  const { img, bg } = portraits[portrait];
  const bgDark = bgToDark(bg);
  return { img, bg, bgDark };
}
