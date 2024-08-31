import { Layout, makeScene2D, View2D } from "@motion-canvas/2d";
import { Rect, Txt} from "@motion-canvas/2d/lib/components";
import { all, sequence, waitFor } from "@motion-canvas/core/lib/flow";
import { makeRef, range, Reference, useRandom, useScene } from "@motion-canvas/core/lib/utils";
import {Color, createRef, ThreadGenerator} from '@motion-canvas/core';
import { Colors, textStyle } from "@/styles/styles";
import {Style as ArrayStyle, boxWidthGap} from "@/utils/ArrayConstants";
import { sorted_permutation, reverse_index_mapping } from "@/utils/utils";
import { create_outline, pos_topleft_within } from "@/utils/motion";

const AS = {...ArrayStyle};
AS.boxWidth /= 1.2;
AS.boxGap /= 1.5;

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

function* sort_array(
    view: View2D,
    total_levels: number,
    current_size: number,
    current_container: Reference<Layout>,
    current_outline: Rect,
    current_rects: Rect[],
    current_level: number = 0,
    previous_highlighted: Rect | null = null,
) : ThreadGenerator {
    // Do nothing if size is 0 or 1
    if (current_size <= 1) {
        yield current_outline.stroke(Colors.green, 0.5);
        yield* waitFor(0.5);
        return;
    }

    yield previous_highlighted?.save();
    yield previous_highlighted?.stroke((previous_highlighted.stroke() as Color).alpha(0.3), 0.3);
    yield current_outline.stroke(Colors.blue, 0.3);
    
    let current_half_size = Math.floor(current_size/2);

    const left_container = createRef<Layout>();
    const left_outline = createRef<Rect>();

    const right_container = createRef<Layout>();
    const right_outline = createRef<Rect>();

    // Add Legend
    view.add(
        <Layout layout direction={'column'} alignItems={'start'} topLeft={() => view.topLeft().transformAsPoint(view.worldToLocal()).add(50)}>
            <Layout layout margin={10}>
                <Txt text={'Sorted Array:'} {...textStyle} marginRight={50} />
                <Rect size={[200, 60]} fill={new Color(Colors.green).alpha(0.02)} stroke={Colors.green} radius={10} lineWidth={6} />
            </Layout>
            <Layout layout margin={10}>
                <Txt text={'Current Array:'} {...textStyle} marginRight={20} />
                <Rect size={[200, 60]} fill={new Color(Colors.blue).alpha(0.02)} stroke={Colors.blue} radius={10} lineWidth={6} />
            </Layout>
        </Layout>
    )

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

    yield* sort_array(
        view,
        total_levels,
        current_half_size,
        left_container,
        left_outline(),
        current_rects.slice(0, current_half_size),
        current_level+1,
        current_outline,
    );

    yield* waitFor(0.5);

    yield* sort_array(
        view,
        total_levels,
        current_size - current_half_size,
        right_container,
        right_outline(),
        current_rects.slice(current_half_size),
        current_level+1,
        current_outline,
);
    
    const sorting_mapping = reverse_index_mapping(sorted_permutation(current_rects.map(rect => parseInt(rect.childAs<Txt>(0).text(), 10))));
    // merge
    // swap rect references
    {
    const tempRects = current_rects.slice();
    sorting_mapping.forEach((targetIndex, i) => current_rects[targetIndex] = tempRects[i] );
    }
    
    yield* sequence(0.2, ...current_rects.map((rect, i) => rect.topLeft(pos_topleft_within(current_container, i, boxWidthGap(AS)), 0.3)))
    yield* all(
        left_outline().opacity(0, 0.3),
        right_outline().opacity(0, 0.3),
    )
    yield* waitFor(0.5);
    
    yield* current_outline.stroke(Colors.green, 0.3);
    if(previous_highlighted) {
        yield* previous_highlighted.restore(0.3);
    }
    yield* waitFor(0.5);

    [left_container, right_container, left_outline, right_outline].forEach(ref => ref().remove());
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

    const total_levels = Math.ceil(Math.log2(size));
    
    yield* sort_array(
        view,
        total_levels,
        size,
        main_container,
        main_outline(),
        rects
    );

    // color green
    yield* all(
        main_outline().stroke(Colors.surface, 0.3),
        sequence(0.1, ...rects.map(rect => rect.fill(Colors.green, 0.3))),
    )

    yield* waitFor(1);
});
