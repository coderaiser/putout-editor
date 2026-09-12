import EditorASTJson from '#editor-ast-json';
import Tree from './Tree.tsx';

type WithName = typeof Tree & {
    displayName?: string;
};

const TreeWithName = Tree as WithName;
const JsonWithName = EditorASTJson as typeof EditorASTJson & {
    displayName?: string;
};

TreeWithName.displayName = 'Tree';
JsonWithName.displayName = 'JSON';

export default [TreeWithName, JsonWithName];
