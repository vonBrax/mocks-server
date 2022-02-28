module.exports = {
  env: {
    node: true,
    es6: true,
  },
  parserOptions: {
    ecmaVersion: 2018,
  },
  plugins: ["prettier"],
  rules: {
    "prettier/prettier": [
      "error",
      {
        printWidth: 99,
        parser: "flow",
      },
    ],
    "no-shadow": 2,
    "no-undef": 2,
    "no-unused-vars": [2, { vars: "all", args: "after-used", ignoreRestSiblings: false }],
  },
  extends: ["prettier"],
  root: true,
  overrides: [
    {
      files: ["packages/*/test/*.js", "test/*/src/*.js"],
      globals: {
        jest: true,
        beforeAll: true,
        beforeEach: true,
        afterEach: true,
        afterAll: true,
        describe: true,
        expect: true,
        it: true,
      },
    },
    {
      files: ["scripts/**/*.js", "**/*.mjs"],
      parser: "@babel/eslint-parser",
      parserOptions: {
        sourceType: "module",
        allowImportExportEverywhere: true,
        requireConfigFile: false,
      },
      globals: {
        module: true,
      },
    },
  ],
};
