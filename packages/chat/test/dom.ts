/**
 * The texts of every element matching `selector`, in document order.
 *
 * `Array.from(nodeList).map((element) => element.textContent)` rather than
 * `[...nodeList].map(({textContent}) => textContent)`: pulling a method off an
 * element and calling it detached loses `this`, which happy-dom's
 * `getAttribute` needs. Every spec that reads the DOM goes through here so the
 * trap is in one place.
 */
export const textsOf = (selector: string): (string | null)[] => {
    const result: (string | null)[] = [];
    
    for (const element of document.querySelectorAll(selector))
        result.push(element.textContent);
    
    return result;
};
