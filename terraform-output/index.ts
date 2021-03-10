import { getInput, setFailed } from "@actions/core";

async function run() {
  try {
    console.log(getInput("context"));
    const steps = JSON.parse(getInput("steps", { required: true }));

    const fmtStep = steps[getInput("fmt")];
    const initStep = steps[getInput("init")];
    const planStep = steps[getInput("plan")];

    const now = new Intl.DateTimeFormat("en", {
      dateStyle: "medium",
      timeStyle: "long",
      timeZone: "America/Chicago",
    } as any).format(new Date());
    const output = `
    ## Terraform Plan
    | cmd | result |
    |----|----|
    | \`fmt -check\` |  ${fmtStep?.outcome == "success" ? "✔" : "✖"}   |
    | \`init\` |  ${initStep?.outcome == "success" ? "✔" : "✖"}   |
    | \`plan\` |  ${planStep?.outcome == "success" ? "✔" : "✖"}   |

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
    console.log(output);
  } catch (e) {
    setFailed(e);
  }
}
run();
