import { getInput, setFailed } from "@actions/core";
import { getOctokit } from "@actions/github";
import { createOrUpdatePRComment } from "@uship/actions-helpers/comment";
import { default as stripAnsi } from "strip-ansi";

interface TfStep {
  outcome: "success" | "failure";
  outputs?: {
    exitcode: number;
    stdout: string;
    stderr: string;
  };
}

async function run() {
  try {
    const token = getInput("token", { required: true });
    const octokit = getOctokit(token);

    const steps = JSON.parse(getInput("steps", { required: true }));

    const planStep = steps[getInput("plan") || "plan"];

    const tfSteps = new Map<string, TfStep | undefined>([
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

    let error = "";
    for (const [name, result] of tfSteps) {
      if (!result) {
        continue;
      }

      if (name === "plan" && result?.outcome == "success") {
        const noAscii = stripAnsi(result.outputs!.stdout);
        const hasChanges = !noAscii.includes(
          "No changes. Infrastructure is up-to-date."
        );
        if (hasChanges) {
          const counts = /Plan: (?<add>\d+) to add, (?<change>\d+) to change, (?<destroy>\d+) to destroy/.exec(
            noAscii
          );
          if (counts) {
            const { add, change, destroy } = counts.groups!;
            stepTable += `\n| \`${name}\` | ${add}+, ${change}~, ${destroy}- |`;
          } else {
            stepTable += `\n| \`${name}\` | 💬 |`;
          }
        } else {
          stepTable += `\n| \`${name}\` | - |`;
        }
      } else {
        stepTable += `\n| \`${name}\` |  ${
          result?.outcome == "success" ? "✔" : "✖"
        }   |`;
      }

      if (result?.outcome === "failure") {
        error += result.outputs?.stderr;
      }
    }

    const body = `
## Terraform Output${contextId ? ` for ${contextId}` : ""}
${stepTable}

<details><summary><b>Plan Output</b></summary>

\`\`\`${stripAnsi(planStep?.outputs.stdout || "\n")}\`\`\`

stderr:
\`\`\`
${stripAnsi(error.trim()) || "N/A"}
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
            `Terraform step "${name}" failed. Err: ${stripAnsi(
              result.outputs?.stderr ?? ""
            )}`
          );
        }
      });
    }
  } catch (e) {
    setFailed(e);
  }
}
run();
