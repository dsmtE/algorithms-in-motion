import { makeScene2D } from "@motion-canvas/2d";
import { Rect, Txt, Node} from "@motion-canvas/2d/lib/components";
import { all, delay, sequence, waitFor } from "@motion-canvas/core/lib/flow";
import { makeRef, range, Reference, useRandom, useScene } from "@motion-canvas/core/lib/utils";
import {Color, createRef, createSignal, Signal, SignalValue, Vector2} from '@motion-canvas/core';
import { Colors, textStyle } from "@/styles/styles";
//import ArrayConstant as default 
import AC from "@/utils/ArrayConstants";

// Function to sort an array and return the permutation of indexes
function sortedPermutation(array: number[]): number[] {
    let sorted = array.map((value, index) => { return { value, index } })
    .sort((a, b) => a.value - b.value)
    .map(({ index }) => index);
    
    let permutation = range(array.length);
    for (let i = 0; i < array.length; i++) {
        permutation[sorted[i]] = i;
    }

    return permutation;
}

function createUnderlineRef(
    ref: Reference<Rect>,
    textSignal: SignalValue<string>,
    color: Color | string,
    position: Vector2,
    opacity: number, 
    textYOffset: number = 30): Node {
    return (
        <Node
            ref={ref}
            position={position}
            opacity={opacity}
            >
        <Rect
            stroke={color}
            lineWidth={4}
            radius={4}
            width={AC.boxWidth}
            height={2}
            opacity={1}
        />
        <Txt
            fill={Colors.whiteLabel}
            text={ textSignal }
            scale={0.8}
            y={textYOffset}
        />
        </Node>
    );
}

