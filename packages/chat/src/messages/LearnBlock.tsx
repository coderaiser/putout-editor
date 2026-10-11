import type {AppDispatch} from '#store/types';
import {useDispatch} from 'react-redux';
import type {LearnNode} from '@putout/editor-commands';
import {flattenLearn} from '@putout/editor-commands';
import {learnOpen} from '#store';
import {useIsMobile} from '../hooks/useIsMobile.ts';
import LearnTree from '../components/LearnTree.tsx';

export interface LearnBlockProps {
    tree: LearnNode[];
}

/**
 * The `/learn` reply: the concept tree in the thread.
 *
 * `AstBlock` is the model — props in, one dispatch out, no knowledge of the
 * thread. The one difference is that `AstTree` is handed `FlatNode[]` already
 * flattened by `runAst`, while `runLearn` answers with the *nested* tree (the
 * rows are derived from it wherever they are drawn), so the flattening happens
 * here, once, on the way in.
 *
 * `learnOpen` rather than two dispatches: the body and the `[try it →]` have to
 * land in that order, and the slice is where `addMessage` and `nextId` already
 * live. The row it dispatches carries `body` and `example`, so there is no
 * second lookup to get wrong.
 *
 * `useIsMobile` here rather than in `LearnTree`, for the reason `AstBlock`
 * gives: the answer is a property of the page, not of the tree.
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
