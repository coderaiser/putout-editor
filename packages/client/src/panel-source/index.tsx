import {ErrorBoundary, type FallbackProps} from 'react-error-boundary';
import EditorSource from '../editor-source/index.tsx';

function ErrorFallback({error}: FallbackProps) {
    return (
        <div className="error-boundary"><p>{(error as Error).message}</p></div>
    );
}

export default function SourcePanel() {
    return (
        <ErrorBoundary fallbackRender={ErrorFallback}>
            <EditorSource/>
        </ErrorBoundary>
    );
}