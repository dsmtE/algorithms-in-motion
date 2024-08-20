import { Layout, makeScene2D } from "@motion-canvas/2d";
import { Rect, Txt } from "@motion-canvas/2d/lib/components";
import { all, sequence, waitFor } from "@motion-canvas/core/lib/flow";
import { makeRef, range, useRandom, useScene } from "@motion-canvas/core/lib/utils";
import {createRef, easeOutCubic, Promisable, Thread} from '@motion-canvas/core';
import { ThreadGenerator, Vector2 } from "@motion-canvas/core";

import {Style as ArrayStyle, boxWidthGap} from "@/utils/ArrayConstants";
import { Colors, textStyle } from "@/styles/styles";
import { create_outline, pos_topleft_within } from "@/utils/motion";

const AS = {...ArrayStyle};

function get_rect_value(rect: Rect): number {
    return parseInt(rect.childAs<Txt>(0).text(), 10)
}

export default makeScene2D(function* (view) {
    const seed = useScene().variables.get('seed', 44);
    const size = useScene().variables.get('size', 9)();
    const random = useRandom(seed());

    const rects: Rect[] = []; // Array of Rects

    const main_container = createRef<Layout>();
    const main_outline = createRef<Rect>();

    const comparaison_symbol_ref = createRef<Txt>();

    view.fill(Colors.background);

    view.add(
        <Layout
            ref={main_container}
            opacity={1}
            width={size * boxWidthGap(AS) - AS.boxGap}
            height={AS.boxWidth}
        />
    )

    view.add(create_outline(main_container, main_outline, Colors.surface, AS.outlineMargin, 1));

    // Create Rects
    view.add(
        range(size).map(_ => random.nextInt(1, 70)).map((value, i) => (
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
                text={value.toString()}
                {...textStyle}
            />
        </Rect>
        ))
    )

    view.add(<Txt ref={comparaison_symbol_ref} text={'>'} {...textStyle} padding={[0, 20]} opacity={0} /> );

    yield waitFor(0.5);

    let swapped = false;

    for (let i = 0; i < size; i++) {
        swapped = false;

        for (let j = 0; j < size - i - 1; j++) {

            // Color for comparaison
            yield* all(
                rects[j].stroke(Colors.blue, 0.2),
                rects[j+1].stroke(Colors.blue, 0.2)
            );


            let greater_than = get_rect_value(rects[j]) > get_rect_value(rects[j+1]);
            
            // Compare with next
            comparaison_symbol_ref().text(greater_than ? '>' : '<');
            comparaison_symbol_ref().position(rects[j+1].position().add(rects[j].position()).div([2, 2]));
        
            rects[j].save();
            rects[j+1].save();
            comparaison_symbol_ref().save();
            
            let jump = boxWidthGap(AS) + AS.boxWidth;
            yield* all(
                rects[j].y(rects[j].y() - jump, 0.2),
                rects[j+1].y(rects[j+1].y() - jump, 0.2),
                comparaison_symbol_ref().y(comparaison_symbol_ref().y() - jump, 0.2),
            );
        
            yield* all(
                rects[j].x(rects[j].x() - AS.boxGap, 0.2, easeOutCubic),
                rects[j+1].x(rects[j+1].x() + AS.boxGap, 0.2, easeOutCubic),
                comparaison_symbol_ref().opacity(1.0, 0.2),
            )
        
            yield* waitFor(0.2);
    
            let color = greater_than ? Colors.red : Colors.green;
            yield* all(
                rects[j].stroke(color, 0.3),
                rects[j+1].stroke(color, 0.3),
                comparaison_symbol_ref().fill(color, 0.3),
            )
            yield* waitFor(0.4); 
    
            yield* all(
                comparaison_symbol_ref().restore(0.2),
                rects[j].restore(0.2),
                rects[j+1].restore(0.2),
            );
            
            // Swap if needed
            if(greater_than) {
                swapped = true;
                yield* swap(j, j+1)
            }

            // Reset color
            yield* all(
                rects[j].stroke(Colors.surface, 0.2),
                rects[j+1].stroke(Colors.surface, 0.2)
            );
        }

        // If no swap, validate all and break
        if (!swapped) {

            const no_more_swap = createRef<Txt>();
            view.add(
                <Txt {...textStyle} y={200}
                    ref={no_more_swap}
                    text={'No more swap, no need to continue the array is sorted!'}
                />
            )

            no_more_swap().save();
            no_more_swap().opacity(0);
            no_more_swap().y(no_more_swap().y() + 50);
        
            yield* no_more_swap().restore(0.3);

            yield* waitFor(0.5);

            yield* sequence(0.1, ...rects.slice(0, size-i).map(rect => rect.stroke(Colors.green, 0.3)))
            
            yield* waitFor(0.5);
            yield* no_more_swap().opacity(0, 0.3);
            no_more_swap().remove();

            break;
        }
        else
        {
            // Change color of sorted element
            yield* rects[size-i-1].stroke(Colors.green, 0.2)
        }
    }

    yield* all(
        sequence(0.1, ...rects.map(rect => rect.fill(Colors.green, 0.3))),
        sequence(0.1, ...rects.map(rect => rect.stroke(Colors.surface, 0.3))),
    )

    function* swap(i: number, j: number): ThreadGenerator {
        [rects[i], rects[j]] = [rects[j], rects[i]];
        let jump = boxWidthGap(AS);

        yield* all(
            rects[j].y(rects[j].y() + jump, 0.1),
            rects[i].y(rects[i].y() - jump, 0.1)
        );
    
        yield* all(
            rects[j].x(rects[i].x(), 0.3),
            rects[i].x(rects[j].x(), 0.3)
        );
        yield* all(
            rects[j].y(rects[j].y() - jump, 0.1),
            rects[i].y(rects[i].y() + jump, 0.1)
        );
    }
});
