import protect from '../utils/protectFromLoops';

export default function transpile(code) {
    const es5Code = protect(code);
    return es5Code;
}

