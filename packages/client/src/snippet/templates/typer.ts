import {montag} from 'montag';

export default montag`
    // check-maintainer

    export const report = () => 'Check maintainer 🧹';

    export const match = () => ({
        '__a': ({__a}, path) => {
            if (path.isProgram())
                return false;

            return path;
        },
    });

    export const filter = ({maintainer}) => maintainer === 'hello';
`;
