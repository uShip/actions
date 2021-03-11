import { getInput, setFailed } from "@actions/core";
import * as github from "@actions/github";

async function run() {
  try {
    const token = getInput("token", { required: true });
    const octokit = github.getOctokit(token);

    const steps = JSON.parse(getInput("steps", { required: true }));

    const planStep = steps[getInput("plan") || "plan"];

    const tfSteps = new Map([
      ["fmt -check", steps[getInput("fmt") || "fmt"]],
      ["init", steps[getInput("init") || "init"]],
      ["validate", steps[getInput("validate") || "validate"]],
      ["plan", planStep],
    ]);

    const now = new Intl.DateTimeFormat("en", {
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

    const output = `
## Terraform Output
${stepTable}

<details><summary><b>Plan Output</b></summary>

\`\`\`${planStep?.outputs.stdout}\`\`\`

stderr:
\`\`\`
${(planStep?.outputs.stderr || "No Error").trim()}
\`\`\`
</details>

*Pusher: @${process.env.GITHUB_ACTOR}, Action: \`${
      process.env.GITHUB_EVENT_NAME
    }\`, Workflow: \`${process.env.GITHUB_WORKFLOW}\`*;

--------------
<sup>Last Updated: ${now}</sup>`;

    const [owner, repo] = process.env.GITHUB_REPOSITORY!.split("/");
    const id = parseInt(getInput("pr-id", { required: true }), 10);

    const { data: comments } = await octokit.issues.listComments({
      issue_number: id,
      owner,
      repo,
    });

    const comment = comments.find((comment) => {
      return (
        comment.body?.includes("Terraform Output") &&
        comment.body?.includes("Last Updated")
      );
    });

    if (comment) {
      octokit.issues.updateComment({
        owner,
        repo,
        comment_id: comment.id,
        body: output,
      });
    } else {
      octokit.issues.createComment({
        issue_number: id,
        owner,
        repo,
        body: output,
      });
    }

    tfSteps.forEach((result, name) => {
      if (result && result.outcome === "failed") {
        setFailed(
          `Terraform step "${name}" failed. Err: ${result.output.stderr}`
        );
      }
    });
  } catch (e) {
    setFailed(e);
  }
}
run();
