__putout_processor_filesystem([
    '/',
    '/css/',
    ['/css/tokens.css', `
        :root {
            --color-accent: #c00;
        }
    `],
    ['/css/main.css', `
        .a {
            color: var(--color-missing);
        }
    `],
]);
