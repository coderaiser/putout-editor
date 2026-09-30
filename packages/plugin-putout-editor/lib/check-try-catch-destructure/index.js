export const report = () => 'Bind the result first: tryCatch returns a shorter array when it catches';

export const match = () => ({
    'const [__a, {__b}] = __c(__d, __e)': () => true,
    'const [__a, {__b = {}} = {}] = __c(__d, __e)': () => true,
});

export const replace = () => ({
    'const [__a, {__b}] = __c(__d, __e)': 'const [__a, {__b}] = __c(__d, __e)',
    'const [__a, {__b = {}} = {}] = __c(__d, __e)': 'const [__a, {__b = {}} = {}] = __c(__d, __e)',
});
