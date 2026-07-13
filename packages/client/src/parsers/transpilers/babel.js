import protect from '../utils/protectFromLoops';

export default function transpile(code) {
    return protect(code);
}
