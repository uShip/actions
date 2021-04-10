import { getInput, setFailed } from "@actions/core";
import { getOctokit } from "@actions/github";
import { createOrUpdatePRComment } from "@uship/actions-helpers/comment";

async function run() {
  try {
    const token = getInput("token", { required: true });
    const octokit = getOctokit(token);

    const steps = JSON.parse(getInput("steps", { required: true }));

    const planStep = steps[getInput("plan") || "plan"];

    const tfSteps = new Map([
      ["fmt -check", steps[getInput("fmt") || "fmt"]],
      ["init", steps[getInput("init") || "init"]],
      ["validate", steps[getInput("validate") || "validate"]],
      ["plan", planStep],
    ]);

    const contextId = getInput("context");

    const now = new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "long",
      timeZone: "America/Chicago",
    } as any).format(new Date());

    let stepTable = `
| cmd | result |
|----|----|`;

    for (const [name, result] of tfSteps) {
      if (!result) {
        continue;
      }

      stepTable += `\n| \`${name}\` |  ${
        result?.outcome == "success" ? "✔" : "✖"
      }   |`;
    }

    const errorLogs = Object.values(tfSteps)
      .filter((output) => output && "exitcode" in output)
      .map((output) => {
        const out = ((output.stdout as string | null) ?? "").trim();
        const err = ((output.stderr as string | null) ?? "").trim();
        return `${out}${out != "" ? "\n" : ""}${err}`;
      });

    const body = `
## Terraform Output${contextId ? ` for ${contextId}` : ""}
${stepTable}

<details><summary><b>Plan Output</b></summary>

\`\`\`${planStep?.outputs.stdout || "\n"}\`\`\`

stderr:
\`\`\`
${(errorLogs.length > 0 ? errorLogs.join("\n") : "N/A").trim()}
\`\`\`
</details>

*Pusher: @${process.env.GITHUB_ACTOR}, Action: \`${
      process.env.GITHUB_EVENT_NAME
    }\`, Workflow: \`${process.env.GITHUB_WORKFLOW}\`*;

--------------
<sup>Last Updated: ${now}</sup>`;

    const [owner, repo] = process.env.GITHUB_REPOSITORY!.split("/");
    const prId = Number.parseInt(getInput("pr-id", { required: true }), 10);

    const context = `terraform-output${contextId}`;
    await createOrUpdatePRComment({
      owner,
      repo,
      prId,
      context,
      body,
      octokit,
    });

    if (getInput("fail-on-error").toLowerCase() === "true") {
      tfSteps.forEach((result, name) => {
        if (result && result.outcome === "failure") {
          setFailed(
            `Terraform step "${name}" failed. Err: ${result.outputs.stderr}`
          );
        }
      });
    }
  } catch (e) {
    setFailed(e);
  }
}
run();
