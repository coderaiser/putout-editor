import {montag} from 'montag';

export default montag`
    // remove-empty-method

    export const report = () => 'Remove empty method 🧹';

    export const filter = (path) => {
        if (path.isClassMethod() || path.isObjectMethod())
            return path.node.params.length === 0 && path.node.body.body.length === 0;

        return false;
    };

    export const include = () => ['ClassMethod', 'ObjectMethod'];

    export const fix = (path) => path.remove();
`;
