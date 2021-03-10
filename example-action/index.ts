import { setOutput, setFailed } from "@actions/core";
import got from "got";

async function run() {
  try {
    const {
      body: { affirmation },
    } = await got<any>("https://www.affirmations.dev/", {
      responseType: "json",
    });
    console.log("Received Affirmation:", affirmation);
    setOutput("affirmation", affirmation);
  } catch (e) {
    setFailed(e);
  }
}

run();
