import { Layout, makeScene2D } from "@motion-canvas/2d";
import { Rect, Txt, Node} from "@motion-canvas/2d/lib/components";
import { all, delay, sequence, waitFor } from "@motion-canvas/core/lib/flow";
import { makeRef, range, Reference, useRandom, useScene } from "@motion-canvas/core/lib/utils";
import {Color, createRef, createSignal, Signal, SignalGenerator, SignalValue, Vector2} from '@motion-canvas/core';
import { Colors, textStyle } from "@/styles/styles";
//import ArrayConstant as default 
import {Style as AS, boxWidthGap} from "@/utils/ArrayConstants";

// Function to sort an array and return the permutation of indexes
function sorted_permutation(array: number[]): number[] {
    return array.map((value, index) => { return { value, index } })
    .sort((a, b) => a.value - b.value)
    .map(({ index }) => index);
}

function reverse_index_mapping(index_mapping: number[]): number[] {
    let reversed_index_mapping = range(index_mapping.length);
    for (let i = 0; i < index_mapping.length; i++) {
        reversed_index_mapping[index_mapping[i]] = i;
    }
    return reversed_index_mapping;
}

function create_outline(
    target_node: Reference<Layout>,
    output_ref: Reference<Rect>,
    stroke: Color | string = Colors.surface,
    opacity: number = 1,
    padding: number = AS.outlineMargin) {
    return (<Rect
        ref={output_ref}
        stroke={stroke}
        lineWidth={6}
        radius={8}
        opacity={opacity}
        position={() => target_node().position()}
        width={() => target_node().width() + 2*AS.outlineMargin}
        height={() => target_node().height() + 2*AS.outlineMargin}
    />);
}

