import { Layout, Rect } from "@motion-canvas/2d"
import { Color, Reference } from "@motion-canvas/core"

export function pos_topleft_within(ref: Reference<Layout>, i: number, offset: number) {
    return () => ref().topLeft().addX(i * offset)
}

export function pos_bottomleft_within(ref: Reference<Layout>, i: number, offset: number) {
    return () => ref().bottomLeft().addX(i * offset)
}

export function create_outline(
    target_node: Reference<Layout>,
    output_ref: Reference<Rect>,
    stroke: Color | string,
    margin: number,
    opacity: number = 1){
    return (<Rect
        ref={output_ref}
        stroke={stroke}
        lineWidth={6}
        radius={8}
        opacity={opacity}
        position={() => target_node().position()}
        width={() => target_node().width() + 2*margin}
        height={() => target_node().height() + 2*margin}
    />);
}