import boundaries from 'eslint-plugin-boundaries';
import {buildBoundaries} from './boundaries-dsl.ts';

const config = buildBoundaries({
    'editor': ['parser'],
    'store': ['editor', 'parser'],
    'parser': ['editor', 'store'],
    'snippet': ['editor', 'store', 'parser'],
    'ui': ['editor', 'store', 'parser'],
    'editor-source': ['editor', 'store', 'parser'],
    'editor-result': ['editor', 'editor-ast-json'],
    'editor-ast-json': ['editor'],
    'editor-plugin': [
        'editor',
        'editor-result',
        'store',
        'parser',
        'ui',
    ],
    'editor-ast-tree': [
        'editor',
        'editor-ast-json',
        'store',
        'parser',
        'snippet',
    ],
    'panel-source': ['editor-source', 'ui', 'store'],
    'panel-ast': ['editor-ast-tree', 'ui', 'store'],
    'panel-transform': ['editor-plugin', 'store'],
    'panel-code': ['editor-result', 'store', 'parser'],
    'layout': ['panel-*', 'ui'],
    'menu': [
        'editor-plugin',
        'parser',
        'snippet',
        'store',
    ],
    'app': ['*'],
});

export default [{
    plugins: {
        boundaries,
    },
    settings: config,
    rules: {
        'boundaries/dependencies': config['boundaries/dependencies'],
    },
}];
