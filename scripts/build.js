import { existsSync } from "fs";
import { readFile, writeFile, mkdir } from "fs/promises";
import { dirname, join, resolve } from "path";
import { default as globby } from "globby";
import ncc from "@vercel/ncc";
import execa from "execa";

(async () => {
    const actionYmls = await globby(["**/action.yml", "!node_modules/**"]);
    const actions = actionYmls.map((actionYml) => dirname(actionYml));

    for (const actionPath of actions) {
        const actionDir = resolve(actionPath);
        const packageJsonPath = join(actionDir, "package.json");
        if (!existsSync(packageJsonPath)) {
            console.info("Non-node.js actions are unsupported right now.");
            continue;
        }
        const packageJson = JSON.parse(await readFile(packageJsonPath));

        const { code, map, assets } = await ncc(
            join(actionDir, packageJson.main),
            {
                filterAssetBase: actionDir,
                minify: true,
                sourceMap: true,
                cacheDir: resolve("./node_modules/.cache/ncc"),
            }
        );

        const actionDist = join(actionDir, "dist");
        if (!existsSync(actionDist)) {
            await mkdir(actionDist);
        }

        await updateOutput(join(actionDist, "index.js"), code);
        await updateOutput(join(actionDist, "index.js.map"), map);

        for (const [name, contents] of Object.entries(assets)) {
            await updateOutput(join(actionDist, name), contents.source, contents.permissions);
        }
    }
})().catch(console.error);

async function updateOutput(distFile, source, permissions) {
  await writeFile(distFile, source, {
      mode: permissions,
  });
  await execa('git', ['add', distFile]);
}
