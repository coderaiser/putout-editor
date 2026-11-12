import {montag} from 'montag';

export default montag`
    const obj = {
        greet() {},
        greetWithName(name) {
            return \`hello \${name}\`;
        },
    };
`;
