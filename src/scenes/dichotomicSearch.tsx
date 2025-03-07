import {Layout, Line, makeScene2D, Rect, Shape, Txt} from '@motion-canvas/2d';
import { makeRef, range, useRandom, useScene } from "@motion-canvas/core/lib/utils";
import { Colors, textStyle } from "@/styles/styles";
import {all, createRef, createRefMap, delay, Reference, sequence, ThreadGenerator, Vector2} from '@motion-canvas/core';

import {Style as ArrayStyle, boxWidthGap} from "@/utils/ArrayConstants";

const AS = {...ArrayStyle};

function get_rect_value(rect: Rect): number {
    return parseInt(rect.childAs<Txt>(0).text(), 10)
}

/**
 * Small function for getting the position slightly below an object.
 * @param object
 */
function under(object: Layout): Vector2 {
    return object.bottom().addY(20);
}

/**
 * Create an arrow used for the binary search.
 * @param ref Reference to it.
 * @param color Color of the arrow.
 * @param object Under which object to place the arrow.
 */
function getArrow(ref: Reference<Line>, color: string, object: Layout) {
    return <Line
        ref={ref}
        points={[[0, 0], [0, 100]]} stroke={color}
        arrowSize={25} lineWidth={10}
        position={under(object)}
        startArrow
    />
}

export function* appear(object: Shape, duration = 1): ThreadGenerator {
    let scale = object.scale();

    yield* all(
        object.scale(0).scale(scale, duration),
        object.opacity(0).opacity(1, duration),
    );
}

/**
 * An animation of an arrow appearing.
 */
function* showArrow(ref: Line) {
    let lineWidth = ref.lineWidth();
    let arrowSize = ref.arrowSize();

    ref.opacity(0);
    ref.end(0);
    ref.lineWidth(0);
    ref.arrowSize(0);

    yield* all(
        ref.lineWidth(lineWidth, 1),
        ref.arrowSize(arrowSize, 1),
        ref.opacity(1, 1),
        ref.end(1, 1),
    )
}

export default makeScene2D(function* (view) {
    const seed = useScene().variables.get('seed', 42);
    const size = useScene().variables.get('size', 10)();
    const random = useRandom(seed());

    view.fill(Colors.background);

    const rects: Rect[] = []; // Array of Rects

    const centeringOffset = -(size * boxWidthGap(AS) - AS.boxGap)/2;

    const layout = createRef<Layout>();
    // Create Rects
        view.add(
            <Layout layout ref={layout} gap={40}>
            {
            range(size).map(_ => random.nextInt(1, 70)).sort().map((value, i) => (
            <Rect
                ref={makeRef(rects, i)}
                size={AS.boxWidth}
                lineWidth={AS.boxStrokeWidth}
                stroke={Colors.surface}
                fill={Colors.background}
                radius={AS.boxRadius}
                topLeft={centeringOffset + i * boxWidthGap(AS)}

                opacity={0}
            
                // centering text
                alignItems={'center'}
                justifyContent={'center'}
            >
                <Txt
                    text={value.toString()}
                    {...textStyle}
                />
            </Rect>
            ))
            }
            </Layout>
        )
    
    // showing the rectangles
    yield* sequence(
        0.025,
        ...rects.map(ref => appear(ref, 1)),
    );

    // target number stuff
    const text = createRef<Txt>();
    const target = createRef<Txt>();
    view.add(
        <Layout layout y={-200} scale={2} gap={10}>
            <Txt ref={text} fill={'white'}/>
            <Txt ref={target} fill={'white'} fontWeight={900}/>
        </Layout>
    );


    let targetNumberIndex = random.nextInt(0, rects.length - 1);
    let targetNumber = get_rect_value(rects[targetNumberIndex]);


    // display the target number
    yield* sequence(
        0.25,
        text().text(`Target: `, 1),
        target().text(`${targetNumber}`, 1),
        delay(
            0.5,
            all(
                target().scale(1.5, 0.5).to(1, 0.5),
                rects[targetNumberIndex]
                    .fill('rgba(255, 255, 255, 0.25)', 0.5)
                    .to('rgba(255, 255, 255, 0.0)', 0.5),
                    rects[targetNumberIndex].lineWidth(15, 0.5).to(8, 0.5),
                    rects[targetNumberIndex].scale(1.1, 0.5).to(1, 0.5),
            )
        )
    )

    // createRefMap for organizing multiple refs in a nicer way
    const searchArrows = createRefMap<Line>();

    // left/right arrows
    view.add(<>
        {getArrow(searchArrows.left, 'white', rects[0])}
        {getArrow(searchArrows.right, 'white', rects[rects.length - 1])}
    </>)

    yield* all(...searchArrows.mapRefs(ref => showArrow(ref)))

    let leftIndex = 0;
    let rightIndex = rects.length - 1;

    while (get_rect_value(rects[leftIndex]) <= get_rect_value(rects[rightIndex])) {
        const midIndex = Math.floor((leftIndex + rightIndex) / 2);

        let midRect = rects[midIndex];

        view.add(getArrow(searchArrows.mid, 'orange', midRect))

        yield* showArrow(searchArrows.mid())
        
        const midValue = get_rect_value(midRect);
        if (midValue === targetNumber) {
            // move arrows to the found element and highlight it
            yield* all(
                searchArrows.left().opacity(0, 1),
                searchArrows.left().position(searchArrows.mid().position, 1),
                searchArrows.right().opacity(0, 1),
                searchArrows.right().position(searchArrows.mid().position, 1),
                searchArrows.mid().stroke('lightgreen', 1),
                midRect.stroke('lightgreen', 1),
                midRect.fill('rgba(0, 255, 0, 0.2)', 1),
                sequence(0.1, ...rects.slice(leftIndex - 1, midIndex).map(ref => ref.opacity(0.25, 1))),
                sequence(0.1, ...rects.slice(midIndex + 1, rightIndex + 2).reverse().map(ref => ref.opacity(0.25, 1))),
            );

            break;
        }

        if (midValue < targetNumber) {
            // left to middle
            yield* all(
                searchArrows.left().position(under(rects[midIndex + 1]), 1),
                searchArrows.mid().opacity(0, 1),
                // slice so the fading looks smooth
                sequence(0.1, ...rects.slice(leftIndex, midIndex + 1).map(ref => ref.opacity(0.25, 1)))
            );

            leftIndex = midIndex + 1;
        } else {
            // right to middle
            yield* all(
                searchArrows.right().position(under(rects[midIndex - 1]), 1),
                searchArrows.mid().opacity(0, 1),
                // slice so the fading looks smooth (reverse so its right-to-left)
                sequence(0.1, ...rects.slice(midIndex, rightIndex + 1).reverse().map(ref => ref.opacity(0.25, 1)))
            );

            rightIndex = midIndex - 1;
        }

        searchArrows.mid().remove();
    }
});