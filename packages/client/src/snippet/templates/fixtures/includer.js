export default `// Fixture: remove-empty-method
// The plugin removes methods with no params and no body.

const obj = {
    greet() {},
    greetWithName(name) {
        return \`hello \${name}\`;
    },
};
`;
