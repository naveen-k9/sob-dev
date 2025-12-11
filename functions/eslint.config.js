const importPlugin = require("eslint-plugin-import");

module.exports = [
    {
        files: ["**/*.ts", "**/*.js"],
        languageOptions: {
            parser: require("@typescript-eslint/parser"),
            parserOptions: {
                project: "./tsconfig.json",
                sourceType: "module",
            },
            globals: {
                node: true,
                es6: true,
            },
        },
        plugins: {
            "@typescript-eslint": require("@typescript-eslint/eslint-plugin"),
            "import": importPlugin,
        },
        rules: {
            "quotes": ["error", "double"],
            "import/no-unresolved": 0,
            "@typescript-eslint/no-explicit-any": 0,
        },
    },
    {
        ignores: ["lib/**/*", ".eslintrc.js", "eslint.config.js"],
    },
];
