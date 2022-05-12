const path = require("path");

module.exports = {
  // mock to use on start
  mocks: { selected: "user-real" },
  log: "silly",
  files: {
    path: path.resolve(__dirname, "..", "typescript"),
    watch: true,
    babelRegister: true,
  },
};
