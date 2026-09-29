export const report = () => 'A rule says what the code already says';

export const replace = () => ({
    'f(__a)': 'g(__a)',
    'const __b = __c': 'const __b = __c',
    'x.type === "y"': 'isY(x)',
});
