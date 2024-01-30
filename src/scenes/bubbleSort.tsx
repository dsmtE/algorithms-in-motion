import { makeScene2D } from "@motion-canvas/2d";
import { Rect, Txt } from "@motion-canvas/2d/lib/components";
import { all, waitFor } from "@motion-canvas/core/lib/flow";
import {
    makeRef,
    range,
    useRandom,
} from "@motion-canvas/core/lib/utils";
import {createRef, easeOutCubic} from '@motion-canvas/core';
import { ThreadGenerator, Vector2 } from "@motion-canvas/core";

export default makeScene2D(function* (view) {
    const size: number = 12;
    const sizeOver10: number = size / 10;
    const squareSize: number = 150 / sizeOver10;
    const margin: number = 35 / sizeOver10;
    const fontSize: number = 75 / sizeOver10;

    const rects: Rect[] = [];
    const random = useRandom(Date.now());

    // view.height(squareSize + 2 * margin + 2 * jump);
    view.fill("#141414");

    let numbers = range(size).map(_ => random.nextInt(1, 70));

    const sortingMapping: number[] = range(size);

    const txtRef = createRef<Txt>();

    const fillColor = "#e3242b";
    const sortedColor = "2832c2";
    const validatedColor = "#2be324";
    const compareColor = "#e6a700";

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
                fill={fillColor}
                radius={30}
            >
                <Txt
                    fontSize={fontSize}
                    fontFamily={"JetBrains Mono"}
                    text={numbers[i].toString()}
                    fill={"#f0f0f0"}
                />
            </Rect>
        ))
    );

    view.add(
        <Txt
            ref={txtRef}
            fill={'#ffffff'}
            opacity={0}
            text={">"}
        ></Txt>
      );

    yield waitFor(0.5);

    let swapped = false;

    for (let i = 0; i < size; i++) {
        swapped = false;

        for (let j = 0; j < size - i - 1; j++) {

            // Color for comparaison
            yield* all(
                rects[sortingMapping[j]].fill(compareColor, 0.2),
                rects[sortingMapping[j+1]].fill(compareColor, 0.2)
            );

            yield* compareWithNext(j);

            if (numbers[sortingMapping[j]] > numbers[sortingMapping[j+1]]) {
                swapped = true;
                yield* swap(j, j+1)
            }

            // Reset color
            yield* all(
                rects[sortingMapping[j]].fill(fillColor, 0.2),
                rects[sortingMapping[j+1]].fill(fillColor, 0.2)
            );
        }

        // Change color of sorted element
        yield rects[sortingMapping[size-i-1]].fill(sortedColor, 0.2)

        // If no swap, validate all and break
        if (!swapped) {
            for (let i = 0; i < size; i++) {
                yield* rects[sortingMapping[i]].fill(validatedColor, 0.15);
            }

            break;
        }
    }

    function* compareWithNext(
        i: number,
    ): ThreadGenerator {
    
        let recti = rects[sortingMapping[i]];
        let rectiplus1 = rects[sortingMapping[i+1]];
        let txt = txtRef();
    
        txt.position(rectiplus1.position().add(recti.position()).div(new Vector2(2,2)));
    
        recti.save();
        rectiplus1.save();
        txt.save();
        
        let jump = squareSize + margin;
        yield* all(
            recti.y(recti.y() - jump, 0.1),
            rectiplus1.y(rectiplus1.y() - jump, 0.1),
            txt.y(txt.y() - jump, 0.1),
        );
    
        yield* all(
            recti.x(recti.x() - margin, 0.2, easeOutCubic),
            rectiplus1.x(rectiplus1.x() + margin, 0.2, easeOutCubic),
            txt.opacity(1.0, 0.2),
        )
    
        yield* waitFor(0.2); 
    
        if (numbers[sortingMapping[i]] > numbers[sortingMapping[i+1]]) {
            yield* all(
                recti.fill(validatedColor, 0.15),
                rectiplus1.fill(validatedColor, 0.15),
                txt.fill(validatedColor, 0.15),
            )
    
            yield* waitFor(0.4); 
        }
    
        yield* all(
            txt.restore(0.2),
            recti.restore(0.2),
            rectiplus1.restore(0.2),
        );
    }
    
    function* swap(
        i: number,
        j: number,
    ): ThreadGenerator {
    
        let temp2 = sortingMapping[j];
        sortingMapping[j] = sortingMapping[i];
        sortingMapping[i] = temp2;

        let recti = rects[sortingMapping[i]];
        let rectj = rects[sortingMapping[i+1]];
        
        let jump = squareSize + margin;

        yield* all(
            rectj.y(rectj.y() + jump, 0.1),
            recti.y(recti.y() - jump, 0.1)
        );
    
        yield* all(
            rectj.x(recti.x(), 0.2),
            recti.x(rectj.x(), 0.2)
        );
        yield* all(
            rectj.y(rectj.y() - jump, 0.1),
            recti.y(recti.y() + jump, 0.1)
        );
    }
});
