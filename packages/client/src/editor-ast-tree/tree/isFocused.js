export default function isFocused(level, path, value, open) {
    return level && path.indexOf(value) > -1
        && (!open || path.at(-1) === value);
}
