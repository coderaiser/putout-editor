const [error, {
    scripts = {},
} = {}] = tryCatch(JSON.parse, content);

export {
    error,
};
