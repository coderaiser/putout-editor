import {montag} from 'montag';

export default montag`
    // no-nested-debugger

    export const report = () => 'Avoid nested debugger statement 🧹';

    export const match = () => ({
        'debugger': (_, path) => {
            if (path.parentPath.isBlockStatement() && path.parentPath.parentPath.isFunction())
                return path;

            return false;
        },
    });

    export const fix = (path) => path.remove();
`;
