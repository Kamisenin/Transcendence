export function hexToInt(hex: string): number {
    return parseInt(hex.replace("#", ""), 16);
}

export function intToHex(colorInt: number | null | undefined): string {
    if (colorInt == null) return "#3b82f6";
    return `#${colorInt.toString(16).padStart(6, "0")}`;
}