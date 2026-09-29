export const report = () => 'A rule says what the code already says';

export const replace = () => ({
    'f(__a)': 'g(__a)',
    '__b.type === __c': 'isD(__b)',
    'const __d = __e': 'const __d = __e',
});
