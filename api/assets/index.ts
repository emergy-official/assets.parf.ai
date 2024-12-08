// index.ts
import { createMesh, generateImage, removeBackground, returnData } from "./helper";

// Incoming lambda request
export async function handler(event: any, _: any) {
  console.log("INPUT", event);

  if (event.httpMethod == "POST") {
    const params = JSON.parse(event.body);

    if (event.resource === "/generate-image") {
      return await generateImage(params.prompt);
    } else if (event.resource === "/remove-background") {
      return await removeBackground(params.base64);
    } else if (event.resource === "/generate-mesh") {
      return await createMesh(params.base64);
    }
  }

  // Something else that should not happen.
  return returnData({
    message: "Nothing to say",
  });
}
