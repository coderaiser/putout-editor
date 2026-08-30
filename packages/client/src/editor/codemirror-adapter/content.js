export function setValue(view, value) {
    view.dispatch({
        changes: {
            from: 0,
            to: view.state.doc.length,
            insert: value,
        },
    });
}

export const getValue = (view) => view.state.doc.toString();
export const getDocValue = getValue;
export const setDocValue = setValue;
