import GuildGirl from "@assets/portraits/AdventurersGuildGirl.svg"; 
import Grocery from "@assets/portraits/GroceryStore.svg";
import { bgToDark } from "src/utils/colors";

const portraits = {
    "guild-girl": {
        img: GuildGirl,
        bg: "#ede9fe"
    },
    "grocery": {
        img: Grocery,
        bg: "#D1FAE5"
    }
};

export type Portrait = keyof typeof portraits;

export function portrait(portrait: Portrait): { img: ImageMetadata, bg: string, bgDark: string } {
    const { img, bg } = portraits[portrait];
    const bgDark = bgToDark(bg);
    return { img, bg, bgDark };
}