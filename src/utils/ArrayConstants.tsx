

export interface ArrayStyle {
    boxGap : number;
    outlineMargin : number;
    boxWidth : number;
    boxRadius : number;
    boxStrokeWidth : number;
}

export const Style: ArrayStyle = {
    boxGap: 28,
    outlineMargin: 16,
    boxWidth: 128,
    boxRadius: 4,
    boxStrokeWidth: 8,
};

export const boxWidthGap = (Style: ArrayStyle) => Style.boxWidth + Style.boxGap;
