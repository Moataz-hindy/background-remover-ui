import { Client } from "@gradio/client";

async function run() {
  try {
    const app = await Client.connect("moataz115/background-remover");
    
    // Let's get the API info to see what endpoints and arguments it expects
    const apiInfo = await app.view_api();
    console.log("API Info:", JSON.stringify(apiInfo, null, 2));

    // Try a dummy request if possible
  } catch (err) {
    console.error("Error connecting to space:", err);
  }
}

run();
