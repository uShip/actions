const globby = require("globby");
const { parse, diff } = require("semver");
const { parse: parsePath } = require("path");
const { readFile, writeFile } = require("fs/promises");

module.exports = class LatestTagPlugin {
  constructor() {
    this.name = "bump-docs";
  }
  /**
   * Tap into auto plugin points.
   * @param {import('@auto-it/core').default} auto
   */
  apply(auto) {
    auto.hooks.afterRelease.tapAsync("bump-docs", async ({ newVersion }) => {
      for await (const filePath of globby.stream("**/*.md", { deep: 2 })) {
        const { dir } = parsePath(filePath);
        if (dir === "") {
          continue;
        }

        const [parent] = dir.split("/");
        const { major } = parse(newVersion);
        await bumpDocsVersion(filePath, parent, `v${major}`);
      }
    });
  }
};

async function bumpDocsVersion(filePath, action, version) {
  console.log({ filePath });
  const mdContents = await readFile(filePath);
  const md = mdContents.toString();
  const regex = new RegExp(
    `uShip\\/actions\\/${action}@v[0-9]+(\\.[0-9]+){0,2}`,
    "gi"
  );
  const updatedText = md.replace(regex, `uShip/actions/${action}@${version}`);

  if (md !== updatedText) {
    await writeFile(filePath, updatedText);
  }
}
