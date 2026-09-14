import {ErrorBoundary, type FallbackProps} from 'react-error-boundary';
import EditorASTTree from '../editor-ast-tree/index.tsx';

function ErrorFallback({error}: FallbackProps) {
    return (
        <div className="error-boundary"><p>{(error as Error).message}</p></div>
    );
}

export default function AstPanel() {
    return (
        <ErrorBoundary fallbackRender={ErrorFallback}>
            <EditorASTTree/>
        </ErrorBoundary>
    );
}