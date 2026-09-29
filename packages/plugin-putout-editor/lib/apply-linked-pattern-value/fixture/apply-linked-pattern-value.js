export const report = () => 'A rule says what the code already says';

export const replace = () => ({
    'f(__a__)': 'g(__a)',
    '__b__.type === __c': 'isD(__b)',
    'const __d = __e': 'const __d = __e',
});
