import {ErrorBoundary} from 'react-error-boundary';
import EditorSource from '../editor-source/index.js';

function ErrorFallback({error}) {
    return <div className="error-boundary"><p>{error.message}</p></div>;
}

export default function SourcePanel() {
    return (
        <ErrorBoundary fallbackRender={ErrorFallback}>
            <EditorSource/>
        </ErrorBoundary>
    );
}