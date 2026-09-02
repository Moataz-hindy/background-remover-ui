import { Client, handle_file } from "@gradio/client";

async function run() {
  try {
    console.log("Connecting to space with token...");
    const app = await Client.connect("moataz115/background-remover", {
      hf_token: "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"
    });
    
    console.log("Connecting to space...");
    const response = await app.predict("/remove_background", [
      handle_file("https://raw.githubusercontent.com/gradio-app/gradio/main/test/test_files/bus.png")
    ]);
    console.log("Success! Prediction response:", response.data[0]);
  } catch (err) {
    console.error("Error:", err.message || err);
  }
}

run();
