import boundaries from 'eslint-plugin-boundaries';
import {buildBoundaries} from './boundaries-dsl.ts';

// Exported because docs/architecture.md's client graph is generated from it: the map is the only statement of the policy, and a hand-copied diagram is a second one that can disagree. The default export below is unchanged.
export const map = {
    'editor': ['parser'],
    'store': ['editor', 'parser', 'snippet'],
    'parser': ['editor', 'store'],
    'snippet': ['editor', 'store', 'parser'],
    'ui': ['editor', 'store', 'parser'],
    'editor-source': ['editor', 'store', 'parser'],
    'editor-result': ['editor', 'editor-ast-json'],
    'editor-ast-json': ['editor'],
    'editor-transform': [
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
    'panel-transform': ['editor-transform', 'store'],
    'panel-code': ['editor-result', 'store', 'parser'],
    'layout': ['panel-*', 'ui'],
    'menu': [
        'editor-transform',
        'parser',
        'snippet',
        'store',
    ],
    'app': ['*'],
};

const config = buildBoundaries(map);

export default [{
    plugins: {
        boundaries,
    },
    settings: config,
    rules: {
        'boundaries/dependencies': config['boundaries/dependencies'],
    },
}];
