import {makeProject} from '@motion-canvas/core';

import mergeSort_intro from '../scenes/mergeSort/mergeSort_intro?scene';
import mergePhase from '../scenes/mergeSort/mergePhase?scene';
import recursiveMergeSort from '../scenes/mergeSort/recursiveMergeSort?scene';

export default makeProject({
    scenes: [mergeSort_intro, mergePhase, recursiveMergeSort],
});