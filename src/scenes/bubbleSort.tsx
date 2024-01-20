import { makeScene2D } from "@motion-canvas/2d";
import { Rect, Txt } from "@motion-canvas/2d/lib/components";
import { all, waitFor } from "@motion-canvas/core/lib/flow";
import {
    makeRef,
    range,
    useRandom,
} from "@motion-canvas/core/lib/utils";
import { ThreadGenerator } from "@motion-canvas/core";
import { createSignal } from "@motion-canvas/core/lib/signals";

export default makeScene2D(function* (view) {
    const size: number = 12;
    const sizeOver10: number = size / 10;
    const squareSize: number = 150 / sizeOver10;
    const margin: number = 35 / sizeOver10;
    const jump: number = 90 / sizeOver10;
    const fontSize: number = 75 / sizeOver10;

    const rects: Rect[] = [];
    const random = useRandom();

    // view.height(squareSize + 2 * margin + 2 * jump);
    view.fill("#141414");

    let randomNumbers = range(size).map((i) => random.nextInt(1, 70));
    const signals = randomNumbers.map((value) => createSignal(value));

    const mapping: number[] = range(size);

    const fillColor = "#e3242b";

    view.add(
        range(size).map((i) => (
            <Rect
                ref={makeRef(rects, i)}
                width={squareSize}
                height={squareSize}
                x={
                    (-(squareSize + margin) * (size - 1)) / 2 +
                    (squareSize + margin) * i
                }
                fill="#e3242b"
                radius={30}
            >
                <Txt
                    fontSize={fontSize}
                    fontFamily={"JetBrains Mono"}
                    text={signals[i]().toString()}
                    fill={"#f0f0f0"}
                />
            </Rect>
        ))
    );

    yield waitFor(0.5);

    let swapped = false;
    for (let i = 0; i < size; i++) {
        swapped = false;

        for (let j = 0; j < size - i - 1; j++) {

            console.log(i, j)
            // Color for comparaison
            yield* all(
                rects[mapping[j]].fill("#e6a700", 0.2),
                rects[mapping[j+1]].fill("#e6a700", 0.2)
            );

            if (signals[mapping[j]]() > signals[mapping[j+1]]()) {
                swapped = true;
                yield* swap(mapping, rects, i, j, jump, squareSize, margin)
            }

            // Reset color
            yield* all(
                rects[mapping[j]].fill("#e3242b", 0.2),
                rects[mapping[j+1]].fill("#e3242b", 0.2)
            );
        }

        // Change color of sorted element
        yield rects[mapping[size-i-1]].fill("#2832c2", 0.2)

        // If no swap, validate all and break
        if (!swapped) {
            for (let i = 0; i < size; i++) {
                yield* rects[mapping[i]].fill("#2be324", 0.15);
            }

            break;
        }
    }
});

function* swap(
    mapping: number[],
    rects: Rect[],
    i: number,
    j: number,
    jump: number,
    squareSize: number,
    margin: number
): ThreadGenerator {
    let temp2 = mapping[j];
    mapping[j] = mapping[j + 1];
    mapping[j + 1] = temp2;

    yield* all(
        rects[mapping[j]].y(rects[mapping[j]].y() + jump, 0.1),
        rects[mapping[j + 1]].y(rects[mapping[j + 1]].y() - jump, 0.1)
    );

    yield* all(
        rects[mapping[j]].x(rects[mapping[j]].x() - (squareSize+margin), 0.2),
        rects[mapping[j + 1]].x(rects[mapping[j + 1]].x() + (squareSize+margin), 0.2)
    );
    yield* all(
        rects[mapping[j]].y(rects[mapping[j]].y() - jump, 0.1),
        rects[mapping[j + 1]].y(rects[mapping[j + 1]].y() + jump, 0.1)
    );
}
