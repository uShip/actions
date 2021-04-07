const { relative } = require("path");
const packageJson = require('./package.json');

module.exports = {
  "**/*": (files) =>
    files
      .map((file) => relative(process.cwd(), file))
      .some((file) =>
        packageJson.workspaces.some(workspace => file.startsWith(workspace))
      )
      ? ["npm run build", "git add **/dist/**"]
      : [],
  "*.{ts,yml}": ["prettier --write"],
};
