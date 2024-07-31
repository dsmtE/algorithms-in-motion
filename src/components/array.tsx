import { Layout, LayoutProps, Rect, ShapeProps, Txt } from "@motion-canvas/2d/lib/components";
import { TimingFunction, easeInOutCubic } from "@motion-canvas/core/lib/tweening";
import { Color, ColorSignal } from "@motion-canvas/core/lib/types/Color";
import { initial, signal, colorSignal } from "@motion-canvas/2d/lib/decorators";
import { SignalValue, SimpleSignal } from "@motion-canvas/core/lib/signals";

import { makeRef } from "@motion-canvas/core/lib/utils";
import { all } from "@motion-canvas/core/lib/flow";
import { range } from "@motion-canvas/core/lib/utils";

import { Colors, textStyle } from "@/styles/styles";
import { ThreadGenerator } from "@motion-canvas/core";

export interface ArrayProps extends ShapeProps, LayoutProps {
    values?: SignalValue<number[]>;
    boxWidth?: SignalValue<number>;
    boxHeight?: SignalValue<number>;
    boxGap?: SignalValue<number>;
    boxRadius?: SignalValue<number>;
    boxStrokeWidth?: SignalValue<number>;
    highlightColor?: SignalValue<Color>;
    strokeColor?: SignalValue<Color>;
    fillColor?: SignalValue<Color>;
}

export class Array extends Layout {
    @initial([])
    @signal()
    public declare readonly values: SimpleSignal<number[], this>

    @initial(128)
    @signal()
    public declare readonly boxWidth: SimpleSignal<number, this>

    @initial(128)
    @signal()
    public declare readonly boxHeight: SimpleSignal<number, this>

    @initial(28)
    @signal()
    public declare readonly boxGap: SimpleSignal<number, this>

    @initial(4)
    @signal()
    public declare readonly boxRadius: SimpleSignal<number, this>

    @initial(8)
    @signal()
    public declare readonly boxStrokeWidth: SimpleSignal<number, this>

    @initial(new Color(Colors.blue))
    @colorSignal()
    public declare readonly highlightColor: ColorSignal<this>

    @initial(new Color(Colors.surface))
    @colorSignal()
    public declare readonly strokeColor: ColorSignal<this>

    @initial(new Color(Colors.background))
    @colorSignal()
    public declare readonly fillColor: ColorSignal<this>

    public length = () => this.values().length;

    public readonly rects: Rect[] = [];

    // @brief Pool to reduce playback lag in the animator
    public pool = range(64).map(i => (
        <Rect
            ref={makeRef(this.rects, i)}
            size={this.boxWidth()}
            lineWidth={this.boxStrokeWidth}
            stroke={Colors.surface}
            fill={this.fillColor}
            radius={this.boxRadius}
            // centering text
            alignItems={'center'}
            justifyContent={'center'}
        >
            <Txt
                text={() => this.values()[i].toString()}
                {...textStyle}
            />
        </Rect>
    ));

    public constructor(props?: ArrayProps) {
        super({
            layout: true,
            gap: () => this.boxGap(),
            // Find better way using children as spawner are deprecated
            spawner: () => {
                // log current time
                console.log(`spawner: ${Date.now()}`);
                return this.rects.slice(0, this.length());
            },
            ...props,
        });
    }

    public * highLightAt(Index: number, Duration: number, Color: Color = this.highlightColor(), Easing: TimingFunction = easeInOutCubic){
        yield * this.rects[Index].stroke(Color, Duration, Easing);
    }

    public * highLightAll(Duration: number, Color: Color = this.highlightColor(), Easing: TimingFunction = easeInOutCubic){
        yield* all(...range(this.values.length).map(i => this.highLightAt(i, Duration, Color, Easing)));
    }

    public * deHighLightAt(Index: number, Duration: number, Color: Color = this.strokeColor(), Easing: TimingFunction = easeInOutCubic){
        yield * this.rects[Index].stroke(Color, Duration, Easing);
    }

    public * deHighLightAll(Duration: number, Color: Color = this.strokeColor(), Easing: TimingFunction = easeInOutCubic){
        yield* all(...range(this.values.length).map(i => this.deHighLightAt(i, Duration, Color, Easing)));
    }

    public addLast(Value: number){
        this.values([...this.values(), Value]);
    }
    
    public removeLast(){
        this.values(this.values().slice(0, this.values().length - 1));
    }

    public addFirst(Value: number){
        this.values([Value, ...this.values()]);
    }

    public removeFirst(){
        this.values(this.values().slice(1));
    }

    public insertAt(Index: number, Value: number){
        this.values([...this.values().slice(0, Index), Value, ...this.values().slice(Index)]);
    }

    public removeAt(Index: number): number {
        const value = this.values()[Index];
        this.values([...this.values().slice(0, Index), ...this.values().slice(Index + 1)]);
        return value;
    }

    public * swap(
        Index1: number,
        Index2: number,
        AnimationFunction: (cloneIndex1: Rect, cloneIndex2: Rect) => ThreadGenerator){
        
        let clonedBox1 = this.rects[Index1].clone();
        let clonedBox2 = this.rects[Index2].clone();

        this.parent().add(clonedBox1);
        this.parent().add(clonedBox2);

        clonedBox1.absolutePosition(this.rects[Index1].absolutePosition());
        clonedBox2.absolutePosition(this.rects[Index2].absolutePosition());
        
        const box1InitialOpacity = this.rects[Index1].opacity();
        const box2InitialOpacity = this.rects[Index2].opacity();
        
        this.rects[Index1].opacity(0);
        this.rects[Index2].opacity(0);
        
        yield* AnimationFunction(clonedBox1, clonedBox2);

        clonedBox1.remove();
        clonedBox2.remove();
                
        // Dirty way to swap the rects preserving the rect styling

        // Swap the rect references to maintain the rect styling
        [this.rects[Index1], this.rects[Index2]] = [this.rects[Index2], this.rects[Index1]];
        
        // swap the children of the rects to maintain the text reference on values array
        let rects01Children = this.rects[Index1].children();
        this.rects[Index1].children(this.rects[Index2].children());
        this.rects[Index2].children(rects01Children);

        // Swap the values using array deep copy for signal array update
        let newValues = [...this.values()];
        [newValues[Index1], newValues[Index2]] = [newValues[Index2], newValues[Index1]];
        this.values(newValues);
        // As spawner depends on values signal, it will automatically update the children

        this.rects[Index1].opacity(box1InitialOpacity);
        this.rects[Index2].opacity(box2InitialOpacity);
    }

    public * swapUpDown(Index1: number, Index2: number, Duration: number){
        const bli = this.boxGap() + this.boxWidth();
        yield* this.swap(Index1, Index2, function* (cloneIndex1, cloneIndex2){
            yield* all(
                cloneIndex1.y(cloneIndex1.y() - bli, .5),
                cloneIndex2.y(cloneIndex2.y() - bli, .5),
            )

            yield* all(
                cloneIndex1.x(cloneIndex2.x(), Duration),
                cloneIndex2.x(cloneIndex1.x(), Duration),
            );

            yield* all(
                cloneIndex1.y(cloneIndex1.y() + bli, .5),
                cloneIndex2.y(cloneIndex2.y() + bli, .5),
            )
        }
        );
    }
}
