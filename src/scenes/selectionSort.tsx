import { makeScene2D } from "@motion-canvas/2d";
import { Rect, Txt, Layout, Node } from "@motion-canvas/2d/lib/components";
import { all, waitFor } from "@motion-canvas/core/lib/flow";
import {
    debug,
    makeRef,
    range,
    useRandom,
} from "@motion-canvas/core/lib/utils";
import {createRef, easeOutCubic, createSignal} from '@motion-canvas/core';
import { ThreadGenerator, Vector2 } from "@motion-canvas/core";

export default makeScene2D(function* (view) {
    const size: number = 12;
    const sizeOver10: number = size / 10;
    const squareSize: number = 150 / sizeOver10;
    const margin: number = 35 / sizeOver10;
    const fontSize: number = 75 / sizeOver10;

    const rects: Rect[] = [];
    const random = useRandom(Date.now());
    const sortingMapping: number[] = range(size);
    let numbers = range(size).map(_ => random.nextInt(1, 70));

    view.fill("#141414");

    const minIndex = createSignal(0);

    const compTxtRef = createRef<Txt>();
    const rectsContainer = createRef<Node>();

    const fillColor = "#e3242b";
    const sortedColor = "2832c2";
    const validatedColor = "#2be324";
    const compareColor = "#e6a700";

    view.add(
        <>
        <Node ref={rectsContainer}> </Node>
        <Txt
            fill={"fff"}
            x = {0}
            y = {200}
            text={createSignal(() => "minIndex = " + minIndex().toString())}
        ></Txt>
        </>
    );

    rectsContainer().add(
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
                alignItems={'center'}
                justifyContent={'space-around'}
            >
                <Txt
                    fontSize={fontSize}
                    text={numbers[i].toString()}
                    fill={"#f0f0f0"}
                />
            </Rect>
        ))
    )
    view.add(
        <Txt
            ref={compTxtRef}
            fill={'#fff'}
            opacity={0}
            text={">"}
        ></Txt>
    );

    yield* waitFor(0.5);
    
    for (let i = 0; i < size; i++) {

        let curent_i = i;
        minIndex(i);

        rects[sortingMapping[i]].save()

        yield* up(i);

        for (let j = i + 1; j < size - 1; j++) {
            
            rects[sortingMapping[j]].save()

            yield* rects[sortingMapping[j]].fill(compareColor, 0.4)

            if (numbers[sortingMapping[minIndex()]] > numbers[sortingMapping[j]]) {
                rects[sortingMapping[minIndex()]].restore(0.2)
                minIndex(j)

                rects[sortingMapping[minIndex()]].save()
                yield* up(minIndex())

                yield* waitFor(0.6)
            }

            yield* rects[sortingMapping[j]].fill(fillColor, 0.4)
        }
        
        rects[sortingMapping[minIndex()]].restore(0.2)
        yield* swap(curent_i, minIndex());

        // Change color of sorted element
        yield* rects[sortingMapping[curent_i]].fill(sortedColor, 0.2)
    }

    for (let i = 0; i < size; i++) {
        yield* rects[sortingMapping[i]].fill(validatedColor, 0.15);
    }
    
    function* up(i: number): ThreadGenerator {
        yield* all(
            rects[sortingMapping[i]].fill(compareColor, 0.2),
            rects[sortingMapping[i]].y(rects[sortingMapping[i]].y() - squareSize, 0.2),
        )
    }


    function* swap(
        i: number,
        j: number,
    ): ThreadGenerator {
    
        let temp2 = sortingMapping[j];
        sortingMapping[j] = sortingMapping[i];
        sortingMapping[i] = temp2;

        let recti = rects[sortingMapping[i]];
        let rectj = rects[sortingMapping[j]];
        
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
