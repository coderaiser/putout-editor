import {
    StateEffect,
    StateField,
    type Range,
    type Transaction,
} from '@codemirror/state';
import {
    EditorView,
    Decoration,
    type DecorationSet,
} from '@codemirror/view';
import {positionToOffset} from './position.ts';
import type {SourcePosition} from '../../types.ts';

const noop = () => {};

export const setMarkEffect = StateEffect.define<Range<Decoration>>();
export const clearMarkEffect = StateEffect.define<null>();
export const setLineEffect = StateEffect.define<{
    line: number;
    cls: string;
}>();
export const clearLineEffect = StateEffect.define<{
    line: number;
    cls: string;
}>();

export const markField = StateField.define<DecorationSet>({
    create: () => Decoration.none,
    update(decorations, transaction: Transaction) {
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

export const lineField = StateField.define<DecorationSet>({
    create: () => Decoration.none,
    update(decorations, transaction: Transaction) {
        decorations = decorations.map(transaction.changes);
        
        for (const effect of transaction.effects) {
            if (effect.is(setLineEffect)) {
                const {line, cls} = effect.value;
                const {from} = transaction.state.doc.line(Math.min(line + 1, transaction.state.doc.lines));
                
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
    provide: (field: StateField<DecorationSet>) => EditorView.decorations.from(field),
});

export type MarkHandle = {
    clear: () => void;
};

export function markText(view: EditorView, from: SourcePosition, to: SourcePosition, {className}: {className: string;}): MarkHandle {
    const fromOffset = positionToOffset(view.state.doc, from);
    const toOffset = positionToOffset(view.state.doc, to);
    
    if (fromOffset === null || toOffset === null || fromOffset === toOffset)
        return {
            clear: noop,
        };
    
    const decoration = Decoration
        .mark({
            class: className,
        })
        .range(fromOffset, toOffset);
    
    view.dispatch({
        effects: setMarkEffect.of(decoration),
    });
    
    return {
        clear: () => view.dispatch({
            effects: clearMarkEffect.of(null),
        }),
    };
}

export function addLineClass(view: EditorView, line: number, _where: string, className: string): void {
    view.dispatch({
        effects: setLineEffect.of({
            line,
            cls: className,
        }),
    });
}

export function removeLineClass(view: EditorView, line: number, _where: string, className: string): void {
    view.dispatch({
        effects: clearLineEffect.of({
            line,
            cls: className,
        }),
    });
}
