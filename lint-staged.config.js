const { relative } = require("path");
const packageJson = require("./package.json");

module.exports = {
  "**/*": (files) =>
    files
      .map((file) => relative(process.cwd(), file))
      .some((file) =>
        packageJson.workspaces.some((workspace) => file.startsWith(workspace))
      )
      ? ["npm run build --workspaces --if-present", "git add **/dist/**"]
      : [],
  "**/*!(-lock).{json,js,ts,yml}": (files) => {
    const nonDist = files.filter((file) => !file.includes("dist/"));
    return nonDist.length > 0 ? [`prettier --write ${files.join(" ")}`] : [];
  },
};
