import {makeScene2D, Circle, Latex, is, Path, Rect, Curve, Layout, Line, Node, Txt, Shape} from '@motion-canvas/2d';
import {all, chain, createRef, delay, sequence, waitFor, Vector2, ThreadGenerator, Signal, createSignal, SimpleSignal, Reference} from '@motion-canvas/core';
import { Colors, textStyle } from "@/styles/styles";
import {Style as ArrayStyle, boxWidthGap} from "@/utils/ArrayConstants";

const AS = {...ArrayStyle};

function isNumber(text: string): boolean {
    return !isNaN(Number(text));
}

function infixToRPN(symbols: string[]): string[] {
    
    const precedence: Map<string, number> = new Map([
        ['+', 1],
        ['-', 1],
        ['*', 2],
        ['/', 2],
        ['^', 3],
    ]);

    const stack: string[] = [];
    const output: string[] = [];

    for (const symbol of symbols) {
        if (isNumber(symbol)) {
            // console.log("push to output: ", symbol);
            output.push(symbol);
        } else if (precedence.has(symbol)) {
            while (stack.length && precedence.get(stack[stack.length - 1]) >= precedence.get(symbol)) {
                // console.log("push from stack to output: ", stack[stack.length - 1]);
                output.push(stack.pop());
            }
            // console.log("push to stack: ", symbol);
            stack.push(symbol);
        } else if (symbol === '(') {
            stack.push(symbol);
        } else if (symbol === ')') {
            while (stack.length && stack[stack.length - 1] !== '(') {
                output.push(stack.pop());
            }
            stack.pop();
        }else {
            // console.log("unable to parse symbol: ", symbol);
        }
    }

    while (stack.length) {
        output.push(stack.pop());
    }

    return output;
}

function splitLatexExpression(text: string): string[] {
    return text.match(/(\\\w+)|(\d+)|./g) ?? [];
}

function splitInfixExpression(text: string): string[] {
    return text.match(/(\d+)|(\w+)|./g) ?? [];
}

function latexToInfix(latex: string): string {
    return latex
        .replace(/\\frac{([^}]+)}{([^}]+)}/g, "($1)/($2)") // fractions
        .replace(/\\left\(/g, "(") // open parenthesis
        .replace(/\\right\)/g, ")") // close parenthesis
        .replace(/[^\(](floor|ceil|(sin|cos|tan|sec|csc|cot)h?)\(([^\(\)]+)\)[^\)]/g, "($&)") // functions
        .replace(/([^(floor|ceil|(sin|cos|tan|sec|csc|cot)h?|\+|\-|\*|\/)])\(/g, "$1*(")
        .replace(/\)([\w])/g, ")*$1")
        .replace(/([0-9])([A-Za-z])/g, "$1*$2")
    ;
}

function* appearLatexCurve(latex: Latex): ThreadGenerator {
    let curves: Curve[] = latex.findAll(x => x instanceof Path || x instanceof Rect) as Curve[];
    curves.forEach(x=> x.end(0))
    latex.opacity(1);
    yield* waitFor(0.2);
    yield* sequence(0.1, ...curves.map(p => p.end(1, .5)))
}

function* convertToInfix(latex: Latex, duration: number): ThreadGenerator {
    yield* latex.tex(splitInfixExpression(latexToInfix(latex.tex().join(''))), duration);
}

function CenterSignal(element: Layout): SimpleSignal<Vector2> {
    return createSignal(() => element.topLeft().add(element.size().div(2)));
}

function Center(element: Layout): Vector2 {
    return element.topLeft().add(element.size().div(2));
}

