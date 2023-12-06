import GuildGirl from "@assets/portraits/AdventurersGuildGirl.svg"; 
import Grocery from "@assets/portraits/GroceryStore.svg";

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

export function portrait(portrait: Portrait): { img: ImageMetadata, bg: string, darkBg: string } {
    const { img, bg } = portraits[portrait];
    const darkBg = `#${(parseInt(bg.replace("#", "0x")) - 0xb1b8b8).toString(16)}`;
    return { img, bg, darkBg };
}