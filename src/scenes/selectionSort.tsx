import { makeScene2D } from "@motion-canvas/2d";
import { Rect, Txt, Node } from "@motion-canvas/2d/lib/components";
import { all, sequence, waitFor } from "@motion-canvas/core/lib/flow";
import { range, useRandom } from "@motion-canvas/core/lib/utils";
import {createRef, createSignal} from '@motion-canvas/core';
import { Colors } from "@/styles/styles"
import { Array } from "@/components/array";

import { Color } from "@motion-canvas/core/lib/types";

export default makeScene2D(function* (view) {
    const random = useRandom( );
    const ArrayVal = range(5).map(_ => random.nextInt(1, 70));

    const ArrayRef = createRef<Array>();

    const underlineRef = createRef<Rect>();
    const upperlineRef = createRef<Rect>();

    const underLineIndex = createSignal(0);
    const upperLineIndex = createSignal(0);

    view.fill(Colors.background);
    
    view.add(
        <>
        <Array
            ref={ArrayRef}
            values={ArrayVal}
            highlightColor={new Color(Colors.blue)}
            strokeColor={new Color(Colors.surface)}
        />

        <Node
            ref = {underlineRef}
            x={() => ArrayRef().left().x + ArrayRef().boxWidth()/2 + underLineIndex() * (ArrayRef().boxWidth() + ArrayRef().boxGap())}
            y={ArrayRef().boxHeight() / 2 + 20}
            >
        <Rect
            stroke={Colors.blue}
            lineWidth={4}
            radius={4}
            width={ArrayRef().boxWidth()}
            height={2}
            
            opacity={1}
        />
        <Txt
            fill={Colors.whiteLabel}
            text={ () => `i = ${Math.ceil(underLineIndex())}`}
            scale={0.8}
            y={30}
        />
        </Node>
        <Node
            ref = {upperlineRef}
            x={() => ArrayRef().left().x + ArrayRef().boxWidth()/2 + upperLineIndex() * (ArrayRef().boxWidth() + ArrayRef().boxGap())}
            y={-ArrayRef().boxHeight() / 2 - 20}
            >
        <Rect
            stroke={Colors.blue}
            lineWidth={4}
            radius={4}
            width={ArrayRef().boxWidth()}
            height={2}
            
            opacity={1}
        />
        <Txt
            fill={Colors.whiteLabel}
            text={ () => `j = ${Math.ceil(upperLineIndex())}`}
            scale={0.8}
            y={-30}
        />
        </Node>
        </>
    )
    
    yield* waitFor(1);

    // Selection Sort
    for (let i = 0; i < ArrayRef().length(); i++) {
        yield* underLineIndex(i, 0.5);

        let minIndex = i;

        yield* ArrayRef().rects[minIndex].fill(ArrayRef().highlightColor, .5);

        if(i + 1 < ArrayRef().length()) {
            upperLineIndex(i + 1);
            yield* upperlineRef().opacity(1, 0.3);
        }
        for (let j = i + 1; j < ArrayRef().length(); j++) { 
            yield* all(
                ArrayRef().highLightAt(j, .5),
                upperLineIndex(j, 0.5),
            )
            if (ArrayRef().values()[minIndex] > ArrayRef().values()[j]) {
                yield* all(
                    ArrayRef().rects[minIndex].fill(new Color(Colors.transparent), .5),
                    ArrayRef().rects[j].fill(ArrayRef().highlightColor, .5),
                    ArrayRef().deHighLightAt(j, .5),
                );
                minIndex = j;
            }else {
                yield* ArrayRef().deHighLightAt(j, .5);
            }
        }
        yield* upperlineRef().opacity(0, 0.3);

        if(i != minIndex) {
            yield* all(
                ArrayRef().rects[minIndex].fill(new Color(Colors.transparent), .5),
                ArrayRef().highLightAt(i, .5),
                ArrayRef().highLightAt(minIndex, .5),
            );
            yield* ArrayRef().swapUpDown(i, minIndex, .5);
            yield* all(
                ArrayRef().deHighLightAt(i, .5),
                ArrayRef().deHighLightAt(minIndex, .5),
            );

        }else {
            yield* ArrayRef().rects[minIndex].fill(new Color(Colors.transparent), .5);
        }
    }

    // Hide the underline and upperline
    yield* all(
        underlineRef().opacity(0, 0.3),
        upperlineRef().opacity(0, 0.3),
    )

    yield* waitFor(0.5);

    // fill the array with green color
    yield* sequence(
        0.1,
        ...ArrayRef().rects.map(rect => rect.fill(new Color(Colors.green), .3))
    );
});