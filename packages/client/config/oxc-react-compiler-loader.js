import {transformSync} from 'oxc-transform-react';

const getMessage = ({message}) => message;

export default function oxcReactCompilerLoader(source) {
    const {
        code,
        map,
        fatal,
        errors,
    } = transformSync(this.resourcePath, source, {
        sourcemap: true,
        reactCompiler: {
            target: '19',
        },
    });
    
    if (fatal)
        return this.callback(Error(errors.map(getMessage).join('\n')));
    
    return this.callback(null, code, map);
}
