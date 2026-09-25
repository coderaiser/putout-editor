export default `// Fixture: remove-empty-needs (GitHub Actions YAML plugin)

__putout_processor_yaml({
    "jobs": {
        "build": {
            "needs": [],
            "runs-on": "ubuntu-latest"
        }
    }
});
`;
