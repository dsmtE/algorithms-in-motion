import {makeProject} from '@motion-canvas/core';

import selectionSort from '../scenes/selectionSort?scene';

export default makeProject({
    scenes: [selectionSort],
    variables: {
        size: 8,
        seed: 42,
    },
});