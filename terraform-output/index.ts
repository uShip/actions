import { getInput, setFailed } from "@actions/core";

async function run() {
  try {
    for (const [key, val] of Object.entries(process.env)) {
      console.log(`${key}=${val}`);
    }
    console.log("Got Steps", getInput("steps"));
  } catch (e) {
    setFailed(e);
  }
}

run();