export default makeScene2D(function* (view) {
    const seed = useScene().variables.get('seed', 44);
    const size = useScene().variables.get('size', 9);
    const random = useRandom(seed());
    const halfSize = Math.floor(size() / 2);
    
    let values = range(size()).map(_ => random.nextInt(1, 70));
    const rects: Rect[] = []; // Array of Rects
    
    const OutlineMainArrayRef = createRef<Rect>();
    const OutlineFirstArrayRef = createRef<Rect>();
    const OutlineSecondArrayRef = createRef<Rect>();
    const inferiorSignRef = createRef<Txt>();

    const iUnderlineRef = createRef<Rect>();
    const iUnderLineIndex = createSignal(0);
    const jUnderlineRef = createRef<Rect>();
    const jUnderLineIndex = createSignal(0);
    const kUnderlineRef = createRef<Rect>();
    const kUnderLineIndex = createSignal(0);

    view.fill(Colors.background);
    
    const upMoveDistance = AC.boxWidth/2 + 2*AC.outlineMargin;

    view.add(
        <>
        <Rect
            ref={OutlineMainArrayRef}
            stroke={Colors.surface}
            lineWidth={6}
            radius={8}
            opacity={0}
            width={values.length * AC.boxWidthGap - AC.boxGap + 2*AC.outlineMargin}
            y= {-2*upMoveDistance}
            height={AC.boxWidth + 2*AC.outlineMargin}
        />
        <Rect
            ref={OutlineFirstArrayRef}
            stroke={Colors.cyan}
            lineWidth={6}
            radius={8}
            opacity={0}
            topLeft={() => [OutlineMainArrayRef().left().x - AC.boxWidth, OutlineMainArrayRef().bottomRight().y + 2*AC.outlineMargin]}
            width={halfSize * AC.boxWidthGap - AC.boxGap + 2*AC.outlineMargin}
            height={AC.boxWidth + 2*AC.outlineMargin}
            fill={new Color(Colors.cyan).desaturate(0.5).alpha(0.1)}
        />
        <Rect
            ref={OutlineSecondArrayRef}
            stroke={Colors.yellow}
            lineWidth={6}
            radius={8}
            opacity={0}
            topRight={() => [OutlineMainArrayRef().right().x + AC.boxWidth, OutlineMainArrayRef().bottomRight().y + 2*AC.outlineMargin]}
            width={(values.length-halfSize) * AC.boxWidthGap - AC.boxGap + 2*AC.outlineMargin}
            height={AC.boxWidth + 2*AC.outlineMargin}
            fill={new Color(Colors.yellow).desaturate(0.5).alpha(0.1)}
        />
        </>
    )
    
    view.add(
        range(values.length).map(i => (
        <Rect
            ref={makeRef(rects, i)}
            size={AC.boxWidth}
            lineWidth={AC.boxStrokeWidth}
            stroke={Colors.surface}
            fill={Colors.background}
            radius={AC.boxRadius}
    
            x={(-AC.boxWidthGap * (values.length - 1)) / 2 + AC.boxWidthGap * i}
            y={OutlineMainArrayRef().y()}
        
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

    view.add([
        createUnderlineRef(
            iUnderlineRef,
            () => `i = ${Math.ceil(iUnderLineIndex())}`,
            Colors.cyan,
            Vector2.zero,
            0
        ),
        createUnderlineRef(
            jUnderlineRef,
            () => `j = ${Math.ceil(jUnderLineIndex())}`,
            Colors.yellow,
            Vector2.zero,
            0
        ),
        createUnderlineRef(
            kUnderlineRef,
            () => `k = ${Math.ceil(kUnderLineIndex())}`,
            Colors.blue,
            Vector2.zero,
            0,
            -30
        )
    ]);

    view.add(
        <Txt
            ref={inferiorSignRef}
            fill={'#ffffff'}
            opacity={0}
            text={">"}
        ></Txt>
      );

    yield* all(
        sequence(0.1, ...rects.slice(0, halfSize).map(rect => rect.stroke(Colors.cyan, 0.1))),
        sequence(0.1, ...rects.slice(halfSize).map(rect => rect.stroke(Colors.yellow, 0.1))),
        OutlineMainArrayRef().opacity(1, 0),
        OutlineFirstArrayRef().opacity(1, 0.3),
        OutlineSecondArrayRef().opacity(1, 0.3),
    )

    //save all rects position
    const rectsPosition = rects.map(rect => rect.position());
    
    yield* all(
        sequence(
            0.1,
            ...rects.slice(0, halfSize).map((rect, i) => 
                rect.topLeft(OutlineFirstArrayRef().topLeft().addY(AC.outlineMargin).addX(AC.outlineMargin + AC.boxWidthGap * i), 0.2
        ))),
        sequence(
            0.1,
            ...rects.slice(halfSize).map((rect, i) =>
                rect.topLeft(OutlineSecondArrayRef().topLeft().addY(AC.outlineMargin).addX(AC.outlineMargin + AC.boxWidthGap * i), 0.2
        ))),
    );

    // sort the subarrays
    const sortingTargetIndex = [
        ...sortedPermutation(values.slice(0, halfSize)),
        ...sortedPermutation(values.slice(halfSize)).map(i => i + halfSize)
    ];

    const splitRectsPosition = rects.map(rect => rect.position());
    yield* all(...sortingTargetIndex.map((targetIndex, i) => rects[i].position(splitRectsPosition[targetIndex], 0.3)));
    yield* waitFor(0.5);

    // swap rect and values references
    // TODO: better way to do this? return both mapping index from sortedPermutation
    const tempRects = rects.slice();
    sortingTargetIndex.forEach((targetIndex, i) => rects[targetIndex] = tempRects[i]);
    const tempValues = values.slice();
    sortingTargetIndex.forEach((targetIndex, i) => values[targetIndex] = tempValues[i]);

    yield* sequence(0.1, ...rects.map(rect => rect.stroke(Colors.surface, 0.3)));

    // fusion algorithm

    // display underline and index
    iUnderlineRef().position(new Vector2(rects[0].x(), rects[0].bottom().y + 2*AC.outlineMargin));
    jUnderlineRef().position(new Vector2(rects[halfSize].x(), rects[halfSize].bottom().y + 2*AC.outlineMargin));
    kUnderlineRef().position(new Vector2(rectsPosition[0].x, rectsPosition[0].y -AC.boxWidth/2 - 2*AC.outlineMargin));

    yield* all(
        iUnderlineRef().opacity(1, 0.3),
        jUnderlineRef().opacity(1, 0.3),
        kUnderlineRef().opacity(1, 0.3),
    );

    while(kUnderLineIndex() < values.length - 1) {

        rects[iUnderLineIndex()].save();
        rects[jUnderLineIndex()+halfSize].save();

        yield* all(
            rects[iUnderLineIndex()].stroke(Colors.cyan, 0.3),
            rects[jUnderLineIndex()+halfSize].stroke(Colors.yellow, 0.3),
        );

        //move then down and display inferiorSignRef in middle of the two rects

        yield* all(
            rects[iUnderLineIndex()].position(new Vector2(
                -AC.boxWidthGap,
                rects[iUnderLineIndex()].y() + 1.5*AC.boxWidthGap
            ), 0.3),
            rects[jUnderLineIndex()+halfSize].position(new Vector2(
                AC.boxWidthGap,
                rects[jUnderLineIndex()+halfSize].y() + 1.5*AC.boxWidthGap
            ), 0.3),
        );

        inferiorSignRef().position(
            rects[iUnderLineIndex()].position()
            .add(rects[jUnderLineIndex()+halfSize].position())
            .div(new Vector2(2,2)));

        yield* inferiorSignRef().opacity(1, 0.3);

        let iLessThanY = values[iUnderLineIndex()] < values[jUnderLineIndex()+halfSize];

        yield* (iLessThanY ? rects[iUnderLineIndex()]:rects[jUnderLineIndex()+halfSize]).stroke(Colors.green, 0.3);
        yield* waitFor(0.5);

        yield* all(
            rects[iUnderLineIndex()].restore(0.3),
            rects[jUnderLineIndex()+halfSize].restore(0.3),
            (iLessThanY ? rects[iUnderLineIndex()]:rects[jUnderLineIndex()+halfSize]).position(rectsPosition[kUnderLineIndex()], 0.3),
            inferiorSignRef().opacity(0, 0.3),
            
            (iLessThanY?iUnderLineIndex:jUnderLineIndex)((iLessThanY?iUnderLineIndex:jUnderLineIndex)() + 1, 0.3),
            (iLessThanY?iUnderlineRef:jUnderlineRef)().x((iLessThanY?iUnderlineRef:jUnderlineRef)().x() + AC.boxWidthGap, 0.3),
        )

        yield* kUnderLineIndex(kUnderLineIndex() + 1, 0.3);

        if (iUnderLineIndex() == halfSize || jUnderLineIndex() == values.length - halfSize) {
            break;
        }
    }

    // color green
    // yield* sequence(0.1, ...rects.map(rect => rect.fill(Colors.green, 0.3)))
});