export default makeScene2D(function* (view) {
    const LatexRef = createRef<Latex>();

    const screenRef = createRef<Node>();
    view.add(
        <Node {...view.size().scale(-0.5) } ref={screenRef}/>
    );

    const explanationText = createRef<Txt>();

    screenRef().add(
        <Txt
            ref={explanationText}
            text={'Reverse Polish Notation Evaluation'}
            position={view.topLeft().add(view.size().div(2))}
            fill={Colors.white}
            fontSize={48}
            opacity={0}
        />
    )

    view.fill(Colors.background);

    yield* explanationText().opacity(1, 1);

    // change view origin to top left
    // view.offset(-1);

    const margin = 30;

    const latexFormula = '1*5+4+\\frac{8+6}{9-2}';

    // test case
    // const latexFormulaSplit = ['1', '+', '5', '*', '4', '+', '\\frac', '{', '8', '+', '6', '}', '{', '9', '-', '2', '}'];

    screenRef().add(
    <Latex
        ref={LatexRef}
        // try changing these properties:
        fill={Colors.white}
        opacity={1}
        fontSize={64}
        position={Center(view)}
        tex={splitLatexExpression(latexFormula)}
    />,
    );

    // animation
    yield* all(
        explanationText().top(view.top().add([0, 40]), 1),
        appearLatexCurve(LatexRef())
    );


    // convert to infix
    yield* all(
        explanationText().text('Infix Expression', 1),
        convertToInfix(LatexRef(), 1),
    )

    yield* waitFor(1);

    yield* explanationText().text('Transform to RPN', 1);

    yield* waitFor(1);

    let bli = splitInfixExpression(latexToInfix(latexFormula));
    console.log(bli);
    console.log(infixToRPN(bli));

    let RPNSymbols = infixToRPN(LatexRef().tex());

    //add commas to separate symbols
    let RPNSymbolsWithCommas = RPNSymbols.flatMap((w, i) => i <= RPNSymbols.length-1 ? [w, ','] : [w]);
    yield* LatexRef().tex(RPNSymbolsWithCommas, 1);

    // Move to top left
    yield* sequence(
        0.4,
        explanationText().text('', 1),
        LatexRef().topLeft(view.topLeft().add(margin), 1),
    )

    // hide commas
    yield* sequence(0.1, ...LatexRef().findAll(is(Path)).filter((_, i) => i % 2).map(x => x.opacity(0, 1)));

    //remove latex elements
    LatexRef().remove();

    // symbols without commas
    let symbolsPaths: Path[] = LatexRef().findAll(is(Path)).filter((_, i) => i % 2 == 0);
    symbolsPaths = symbolsPaths

    //clone elements
    let symbolsPathsClones: Path[] = symbolsPaths.map(x=> x.clone());

    screenRef().add(symbolsPathsClones);
    // apply position and parent scale
    symbolsPathsClones.forEach((p, i) => p.absolutePosition(symbolsPaths[i].absolutePosition()));
    symbolsPathsClones.forEach((p, i) => p.scale(p.scale().mul(symbolsPaths[i].parent().scale())));

    // test anim
    // symbolsPathsClones.forEach(p => p.save());
    // yield* sequence(
    //     0.6,
    //     sequence(0.1, ...symbolsPathsClones.map(p => p.y(p.y() + 20, .4))),
    //     sequence(0.1, ...symbolsPathsClones.map(p => p.restore(.4))),
    // )

    const stackContainer = createRef<Layout>();
    const stackOutline = createRef<Rect>();

    const stackText = createRef<Txt>();

    type ShapeAndValue = {
        shape: Shape;
        value: string;
    };

    let stackElements: ShapeAndValue[] = [];

    screenRef().add(
        <Layout
            ref={stackContainer}
            opacity={0}
            bottomRight={view.bottomRight().sub(margin)}
            width={200}
            height={view.height() - 3*margin}
        />
    )

    screenRef().add(
        <Line
        points={[
            stackContainer().topLeft(),
            stackContainer().bottomLeft(),
            stackContainer().bottomRight(),
            stackContainer().topRight(),
        ]}
        ref={stackOutline}
        stroke={Colors.white}
        lineWidth={6}
        radius={8}
        opacity={0}
    />)

    screenRef().add(
        <Txt
            ref={stackText}
            text={'Stack'}
            position={stackContainer().top().sub([0, 20])}
            fill={Colors.white}
            fontSize={32}
            opacity={0}
        />
    )

    yield* all(stackOutline().opacity(1, 1), stackText().opacity(1, 1));

    yield* waitFor(0.5);

    for(let i = 0; i < RPNSymbols.length; i++) {
        let symbol = RPNSymbols[i];
        let symbolPath = symbolsPathsClones[i];

        // move symbol to center
        yield* symbolPath.topLeft(view.topLeft().add(view.size().div(2)), 1);

        //TODO display if it's a number or operator
        

        if(isNumber(symbol)) {
            //move to stack
            yield* symbolPath.position(stackContainer().bottom().add([0, -40 - stackElements.length * 80]), 1);
            stackElements.push({shape: symbolPath, value: symbol});
            console.log('pushed number: ', symbol);
            console.log('stackElements', stackElements);
        } else {
            // TODO: implement operator
            console.log('operator ', symbol);

            if(stackElements.length < 2) {
                console.log('not enough elements in stack');
                continue;
            }
            // // move two elements from stack to the right and left of the operator
            let right : ShapeAndValue = stackElements.pop();
            let left: ShapeAndValue = stackElements.pop();
            yield* all(
                right.shape.left(symbolPath.right().add([20, 0]), 1),
                left.shape.right(symbolPath.left().sub([20, 0]), 1),
            );

            console.log('left: ', left.value);
            console.log('right: ', right.value);
            // compute result
            let result = 0;
            switch(symbol) {
                case '+': result = Number(left.value) + Number(right.value); break;
                case '-': result = Number(left.value) - Number(right.value); break;
                case '*': result = Number(left.value) * Number(right.value); break;
                case '/': result = Number(left.value) / Number(right.value); break;
            }

            //create new LatexElement with result
            let resultTex = new Latex({
                tex: result.toString(),
                fill: Colors.white,
                fontSize: 64,
                position: symbolPath.position(),
                opacity: 0,
            });
            screenRef().add(resultTex);
            yield* all(
                right.shape.opacity(0, 1),
                left.shape.opacity(0, 1),
                symbolPath.opacity(0, 1),
                resultTex.opacity(1, 1),
            );

            // move result to stack
            yield* resultTex.position(stackContainer().bottom().add([0, -40 - stackElements.length * 80]), 1);
            stackElements.push({shape: resultTex, value: result.toString()});
        }

        yield* waitFor(0.5);
    }


});
