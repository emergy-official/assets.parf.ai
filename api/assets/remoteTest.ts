import { SageMakerRuntimeClient } from "@aws-sdk/client-sagemaker-runtime";
import fs from "fs";
import { createWriteStream } from "fs";
import axios from "axios";
/*
export AWS_ACCESS_KEY_ID=
export AWS_SECRET_ACCESS_KEY=
export AWS_REGION=us-east-1
export INFERANCE_NAME=anomaly-api
export INFERANCE_URL=https://runtime.sagemaker.us-east-1.amazonaws.com/endpoints/anomaly-api
*/

async function saveObjFile(url: string, filePath: string): Promise<void> {
  try {
    const response = await axios.get(url, { responseType: "stream" });
    const fileStream = createWriteStream(filePath);

    response.data.pipe(fileStream);
    response.data.on("error", (err: any) => {
      throw new Error(`Stream error: ${err.message}`);
    });

    fileStream.on("finish", () => console.log("File saved successfully"));
  } catch (error: any) {
    console.error(`Failed to save file: ${error.message}`);
  }
}

const saveBase64Image = async ({
  base64String,
  outputPath,
}: any): Promise<void> => {
  const base64Data = base64String.replace(/^data:image\/\w+;base64,/, "");
  const buffer = Buffer.from(base64Data, "base64");

  await fs.promises.writeFile(outputPath, buffer);
};
const runtimeClient = new SageMakerRuntimeClient({ region: "us-east-1" });

const removeBackground = async () => {
  try {
    const fileBuffer = fs.readFileSync("test.png");
    const encodedString = fileBuffer.toString("base64");

    const response: any = await axios.post(
      "https://dev.assets.parf.ai/api/remove-background",
      {
        base64: encodedString,
      }
    );

    saveBase64Image({
      base64String: response?.data?.base64,
      outputPath: "removeBackground.png",
    });

    console.log("response", response);
  } catch (error) {
    console.error(error);
  }
};

const createMesh = async () => {
  try {
    const fileBuffer = fs.readFileSync("removeBackground.png");
    const encodedString = fileBuffer.toString("base64");

    const response: any = await axios.post(
      "https://dev.assets.parf.ai/api/generate-mesh",
      {
        base64: encodedString,
      }
    );

    saveBase64Image({
      base64String: response?.data?.mvsImage,
      outputPath: "createMesh.png",
    });

    console.log("URL", response?.data.obj3DUrl);
    await saveObjFile(response?.data.obj3DUrl, "test.obj");
    console.log("response", response);
  } catch (error) {
    console.error(error);
  }
};
const generateImage = async () => {
  try {
    const response: any = await axios.post(
      "https://dev.assets.parf.ai/api/generate-image",
      {
        prompt: "One 3d chair, cartoon design",
      }
    );

    console.log(response)

    saveBase64Image({
      base64String: response?.data?.base64,
      outputPath: "genImage.png",
    });

  } catch (error) {
    console.error(error);
  }
};
generateImage()
// removeBackground();
// createMesh();
// createObj();

// const tt = async () => {
//   await saveObjFile(
//     "https://thomassimonini-roblox-3d-assets-generator-v1.hf.space/file=/tmp/gradio/8aa85ddbfb675ef28d22f3f4d67205353166dcba/tmpfzhk6jjb.obj",
//     "test.obj"
//   );
// };
// tt();
