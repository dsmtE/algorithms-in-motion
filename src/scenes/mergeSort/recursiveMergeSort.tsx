import { Circle, FlexContent, FlexItems, Layout, Line, makeScene2D } from "@motion-canvas/2d";
import { Rect, Txt, Node} from "@motion-canvas/2d/lib/components";
import { all, sequence, waitFor } from "@motion-canvas/core/lib/flow";
import { createRefArray, makeRef, range, Reference, ReferenceArray, useRandom, useScene } from "@motion-canvas/core/lib/utils";
import {Color, createRef, createSignal, Spacing} from '@motion-canvas/core';
import { Colors, textStyle } from "@/styles/styles";
import {Style as ArrayStyle, boxWidthGap} from "@/utils/ArrayConstants";
import { sorted_permutation, reverse_index_mapping, zip } from "@/utils/utils";

const AS = {...ArrayStyle};
AS.boxWidth /= 1.2;
AS.boxGap /= 1.5;

function create_outline(
    target_node: Reference<Layout>,
    output_ref: Reference<Rect>,
    stroke: Color | string = Colors.surface,
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

function pos_topleft_within(ref: Reference<Layout>, i: number, offset: number) {
    return () => ref().topLeft().addX(i * offset)
}
function pos_bottomleft_within(ref: Reference<Layout>, i: number, offset: number) {
    return () => ref().bottomLeft().addX(i * offset)
}

function create_splitted_container(
    target_container: Reference<Layout>,
    left_size: number,
    right_size: number,
    output_left_ref: Reference<Layout>,
    output_right_ref: Reference<Layout>,
    y_offset: number = 4*AS.outlineMargin,
    center_space: number = 2*AS.boxWidth,
    opacity: number = 1,
) {
    return [
        <Layout
            ref={output_left_ref}
            opacity={opacity}
            topLeft={target_container().bottomLeft().addX(-center_space/2).addY(y_offset)}
            width={left_size * boxWidthGap(AS) - AS.boxGap}
            height={() =>target_container().height()}
        />,
        <Layout
            ref={output_right_ref}
            opacity={opacity}
            topRight={target_container().bottomRight().addX(center_space/2).addY(y_offset)}
            width={right_size * boxWidthGap(AS) - AS.boxGap}
            height={() =>target_container().height()}
        />
        ];
}

export default makeScene2D(function* (view) {
    const seed = useScene().variables.get('seed', 42);
    const size = useScene().variables.get('size', 7)();

    const random = useRandom(seed());
    
    let values = range(size).map(_ => random.nextInt(1, 99));

    const rects: Rect[] = []; // Array of Rects

    const main_container = createRef<Layout>();
    const main_outline = createRef<Rect>();

    view.fill(Colors.background);

    view.add(
        [
        <Layout
            ref={main_container}
            opacity={1}
            width={values.length * boxWidthGap(AS) - AS.boxGap}
            height={AS.boxWidth}
            y={-200}
        />,
        create_outline(main_container, main_outline, Colors.surface, AS.outlineMargin, 1),
        ]
    )

    // Create Rects
    view.add(
        range(values.length).map(i => (
        <Rect
            ref={makeRef(rects, i)}
            size={AS.boxWidth}
            lineWidth={AS.boxStrokeWidth}
            stroke={Colors.surface}
            fill={Colors.background}
            radius={AS.boxRadius}
            topLeft={pos_topleft_within(main_container,i, boxWidthGap(AS))}
        
            // centering text
            alignItems={'center'}
            justifyContent={'center'}
        >
            <Txt
                text={values[i].toString()}
                {...textStyle}
            />
        </Rect>
        ))
    )

    let container_to_split = [{current_size: size, current_container: main_container, current_level: 0, current_rects: rects}];
    let container_to_merge : {
        parent_container: Reference<Layout>,
        left_outline: Reference<Layout>,
        right_outline: Reference<Layout>,
        rects: Rect[],
    }[] = [];

    const total_levels = Math.ceil(Math.log2(size));
    
    while(container_to_split.length > 0) {

        const {current_size, current_container, current_level, current_rects} = container_to_split.pop();

        if (current_size <= 1) {
            continue;
        }

        let current_half_size = Math.floor(current_size/2);

        const left_container = createRef<Layout>();
        const left_outline = createRef<Rect>();
    
        const right_container = createRef<Layout>();
        const right_outline = createRef<Rect>();

        view.add(create_splitted_container(
            current_container,
            current_half_size,
            current_size-current_half_size,
            left_container,
            right_container,
            4*AS.outlineMargin,
            (Math.pow(total_levels-current_level, 2)+1)*AS.outlineMargin,
        ))
        view.add([
            create_outline(left_container, left_outline, Colors.surface, AS.outlineMargin, 0),
            create_outline(right_container, right_outline, Colors.surface, AS.outlineMargin, 0)
        ]);
        
        left_container().y(left_container().y()+50),
        right_container().y(right_container().y()+50),

        yield* all(
            left_container().y(left_container().y()-50, 0.3),
            right_container().y(right_container().y()-50, 0.3),
            left_outline().opacity(1, 0.3),
            right_outline().opacity(1, 0.3),
        )

        // Move rects
        yield* all(
            sequence(0.1, ...current_rects.slice(0, current_half_size).map((rect, i) => 
                    rect.topLeft(pos_topleft_within(left_container, i, boxWidthGap(AS)), 0.2)
            )),
            sequence(0.1, ...current_rects.slice(current_half_size).map((rect, i) => 
                    rect.topLeft(pos_topleft_within(right_container, i, boxWidthGap(AS)), 0.2)
            )),
        );

        container_to_merge.push({
            parent_container: current_container,
            left_outline: left_outline,
            right_outline: right_outline,
            rects: current_rects,
        });

        container_to_split.push({
            current_size: current_half_size,
            current_container: left_container,
            current_level: current_level+1,
            current_rects: current_rects.slice(0, current_half_size)
        });
        container_to_split.push({
            current_size: current_size - current_half_size,
            current_container: right_container,
            current_level: current_level+1,
            current_rects: current_rects.slice(current_half_size)
        });
    }

    while (container_to_merge.length > 0) {
        const {parent_container, left_outline, right_outline, rects} = container_to_merge.pop();

        const sorting_mapping = reverse_index_mapping(sorted_permutation(rects.map(rect => parseInt(rect.childAs<Txt>(0).text(), 10))));
        // merge
        // swap rect references
        {
        const tempRects = rects.slice();
        sorting_mapping.forEach((targetIndex, i) => rects[targetIndex] = tempRects[i] );
        }

        yield* sequence(0.2, ...rects.map((rect, i) => rect.topLeft(pos_topleft_within(parent_container, i, boxWidthGap(AS)), 0.3)))
        yield* all(
            left_outline().opacity(0, 0.3),
            right_outline().opacity(0, 0.3),
        )
        yield* waitFor(0.5);
    }

    // color green
    yield* sequence(0.1, ...rects.map(rect => rect.fill(Colors.green, 0.3)))
});
