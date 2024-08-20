import { Circle, FlexContent, FlexItems, Layout, Line, makeScene2D } from "@motion-canvas/2d";
import { Rect, Txt, Node} from "@motion-canvas/2d/lib/components";
import { all, sequence, waitFor } from "@motion-canvas/core/lib/flow";
import { createRefArray, makeRef, range, Reference, ReferenceArray, useRandom, useScene } from "@motion-canvas/core/lib/utils";
import {Color, createRef, createSignal, Spacing} from '@motion-canvas/core';
import { Colors, textStyle } from "@/styles/styles";
import {Style as ArrayStyle, boxWidthGap} from "@/utils/ArrayConstants";
import { sorted_permutation, reverse_index_mapping, zip } from "@/utils/utils";
import { create_outline } from "@/utils/motion";

const AS = {...ArrayStyle};
AS.boxWidth /= 1.2;
AS.boxGap /= 1.5;

function pos_topleft_within(ref: Reference<Layout>, i: number, offset: number) {
    return () => ref().topLeft().addX(i * offset)
}
function pos_bottomleft_within(ref: Reference<Layout>, i: number, offset: number) {
    return () => ref().bottomLeft().addX(i * offset)
}

function create_splitted_container(
    target_container: Reference<Layout>,
    left_size: number,
    right_size: number,
    output_left_ref: Reference<Layout>,
    output_right_ref: Reference<Layout>,
    y_offset: number = 4*AS.outlineMargin,
    center_space: number = 2*AS.boxWidth,
    opacity: number = 1,
) {
    return [
        <Layout
            ref={output_left_ref}
            opacity={opacity}
            topLeft={() => target_container().bottomLeft().addX(-center_space/2).addY(y_offset)}
            width={left_size * boxWidthGap(AS) - AS.boxGap}
            height={() =>target_container().height()}
        />,
        <Layout
            ref={output_right_ref}
            opacity={opacity}
            topRight={() => target_container().bottomRight().addX(center_space/2).addY(y_offset)}
            width={right_size * boxWidthGap(AS) - AS.boxGap}
            height={() =>target_container().height()}
        />
        ];
}

function lines_children_chain(ref: Reference<Layout>, line_style: Object): Node[] {
    return range(ref().children().length-1).map(i => (
        <Line points={[
            (ref().children()[i] as Layout).right().transformAsPoint(ref().localToParent()),
            (ref().children()[i+1] as Layout).left().transformAsPoint(ref().localToParent())
        ]} {...line_style} />
    ))
}

