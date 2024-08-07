import { makeScene2D } from "@motion-canvas/2d";
import { Rect, Txt } from "@motion-canvas/2d/lib/components";
import { all, delay, sequence, waitFor } from "@motion-canvas/core/lib/flow";
import { makeRef, range, useRandom, useScene } from "@motion-canvas/core/lib/utils";
import {Color, createRef} from '@motion-canvas/core';
import { Colors, textStyle } from "@/styles/styles";
import { sorted_permutation, reverse_index_mapping } from "@/utils/utils";

export default makeScene2D(function* (view) {
    const seed = useScene().variables.get('seed', 42);
    const size = useScene().variables.get('size', 7);
    const random = useRandom(seed());
    const values = range(size()).map(_ => random.nextInt(1, 70));
    const halfSize = Math.floor(size() / 2);

    const rects: Rect[] = []; // Array of Rects
    
    const OutlineMainArrayRef = createRef<Rect>();
    const OutlineFirstArrayRef = createRef<Rect>();
    const OutlineSecondArrayRef = createRef<Rect>();

    const boxGap = 28;
    const outlineMargin = 16;
    const boxWidth = 128;
    const boxWidthGap = boxGap + boxWidth;
    const boxRadius = 4;
    const boxStrokeWidth = 8;

    view.fill(Colors.background);
    
    view.add(
        range(values.length).map(i => (
        <Rect
            ref={makeRef(rects, i)}
            size={boxWidth}
            lineWidth={boxStrokeWidth}
            stroke={Colors.surface}
            fill={Colors.background}
            radius={boxRadius}
    
            x={(-boxWidthGap * (values.length - 1)) / 2 + boxWidthGap * i}
        
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
    );

    view.add(
        <>
        <Rect
            ref={OutlineMainArrayRef}
            stroke={Colors.surface}
            lineWidth={6}
            radius={8}
            opacity={0}
            width={values.length * boxWidthGap - boxGap + 2*outlineMargin}
            height={boxWidth + 2*outlineMargin}
        />
        <Rect
            ref={OutlineFirstArrayRef}
            stroke={Colors.cyan}
            lineWidth={6}
            radius={8}
            opacity={0}
            topLeft={() => [OutlineMainArrayRef().left().x - boxWidth, OutlineMainArrayRef().bottomRight().y + 2*outlineMargin]}
            width={halfSize * boxWidthGap - boxGap + 2*outlineMargin}
            height={boxWidth + 2*outlineMargin}
            fill={new Color(Colors.cyan).desaturate(0.5).alpha(0.1)}
        />
        <Rect
            ref={OutlineSecondArrayRef}
            stroke={Colors.yellow}
            lineWidth={6}
            radius={8}
            opacity={0}
            topRight={() => [OutlineMainArrayRef().right().x + boxWidth, OutlineMainArrayRef().bottomRight().y + 2*outlineMargin]}
            width={(values.length-halfSize) * boxWidthGap - boxGap + 2*outlineMargin}
            height={boxWidth + 2*outlineMargin}
            fill={new Color(Colors.yellow).desaturate(0.5).alpha(0.1)}
        />
        </>
    )

    yield* waitFor(0.5);

    yield* all(
        sequence(0.1, ...rects.slice(0, halfSize).map(rect => rect.stroke(Colors.cyan, 0.1))),
        sequence(0.1, ...rects.slice(halfSize).map(rect => rect.stroke(Colors.yellow, 0.1))),
    )

    yield* waitFor(0.5);

    const upMoveDistance = boxWidth/2 + 2*outlineMargin;

    yield* all(
        OutlineMainArrayRef().y(OutlineMainArrayRef().y() - upMoveDistance, 0.3),
        ...rects.map(rect => rect.y(rect.y() - upMoveDistance, 0.3)),
        OutlineMainArrayRef().opacity(1, 0.3),
        delay(0.1,
            all(
                OutlineFirstArrayRef().opacity(1, 0.3),
                OutlineSecondArrayRef().opacity(1, 0.3),
            )
        ),
    )

    //save all rects position
    const rectsPosition = rects.map(rect => rect.position());
    
    yield* all(
        sequence(
            0.3,
            ...rects.slice(0, halfSize).map((rect, i) => 
                rect.topLeft(OutlineFirstArrayRef().topLeft().addY(outlineMargin).addX(outlineMargin + boxWidthGap * i), 0.4
        ))),
        sequence(
            0.3,
            ...rects.slice(halfSize).map((rect, i) =>
                rect.topLeft(OutlineSecondArrayRef().topLeft().addY(outlineMargin).addX(outlineMargin + boxWidthGap * i), 0.4
        ))),
    );

    // sort the subarrays
    const splitRectsPosition = rects.map(rect => rect.position());
    const sub_sorting_permutation = reverse_index_mapping([
        ...sorted_permutation(values.slice(0, halfSize)),
        ...sorted_permutation(values.slice(halfSize)).map(i => i + halfSize)
    ]);

    yield* sequence(0.1, ...sub_sorting_permutation.map((targetIndex, i) => rects[i].position(splitRectsPosition[targetIndex], 0.3)));
    yield* waitFor(0.5);

    // swap rect references
    const tempRects = [...rects];
    sub_sorting_permutation.forEach((targetIndex, i) => rects[targetIndex] = tempRects[i] );
    const tempValues = [...values];
    sub_sorting_permutation.forEach((targetIndex, i) => values[targetIndex] = tempValues[i] );

    const sorting_mapping = reverse_index_mapping(sorted_permutation(values));

    // merge
    {
        const tempRects = rects.slice();
        sorting_mapping.forEach((targetIndex, i) => rects[targetIndex] = tempRects[i] );
    }

    yield* sequence(0.2, ...rects.map((rect, i) => rect.position(rectsPosition[i], 0.3)))

    yield* waitFor(0.5);

    // remove outlines and color rects and move down
    yield* all(
        OutlineMainArrayRef().y(OutlineMainArrayRef().y() + upMoveDistance, 0.3),
        ...rects.map(rect => rect.y(rect.y() + upMoveDistance, 0.3)),
        OutlineMainArrayRef().opacity(0, 0.3),
        OutlineFirstArrayRef().opacity(0, 0.3),
        OutlineSecondArrayRef().opacity(0, 0.3),
        ...rects.map(rect => rect.stroke(Colors.surface, 0.3)),
    )

    yield* all(
        OutlineFirstArrayRef().opacity(0, 0.3),
        OutlineSecondArrayRef().opacity(0, 0.3),
        OutlineMainArrayRef().opacity(0, 0.3),
        
    )

    // color green
    yield* sequence(0.1, ...rects.map(rect => rect.fill(Colors.green, 0.3)))
});