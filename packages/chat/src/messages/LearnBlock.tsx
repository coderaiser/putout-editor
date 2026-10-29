import {useDispatch} from 'react-redux';
import {type LearnNode, flattenLearn} from '@putout/editor-commands';
import type {AppDispatch} from '#store/types';
import {learnOpen} from '#store';
import {useIsMobile} from '../hooks/useIsMobile.ts';
import LearnTree from '../components/LearnTree.tsx';

export interface LearnBlockProps {
    tree: LearnNode[];
}

/**
 * The `/learn` answer. Like `AstBlock`, but `runLearn` returns a nested
 * tree, so it is flattened here. `learnOpen` adds the body and `[try it →]`
 * in order. `useIsMobile` is here: it is a page property.
 */
export default function LearnBlock({tree}: LearnBlockProps) {
    // `useDispatch<AppDispatch>()` rather than a bare `useDispatch()`: the bare
    // form is typed `Dispatch<UnknownAction>` and refuses a thunk, which is
    // exactly what `learnOpen` is.
    const dispatch = useDispatch<AppDispatch>();
    const mobile = useIsMobile();
    
    return (
        <div className="learn-block">
            <LearnTree
                mobile={mobile}
                nodes={flattenLearn(tree)}
                onOpen={(node) => dispatch(learnOpen(node))}
            />
        </div>
    );
}