export default makeScene2D(function* (view) {
    const seed = useScene().variables.get('seed', 42);
    const size = useScene().variables.get('size', 7)();

    const random = useRandom(seed());
    const halfSize = Math.floor(size / 2);
    
    let values = range(size).map(_ => random.nextInt(1, 99));

    const rects: Rect[] = []; // Array of Rects
    
    const main_container = createRef<Layout>();
    const main_outline = createRef<Rect>();

    const first_container = createRef<Layout>();
    const first_outline = createRef<Rect>();

    const second_container = createRef<Layout>();
    const second_outline = createRef<Rect>();

    view.fill(Colors.background);

    view.add(
        <Layout
            ref={main_container}
            opacity={1}
            width={values.length * boxWidthGap(AS) - AS.boxGap}
            y={-view.height()/2 + AS.boxWidth+ 2*AS.outlineMargin}
            height={AS.boxWidth}
        />
    )

    view.add(create_splitted_container(
        main_container,
        halfSize,
        values.length-halfSize,
        first_container,
        second_container,
    ))

    view.add([
        create_outline(main_container, main_outline, Colors.surface, AS.outlineMargin, 1),
        create_outline(first_container, first_outline, Colors.cyan, AS.outlineMargin, 1),
        create_outline(second_container, second_outline, Colors.yellow, AS.outlineMargin, 1)
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
            topLeft={pos_topleft_within(main_container,i, boxWidthGap(AS))}
        
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

    const i_circle = createRef<Circle>();
    const j_circle = createRef<Circle>();
    const k_circle = createRef<Circle>();

    view.add(Array.from(zip(
        [i_circle, j_circle, k_circle],
        [Colors.cyan, Colors.yellow, Colors.pink])).map(([circle_ref, color]) => (
            <Circle
            ref={circle_ref}
            fill={color}
            stroke={new Color(color).darken(2)}
            size={20}
            lineWidth={4}
            opacity={0}
        />
    )));

    const graph_algo = createRef<Layout>();

    const i_less_j_condition_ref = createRef<Layout>();

    const i_number_ref = createRef<Layout>();
    const j_number_ref = createRef<Layout>();
    const inferior_sign_ref = createRef<Txt>();

    const i_less_j_group_ref = createRef<Layout>();
    const j_less_i_group_ref = createRef<Layout>();

    const while_condition_ref = createRef<Rect>();

    const k_plus_one_ref = createRef<Rect>();

    const box_style = {
        lineWidth: 5,
        stroke: Colors.white,
        radius: 10,
        padding: new Spacing(5, 15),
        layout:true,
        alignItems:'center' as FlexItems,
        justifyContent:'center' as FlexContent,
    };

    const line_style = {
        lineWidth:5,
        stroke:Colors.white,
        lineDash:[5, 5],
        radius:5,
        //endArrow:true
    };

    view.add(
        <Layout ref={graph_algo}>
            <Rect ref={i_less_j_condition_ref} {...box_style}
                x={-600} y={200}
            >
                <Layout ref={i_number_ref} width={20} padding={[0, 30]}/>
                <Txt ref={inferior_sign_ref} text={'<'} {...textStyle} padding={[0, 20]} opacity={0} />
                <Layout ref={j_number_ref} width={20} padding={[0, 30]} />
            </Rect>

            <Layout
                ref={i_less_j_group_ref}
                layout={true}
                gap={40}
                left={() => i_less_j_condition_ref().right().addX(100).addY(-70)}
            >
                <Rect {...box_style} opacity={0.5}>
                    <Txt text={'['} {...textStyle} />
                    <Circle fill={Colors.cyan} stroke={new Color(Colors.cyan).darken(2)} size={20} lineWidth={5} />
                    <Txt text={'] < ['} {...textStyle} />
                    <Circle fill={Colors.yellow} stroke={new Color(Colors.yellow).darken(2)} size={20} lineWidth={5} />
                    <Txt text={']'} {...textStyle} />
                </Rect>
                <Rect {...box_style} opacity={0.5}>
                    <Txt text={'['} {...textStyle} />
                    <Circle fill={Colors.pink} stroke={new Color(Colors.pink).darken(2)} size={20} lineWidth={5} />
                    <Txt text={'] = ['} {...textStyle} />
                    <Circle fill={Colors.cyan} stroke={new Color(Colors.cyan).darken(2)} size={20} lineWidth={5} />
                    <Txt text={']'} {...textStyle} />
                </Rect>
                <Rect {...box_style} opacity={0.5}>
                    <Circle fill={Colors.cyan} stroke={new Color(Colors.cyan).darken(2)} size={20} lineWidth={5} />
                    <Txt text={' + 1'} {...textStyle} padding={[0, 20]} />
                </Rect>
            </Layout>
            <Line points={[i_less_j_condition_ref().right(), i_less_j_group_ref().left()]} {...line_style} />

            <Layout
                ref={j_less_i_group_ref}
                layout={true}
                gap={40}
                left={() => i_less_j_condition_ref().right().addX(100).addY(70)}
            >
                <Rect {...box_style} opacity={0.5}>
                    <Txt text={'['} {...textStyle} />
                    <Circle fill={Colors.cyan} stroke={new Color(Colors.cyan).darken(2)} size={20} lineWidth={5} />
                    <Txt text={'] > ['} {...textStyle} />
                    <Circle fill={Colors.yellow} stroke={new Color(Colors.yellow).darken(2)} size={20} lineWidth={5} />
                    <Txt text={']'} {...textStyle} />
                </Rect>

                <Rect {...box_style} opacity={0.5}>
                    <Txt text={'['} {...textStyle} />
                    <Circle fill={Colors.pink} stroke={new Color(Colors.pink).darken(2)} size={20} lineWidth={5} />
                    <Txt text={'] = ['} {...textStyle} />
                    <Circle fill={Colors.yellow} stroke={new Color(Colors.yellow).darken(2)} size={20} lineWidth={5} />
                    <Txt text={']'} {...textStyle} />
                </Rect>

                <Rect {...box_style} opacity={0.5}>
                    <Circle fill={Colors.yellow} stroke={new Color(Colors.yellow).darken(2)} size={20} lineWidth={5} />
                    <Txt text={' + 1'} {...textStyle} padding={[0, 20]} />
                </Rect>
            </Layout>
            <Line points={() => [i_less_j_condition_ref().right(), j_less_i_group_ref().left()]} {...line_style} />

            <Rect
                ref={k_plus_one_ref}
                {...box_style}
                opacity={0.5}
                left={() => i_less_j_group_ref().right().addX(100).addY(70)}
                >
                <Circle fill={Colors.pink} stroke={new Color(Colors.pink).darken(2)} size={20} lineWidth={5} />
                <Txt text={' + 1'} {...textStyle} padding={[0, 20]} />
            </Rect>

            <Line {...line_style} points={() => [
                i_less_j_group_ref().childAs<Layout>(2).right().transformAsPoint(i_less_j_group_ref().localToParent()),
                k_plus_one_ref().left()]} />
            <Line {...line_style} points={() => [
                j_less_i_group_ref().childAs<Layout>(2).right().transformAsPoint(j_less_i_group_ref().localToParent()),
                k_plus_one_ref().left
            ]} />

            <Layout ref={while_condition_ref} opacity={0.5} >
            <Rect {...box_style} position={j_less_i_group_ref().bottom().addY(100)}>
                <Txt text={'While'} {...textStyle} padding={[0, 20]} />
                <Circle fill={Colors.cyan} stroke={new Color(Colors.cyan).darken(2)} size={20} lineWidth={5} />
                <Txt text={'< size('} {...textStyle} paddingLeft={20} />
                <Rect fill={Colors.cyan} stroke={new Color(Colors.cyan).darken(2)} size={[60, 30]} radius={10} lineWidth={5} />
                <Txt text={') &&'} {...textStyle} paddingRight={20} />
                <Circle fill={Colors.yellow} stroke={new Color(Colors.yellow).darken(2)} size={20} lineWidth={5} />
                <Txt text={'< size('} {...textStyle} paddingLeft={20}/>
                <Rect fill={Colors.yellow} stroke={new Color(Colors.yellow).darken(2)} size={[60, 30]} radius={10} lineWidth={5} />
                <Txt text={')'} {...textStyle} />
            </Rect>

            <Line {...line_style} radius={200} points={() => [
                k_plus_one_ref().bottom(),
                [k_plus_one_ref().bottom().x, while_condition_ref().childAs<Rect>(0).right().y],
                while_condition_ref().childAs<Rect>(0).right()]} />

            <Line {...line_style} radius={200} endArrow points={() => [
                while_condition_ref().childAs<Rect>(0).left(),
                [i_less_j_condition_ref().bottom().x, while_condition_ref().childAs<Rect>(0).left().y],
                i_less_j_condition_ref().bottom()]} />

            </Layout>
        </Layout>
    )
    graph_algo().add(lines_children_chain(i_less_j_group_ref, line_style))
    graph_algo().add(lines_children_chain(j_less_i_group_ref, line_style))

    // Split in two arrays
    yield* all(
        sequence(0.1, ...rects.slice(0, halfSize).map(rect => rect.stroke(Colors.cyan, 0.1))),
        sequence(0.1, ...rects.slice(halfSize).map(rect => rect.stroke(Colors.yellow, 0.1))),
    )

    // move in sub Arrays
    yield* all(
        sequence(0.1, ...rects.slice(0, halfSize).map((rect, i) => 
                rect.topLeft(pos_topleft_within(first_container,i, boxWidthGap(AS)), 0.2)
        )),
        sequence(0.1, ...rects.slice(halfSize).map((rect, i) => 
                rect.topLeft(pos_topleft_within(second_container,i, boxWidthGap(AS)), 0.2)
        )),
    );

    // sort the sub Arrays
    {
    const sorting_mapping = reverse_index_mapping([
        ...sorted_permutation(values.slice(0, halfSize)),
        ...sorted_permutation(values.slice(halfSize)).map(i => i + halfSize)
    ]);

    const splitRectsPosition = rects.map(rect => rect.position());
    yield* all(...sorting_mapping.map((target_index, i) => rects[i].position(splitRectsPosition[target_index], 0.2)));

    // swap rect and values references
    const tempRects = [...rects];
    sorting_mapping.forEach((targetIndex, i) => rects[targetIndex] = tempRects[i]);
    const tempValues = [...values];
    sorting_mapping.forEach((targetIndex, i) => values[targetIndex] = tempValues[i]);
    }

    // Restore rect stroke
    yield* all(
        sequence(0.1, ...rects.slice(0, halfSize).map(rect => rect.stroke(Colors.surface, 0.1))),
        sequence(0.1, ...rects.slice(halfSize).map(rect => rect.stroke(Colors.surface, 0.1))),
    )
    yield* all(...[first_outline, second_outline].map(outline => outline().stroke(Colors.surface, 0.1)))

    // fusion algorithm

    const i_index = createSignal(0);
    const j_index = createSignal(0);
    const k_index = createSignal(0);

    i_circle().position(() => pos_bottomleft_within(first_container, Math.min(i_index(), halfSize-1), boxWidthGap(AS))()
    .addX(AS.boxWidth/2).addY(AS.outlineMargin) );

    j_circle().position(() => pos_bottomleft_within(second_container, Math.min(j_index(), size-halfSize-1), boxWidthGap(AS))()
    .addX(AS.boxWidth/2).addY(AS.outlineMargin) );

    k_circle().position(() => pos_topleft_within(main_container, Math.min(k_index(), size-1), boxWidthGap(AS))()
    .addX(AS.boxWidth/2).addY(-AS.outlineMargin) );

    yield* all(...[i_circle, j_circle, k_circle].map(x => x().opacity(1, 0.3)))

    let sorting_mapping = Array(size);

    while(i_index() < halfSize && j_index() < size - halfSize) {

        rects[i_index()].save();
        rects[j_index()+halfSize].save();

        //copy text and move then
        const first_txt_clone = rects[i_index()].childAs<Txt>(0).clone();
        const second_txt_clone = rects[j_index()+halfSize].childAs<Txt>(0).clone();

        first_txt_clone.position(rects[i_index()].childAs<Txt>(0).absolutePosition().transformAsPoint(view.worldToLocal()));
        second_txt_clone.position(rects[j_index()+halfSize].childAs<Txt>(0).absolutePosition().transformAsPoint(view.worldToLocal()));

        view.add([first_txt_clone, second_txt_clone]);

        yield* all(
            rects[i_index()].stroke(Colors.cyan, 0.3),
            rects[j_index()+halfSize].stroke(Colors.yellow, 0.3),
            first_txt_clone.absolutePosition(i_number_ref().absolutePosition(), 0.3),
            first_txt_clone.fill(Colors.cyan, 0.3),
            second_txt_clone.absolutePosition(j_number_ref().absolutePosition(), 0.3),
            second_txt_clone.fill(Colors.yellow, 0.3),
        );

        let iLessThanY = values[i_index()] < values[j_index()+halfSize];

        inferior_sign_ref().text(iLessThanY? '<': '>');
        

        const target_group = iLessThanY ? i_less_j_group_ref: j_less_i_group_ref;

        // save state for opacity animation
        target_group().children().forEach(child => child.save());
        k_plus_one_ref().save();

        yield* all(
            inferior_sign_ref().opacity(1, 0.3),
            target_group().children()[0].opacity(1, 0.3),
        )

        yield* waitFor(0.5);

        // move the rect in the main container
        target_group().children()[1].save();
        yield* target_group().children()[1].opacity(1, 0.3);

        yield* all(
            rects[i_index()].restore(0.3),
            rects[j_index()+halfSize].restore(0.3),
            (iLessThanY ? rects[i_index()]:rects[j_index()+halfSize]).topLeft(pos_topleft_within(main_container, k_index(), boxWidthGap(AS)), 0.3),
        )

        yield* target_group().children()[2].opacity(1, 0.3);

        // track the mapping for sorting rect
        sorting_mapping[k_index()] = iLessThanY ? i_index(): j_index()+halfSize;

        // Increment i or j
        yield* (iLessThanY?i_index:j_index)((iLessThanY?i_index:j_index)() + 1, 0.3)

        yield* k_plus_one_ref().opacity(1, 0.3);

        if(k_index() < size-1) {
            yield* k_index(k_index() + 1, 0.3);
        }

        while_condition_ref().save();
        yield* while_condition_ref().opacity(1, 0.3);

        if (!(i_index() < halfSize && j_index() < size - halfSize)) {
            yield* while_condition_ref().childAs<Rect>(0).stroke(Colors.red, 0.3);
            yield* waitFor(0.5);
        }

        // restore states and hide/remove the text
        yield* all(
            inferior_sign_ref().opacity(0, 0.3),
            first_txt_clone.opacity(0, 0.3),
            second_txt_clone.opacity(0, 0.3),

            sequence(0.1,
            ...target_group().children().map(child => child.restore(0.3)),
            k_plus_one_ref().restore(0.3),
            while_condition_ref().restore(0.3)
            )
        );

        first_txt_clone.remove()
        second_txt_clone.remove()
    
        yield* waitFor(0.5);
    }

    yield* all(
        graph_algo().opacity(0, 0.3),
        graph_algo().y(graph_algo().y() + 50, 0.4),
    )

    graph_algo().remove();

    // Move the remaining elements

    const remaining_element_txt_ref = createRef<Txt>();
    view.add(
        <Txt {...textStyle} y={200}
            ref={remaining_element_txt_ref}
            text={'Move remaining elements'}
        />
    )

    remaining_element_txt_ref().save();
    remaining_element_txt_ref().opacity(0);
    remaining_element_txt_ref().y(remaining_element_txt_ref().y() + 50);

    yield* remaining_element_txt_ref().restore(0.3);

    yield* waitFor(0.5);

    const target_outline = i_index() < halfSize ? first_outline: second_outline;

    target_outline().save()
    yield* target_outline().stroke((target_outline().stroke() as Color).brighten(4), 0.4)
    yield* target_outline().restore(0.4)

    const remaining_rects = (i_index() < halfSize ? rects.slice(i_index(), halfSize): rects.slice(halfSize+j_index()));

    // push index in sorting_mapping
    remaining_rects.forEach((_, i) => sorting_mapping[k_index()+i] = i_index() < halfSize ? i_index()+i: halfSize+j_index()+i);
    
    yield* all(
        sequence(0.1, ...remaining_rects.map(
            (rect, i) => rect.topLeft(pos_topleft_within(main_container, k_index()+i, boxWidthGap(AS)), 0.4),
        )),
        k_index(size, 0.2*(size-k_index())),
        i_index() < halfSize ? i_index(halfSize, 0.2*(halfSize-i_index())): j_index(size-halfSize, 0.2*(size-halfSize-j_index())),
    )

    yield* all(
        ...[i_circle, j_circle, k_circle, first_outline, second_outline].map(x => x().opacity(0, 0.3)),
    )

    // why right container is not moving following the main container ?
    // opacity to 0 before moving to fix it
    yield* all(
        remaining_element_txt_ref().opacity(0, 0.3),
        remaining_element_txt_ref().y(remaining_element_txt_ref().y() + 50, 0.3),
        main_container().y(0, 0.3),
    )

    sorting_mapping = reverse_index_mapping(sorting_mapping)
    // swap rect and values references
    const tempRects = [...rects];
    sorting_mapping.forEach((targetIndex, i) => rects[targetIndex] = tempRects[i]);
    const tempValues = [...values];
    sorting_mapping.forEach((targetIndex, i) => values[targetIndex] = tempValues[i]);

    // color green
    yield* sequence(0.1, ...rects.map(rect => rect.fill(Colors.green, 0.3)))
});