import { getInput, setFailed } from "@actions/core";

async function run() {
  try {
    console.log("Got Steps", getInput("steps"));
  } catch (e) {
    setFailed(e);
  }
}

run();
