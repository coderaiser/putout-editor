import * as babel from '@babel/core';
import env from '@babel/preset-env';
import flowStripTypes from 'babel-plugin-transform-flow-strip-types';
import protect from '../utils/protectFromLoops';

const options = {
    presets: [env],
    plugins: [flowStripTypes],
    ast: false,
    babelrc: false,
    highlightCode: false,
};

export default function transpile(code) {
    let es5Code = babel.transform(code, options).code;
    es5Code = protect(es5Code);
    return es5Code;
}
