import protect from '../utils/protectFromLoops.js';

export default function transpile(code) {
    return protect(code);
}
