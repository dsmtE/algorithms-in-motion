import { Layout, makeScene2D, remove } from "@motion-canvas/2d";
import { Rect, Txt, Node } from "@motion-canvas/2d/lib/components";
import { all, sequence, waitFor } from "@motion-canvas/core/lib/flow";
import { range, Reference, useRandom, useScene } from "@motion-canvas/core/lib/utils";
import {createRef, createSignal} from '@motion-canvas/core';
import { Colors } from "@/styles/styles"
import { Array } from "@/components/array";

// Function to sort an array and return the permutation of indexes
function sortedPermutation(array: number[]): number[] {
    let permutation = range(array.length);
    let sorted = array.map((value, index) => { return { value, index } })
        .sort((a, b) => a.value - b.value)
        .map(({ index }) => index);

    for (let i = 0; i < array.length; i++) {
        permutation[sorted[i]] = i;
    }
    return permutation;
}

function* animArraySorting(array: Reference<Array>, view : Node) {
        //sort first array (permutation for animation)
        const sortingTargetIndex = sortedPermutation(array().values());

        // Animation for sorting first array
        const firstArrayClone = array().rectsView().map(rect => {
            let clone: Rect = rect.clone();
            // Why absolutePosition of the rect not working?
            clone.absolutePosition(rect.position().add(array().position()));
            return clone;
        });
    
        array().rectsView().forEach(rect => rect.opacity(0));
        view.add(firstArrayClone);
    
        yield* all(
            sequence(
                0.15,
                ...firstArrayClone.map((rect, i) => rect.absolutePosition(array().rectsView()[sortingTargetIndex[i]].absolutePosition(), 0.6)),
            ),
        );

        array().values(sortingTargetIndex.map(i => array().values()[i]));
        array().rectsView().forEach(rect => rect.opacity(1));
        firstArrayClone.forEach(rect => rect.remove());
}

export default makeScene2D(function* (view) {
    const seed = useScene().variables.get('seed', 42);
    const size = useScene().variables.get('size', 7);
    const random = useRandom(seed());
    const ArrayVal = range(size()).map(_ => random.nextInt(1, 70));

    const halfSize = Math.floor(size() / 2);

    const firstArray = ArrayVal.slice(0, halfSize);
    const secondArray = ArrayVal.slice(halfSize);

    const MainArrayRef = createRef<Array>();
    const FirstArrayRef = createRef<Array>();
    const SecondArrayRef = createRef<Array>();

    const OutlineMainArrayRef = createRef<Rect>();
    const OutlineFirstArrayRef = createRef<Rect>();
    const OutlineSecondArrayRef = createRef<Rect>();

    const boxGap = 28;

    view.fill(Colors.background);
    
    view.add(
        <>
        
        <Array
            ref={MainArrayRef}
            values={ArrayVal}
            highlightColor={Colors.blue}
            strokeColor={Colors.surface}
            fillColor={Colors.background}
            boxGap={boxGap}
        />
        <Array
            ref={FirstArrayRef}
            values={firstArray}
            left={() =>  MainArrayRef().left().addY(MainArrayRef().boxHeight() + 2 * boxGap).addX(-2*boxGap)}
            highlightColor={Colors.blue}
            strokeColor={Colors.surface}
            fillColor={Colors.background}
        />
        <Array
            ref={SecondArrayRef}
            values={secondArray}
            right={() =>  MainArrayRef().right().addY(MainArrayRef().boxHeight() + 2 * boxGap).addX(2*boxGap)}
            highlightColor={Colors.blue}
            strokeColor={Colors.surface}
            fillColor={Colors.background}
        />
        {
            [[MainArrayRef, OutlineMainArrayRef], [FirstArrayRef, OutlineFirstArrayRef], [SecondArrayRef, OutlineSecondArrayRef]]
            .map(([arrayRef, outlineRef]) => (
                <Rect
                    ref={outlineRef}
                    stroke={Colors.surface}
                    lineWidth={6}
                    radius={8}
                    opacity={0}
                    x={() => arrayRef().x()}
                    y={() => arrayRef().y()}
                    width={() => arrayRef().width() + 1.2*boxGap}
                    height={() => arrayRef().height() + 1.2*boxGap}
                />
            ))
        }
        </>
    )

    FirstArrayRef().rectsView().forEach(rect => rect.opacity(0));
    SecondArrayRef().rectsView().forEach(rect => rect.opacity(0));
    
    yield* waitFor(0.5);

    yield* all(
        sequence(0.1, ...MainArrayRef().rectsView(0, halfSize).map(rect => rect.stroke(Colors.green, 0.1))),
        sequence(0.1, ...MainArrayRef().rectsView(halfSize).map(rect => rect.stroke(Colors.red, 0.1))),
    )

    FirstArrayRef().rectsView(0).forEach(rect => rect.stroke(Colors.green))
    SecondArrayRef().rectsView(0).forEach(rect => rect.stroke(Colors.red))

    yield* waitFor(0.5);

    yield* all(
        OutlineFirstArrayRef().stroke(Colors.green, 0.3),
        OutlineSecondArrayRef().stroke(Colors.red, 0.3),
        OutlineFirstArrayRef().opacity(1, 0.3),
        OutlineSecondArrayRef().opacity(1, 0.3),
        OutlineMainArrayRef().opacity(1, 0.3),
    )

    // clone boxes from first array 
    const mainArrayRectsClone = MainArrayRef().rectsView().map(rect => {
        let clone: Rect = rect.clone();
        clone.position(rect.position());
        return clone;
    });

    MainArrayRef().rectsView().forEach(rect => rect.opacity(0));
    view.add(mainArrayRectsClone);

    yield* waitFor(0.2);

    // move to first array and second array rects position
    yield* all(
        sequence(
            0.3,
            ...mainArrayRectsClone.slice(0, halfSize).map((rect, i) => rect.absolutePosition(FirstArrayRef().rectsView()[i].absolutePosition(), 0.4)),
        ),
        sequence(
            0.3,
            ...mainArrayRectsClone.slice(halfSize).map((rect, i) => rect.absolutePosition(SecondArrayRef().rectsView()[i].absolutePosition(), 0.4)),
        ),
    );

    yield* waitFor(0.2);

    FirstArrayRef().rectsView().forEach(rect => rect.opacity(1));
    SecondArrayRef().rectsView().forEach(rect => rect.opacity(1));
    mainArrayRectsClone.forEach(rect => rect.remove());

    yield* waitFor(0.5);

    yield* all(
        animArraySorting(FirstArrayRef, view),
        animArraySorting(SecondArrayRef, view)
    );

    yield* waitFor(0.5);

    // merge two arrays


});