function createUnderlineRef(
    ref: Reference<Rect>,
    textSignal: SignalValue<string>,
    color: Color | string,
    position: Vector2,
    opacity: number = 1, 
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
            width={AS.boxWidth}
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

function pos_topleft_within(ref: Reference<Layout>, i: number) {
    return () => ref().topLeft().addX(i * boxWidthGap(AS))
}
function pos_bottomleft_within(ref: Reference<Layout>, i: number) {
    return () => ref().bottomLeft().addX(i * boxWidthGap(AS))
}

function create_splitted_container(
    target_container: Reference<Layout>,
    //target_size: number,
    left_size: number,
    right_size: number,
    output_left_ref: Reference<Layout>,
    output_right_ref: Reference<Layout>,
    y_offset: number = 4*AS.outlineMargin,
    center_space: number = 2*AS.boxWidth,
    opacity: number = 1,
) {
    return (
        <>
        <Layout
            ref={output_left_ref}
            opacity={opacity}
            topLeft={() => target_container().bottomLeft().addX(-center_space/2).addY(y_offset)}
            width={left_size * boxWidthGap(AS) - AS.boxGap}
            height={() =>target_container().height()}
        />
        <Layout
            ref={output_right_ref}
            opacity={opacity}
            topRight={() => target_container().bottomRight().addX(center_space/2).addY(y_offset)}
            width={right_size * boxWidthGap(AS) - AS.boxGap}
            height={() =>target_container().height()}
        />
        </>
    );
}

export default makeScene2D(function* (view) {
    const seed = useScene().variables.get('seed', 45);
    const size = useScene().variables.get('size', 12)();

    AS.boxWidth /= 2;
    AS.boxGap
    const random = useRandom(seed());
    const halfSize = Math.floor(size / 2);
    
    let values = range(size).map(_ => random.nextInt(1, 70));
    const rects: Rect[] = []; // Array of Rects
    
    const main_container = createRef<Layout>();
    const main_outline = createRef<Rect>();

    const first_container = createRef<Layout>();
    const first_outline = createRef<Rect>();

    const second_container = createRef<Layout>();
    const second_outline = createRef<Rect>();

    const inferiorSignRef = createRef<Txt>();

    const i_index = createSignal(0);
    const j_index = createSignal(0);
    const k_index = createSignal(0);
    const iUnderlineRef = createRef<Rect>();
    const jUnderlineRef = createRef<Rect>();
    const kUnderlineRef = createRef<Rect>();

    view.fill(Colors.background);
    
    const upMoveDistance = AS.boxWidth/2 + 2*AS.outlineMargin;

    view.add(
        <>
        <Layout
            ref={main_container}
            opacity={1}
            width={values.length * boxWidthGap(AS) - AS.boxGap}
            y= {-view.height()/2 + AS.boxWidth+ 2*AS.outlineMargin}
            height={AS.boxWidth}
        />
        </>
    )

    view.add(create_splitted_container(main_container, halfSize, values.length-halfSize, first_container, second_container))

    view.add([
        create_outline(main_container, main_outline, Colors.surface, 1),
        create_outline(first_container, first_outline, Colors.cyan, 1),
        create_outline(second_container, second_outline, Colors.yellow, 1)
    ]);

    first_outline().fill(new Color(Colors.cyan).desaturate(0.5).alpha(0.1))
    second_outline().fill(new Color(Colors.yellow).desaturate(0.5).alpha(0.1))
    
    view.add(
        range(values.length).map(i => (
        <Rect
            ref={makeRef(rects, i)}
            size={AS.boxWidth}
            lineWidth={AS.boxStrokeWidth}
            stroke={Colors.surface}
            fill={Colors.background}
            radius={AS.boxRadius}
            topLeft={pos_topleft_within(main_container,i)}
        
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
            () => `i = ${Math.ceil(i_index())}`,
            Colors.cyan,
            Vector2.zero,
            0
        ),
        createUnderlineRef(
            jUnderlineRef,
            () => `j = ${Math.ceil(j_index())}`,
            Colors.yellow,
            Vector2.zero,
            0
        ),
        createUnderlineRef(
            kUnderlineRef,
            () => `k = ${Math.ceil(k_index())}`,
            Colors.blue,
            Vector2.zero,
            0,
            -30
        )
    ]);

    view.add(<Txt ref={inferiorSignRef} fill={'#ffffff'} opacity={0} text={">"} />);

    yield* all(
        sequence(0.1, ...rects.slice(0, halfSize).map(rect => rect.stroke(Colors.cyan, 0.1))),
        sequence(0.1, ...rects.slice(halfSize).map(rect => rect.stroke(Colors.yellow, 0.1))),
        main_outline().opacity(1, 0),
        first_outline().opacity(1, 0.3),
        second_outline().opacity(1, 0.3),
    )

    //save all rects position
    const rectsPosition = rects.map(rect => rect.position());
    
    yield* all(
        sequence(0.1, ...rects.slice(0, halfSize).map((rect, i) => 
                rect.topLeft(pos_topleft_within(first_container,i), 0.2)
        )),
        sequence(0.1, ...rects.slice(halfSize).map((rect, i) => 
                rect.topLeft(pos_topleft_within(second_container,i), 0.2)
        )),
    );

    // sort the subarrays
    const sorting_mapping = reverse_index_mapping([
        ...sorted_permutation(values.slice(0, halfSize)),
        ...sorted_permutation(values.slice(halfSize)).map(i => i + halfSize)
    ]);

    const splitRectsPosition = rects.map(rect => rect.position());
    yield* all(...sorting_mapping.map((target_index, i) => rects[i].position(splitRectsPosition[target_index], 0.2)));

    // swap rect and values references
    const tempRects = rects.slice();
    sorting_mapping.forEach((targetIndex, i) => rects[targetIndex] = tempRects[i]);
    const tempValues = values.slice();
    sorting_mapping.forEach((targetIndex, i) => values[targetIndex] = tempValues[i]);

    yield* all(
        sequence(0.1, ...rects.slice(0, halfSize).map(rect => rect.stroke(Colors.surface, 0.1))),
        sequence(0.1, ...rects.slice(halfSize).map(rect => rect.stroke(Colors.surface, 0.1))),
    )

    // fusion algorithm

    // display underline and index
    iUnderlineRef().position(() => pos_bottomleft_within(first_container, Math.min(i_index(), halfSize-1))()
        .addX(AS.boxWidth/2).addY(2*AS.outlineMargin) );

    jUnderlineRef().position(() => pos_bottomleft_within(second_container, Math.min(j_index(), size-halfSize-1))()
        .addX(AS.boxWidth/2).addY(2*AS.outlineMargin) );

    kUnderlineRef().position(() => pos_topleft_within(main_container, Math.min(k_index(), size-1))()
        .addX(AS.boxWidth/2).addY(-2*AS.outlineMargin) );

    yield* all(...[iUnderlineRef, jUnderlineRef, kUnderlineRef].map(x => x().opacity(1, 0.3)))

    while(k_index() < values.length - 1) {

        rects[i_index()].save();
        rects[j_index()+halfSize].save();

        yield* all(
            rects[i_index()].stroke(Colors.cyan, 0.3),
            rects[j_index()+halfSize].stroke(Colors.yellow, 0.3),
        );

        //move then down and display inferiorSignRef in middle of the two rects

        yield* all(
            rects[i_index()].position(new Vector2(
                -boxWidthGap(AS),
                rects[i_index()].y() + 1.5*boxWidthGap(AS)
            ), 0.3),
            rects[j_index()+halfSize].position(new Vector2(
                boxWidthGap(AS),
                rects[j_index()+halfSize].y() + 1.5*boxWidthGap(AS)
            ), 0.3),
        );

        inferiorSignRef().position(
            rects[i_index()].position()
            .add(rects[j_index()+halfSize].position())
            .div(new Vector2(2,2)));
        
        let iLessThanY = values[i_index()] < values[j_index()+halfSize];

        inferiorSignRef().text(iLessThanY? '<': '>');
        yield* inferiorSignRef().opacity(1, 0.3);

        yield* (iLessThanY ? rects[i_index()]:rects[j_index()+halfSize]).stroke(Colors.green, 0.3);
        yield* waitFor(0.5);

        yield* all(
            rects[i_index()].restore(0.3),
            rects[j_index()+halfSize].restore(0.3),
            (iLessThanY ? rects[i_index()]:rects[j_index()+halfSize]).topLeft(pos_topleft_within(main_container, k_index()), 0.3),
            inferiorSignRef().opacity(0, 0.3),
            (iLessThanY?i_index:j_index)((iLessThanY?i_index:j_index)() + 1, 0.3),
        )

        if(k_index() < values.length-1) {
            yield* all(
                k_index(k_index() + 1, 0.1),
                kUnderlineRef().x(kUnderlineRef().x() + boxWidthGap(AS), 0.3)
            )
        }

        if (i_index() == halfSize || j_index() == size - halfSize) {
            break;
        }
    }
    
    //how to use loop on zip value here ?
    if(i_index() < halfSize) {

        first_outline().save()
        yield* first_outline().stroke((first_outline().stroke() as Color).brighten(4), 0.4)
        yield* first_outline().restore(0.4)

        while(k_index() < size) {
            yield* all(
                rects[i_index()].topLeft(pos_topleft_within(main_container, k_index()), 0.3),
                k_index(k_index() + 1, 0.1),
                i_index(i_index() + 1, 0.1),
            )
        }
    }

    if(j_index() < halfSize) {

        second_outline().save()
        yield* second_outline().stroke((second_outline().stroke() as Color).brighten(4), 0.4)
        yield* second_outline().restore(0.4)

        while(k_index() < size) {
            yield* all(
                rects[j_index()].topLeft(pos_topleft_within(main_container, k_index()), 0.3),
                k_index(k_index() + 1, 0.1),
                j_index(j_index() + 1, 0.1),
            )
        }
    }

    // color green
    // yield* sequence(0.1, ...rects.map(rect => rect.fill(Colors.green, 0.3)))
});