export const getScrollInfo = (view) => ({
    left: view.scrollDOM.scrollLeft,
    top: view.scrollDOM.scrollTop,
});

export function scrollTo(view, left, top) {
    view.scrollDOM.scrollLeft = left;
    view.scrollDOM.scrollTop = top;
}
