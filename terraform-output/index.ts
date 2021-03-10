import core from "@actions/core";

async function run() {
  try {
    console.log("Got Steps", core.getInput("steps"));
  } catch (e) {
    core.setFailed(e);
  }
}

run();
