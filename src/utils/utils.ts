// Function to sort an array and return the permutation of indexes
export function sorted_permutation(array: number[]): number[] {
    return array.map((value, index) => { return { value, index } })
    .sort((a, b) => a.value - b.value)
    .map(({ index }) => index);
}

export function reverse_index_mapping(index_mapping: number[]): number[] {
    let reversed_index_mapping = Array(index_mapping.length);
    for (let i = 0; i < index_mapping.length; i++) {
        reversed_index_mapping[index_mapping[i]] = i;
    }
    return reversed_index_mapping;
}

type Iterableify<T> = { [K in keyof T]: Iterable<T[K]> }

export function* zip<T extends Array<any>>(
    ...toZip: Iterableify<T>
): Generator<T> {
    // Get iterators for all of the iterables.
    const iterators = toZip.map(i => i[Symbol.iterator]())

    while (true) {
        // Advance all of the iterators.
        const results = iterators.map(i => i.next())

        // If any of the iterators are done, we should stop.
        if (results.some(({ done }) => done)) {
            break
        }

        // We can assert the yield type, since we know none
        // of the iterators are done.
        yield results.map(({ value }) => value) as T
    }
}