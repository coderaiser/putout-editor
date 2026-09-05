export default function isFocused(level: number, path: unknown[], value: unknown, open: boolean): boolean {
    return Boolean(level && path.indexOf(value) > -1 && (!open || path.at(-1) === value));
}
