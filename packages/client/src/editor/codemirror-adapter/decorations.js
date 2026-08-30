import {StateEffect, StateField} from '@codemirror/state';
import {EditorView, Decoration} from '@codemirror/view';
import {positionToOffset} from './position.js';

export const setMarkEffect = StateEffect.define();
export const clearMarkEffect = StateEffect.define();
export const setLineEffect = StateEffect.define();
export const clearLineEffect = StateEffect.define();

export const markField = StateField.define({
    create: () => Decoration.none,
    update(decorations, transaction) {
        decorations = decorations.map(transaction.changes);
        
        for (const effect of transaction.effects) {
            if (effect.is(setMarkEffect))
                decorations = decorations.update({
                    add: [effect.value],
                    sort: true,
                });
            
            if (effect.is(clearMarkEffect))
                decorations = Decoration.none;
        }
        
        return decorations;
    },
    provide: (field) => EditorView.decorations.from(field),
});

export const lineField = StateField.define({
    create: () => Decoration.none,
    update(decorations, transaction) {
        decorations = decorations.map(transaction.changes);
        
        for (const effect of transaction.effects) {
            if (effect.is(setLineEffect)) {
                const {line, cls} = effect.value;
                const {from} = transaction.state.doc.line(line + 1);
                
                decorations = decorations.update({
                    add: [
                        Decoration
                            .line({
                                class: cls,
                            })
                            .range(from),
                    ],
                    sort: true,
                });
            }
            
            if (effect.is(clearLineEffect)) {
                const {line, cls} = effect.value;
                
                decorations = decorations.update({
                    filter: (from, _, decoration) => !(decoration.spec.class === cls && transaction.state.doc.lineAt(from).number === line + 1),
                });
            }
        }
        
        return decorations;
    },
    provide: (field) => EditorView.decorations.from(field),
});

export function markText(view, from, to, {className}) {
    const decoration = Decoration
        .mark({
            class: className,
        })
        .range(positionToOffset(view.state.doc, from), positionToOffset(view.state.doc, to));
    
    view.dispatch({
        effects: setMarkEffect.of(decoration),
    });
    return {
        clear: () => view.dispatch({
            effects: clearMarkEffect.of(null),
        }),
    };
}

export function addLineClass(view, line, _where, className) {
    view.dispatch({
        effects: setLineEffect.of({
            line,
            cls: className,
        }),
    });
}

export function removeLineClass(view, line, _where, className) {
    view.dispatch({
        effects: clearLineEffect.of({
            line,
            cls: className,
        }),
    });
}
