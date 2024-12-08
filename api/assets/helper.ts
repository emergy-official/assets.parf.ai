import {
  SageMakerRuntimeClient,
  InvokeEndpointCommand,
} from "@aws-sdk/client-sagemaker-runtime";
import axios from "axios";
export const importDynamic = new Function(
  "modulePath",
  "return import(modulePath)"
);
import fs from "fs";
const runtimeClient = new SageMakerRuntimeClient({ region: "us-east-1" });

// Wait for x ms
export const wait = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

// Reusable to return the object from a lambda
export const returnData = (data: any) => {
  const output = {
    statusCode: 200,
    body: JSON.stringify(data),
  };

  console.log("OUTPUT", output);
  return output;
};

function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteCharacters = atob(base64);
  const byteArrays: Uint8Array[] = [];

  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    byteArrays.push(new Uint8Array(byteNumbers));
  }

  return new Blob(byteArrays, { type: mimeType });
}

export const generateImage = async (prompt: string) => {
  try {
    const payload = {
      prompt,
      output_format: "png",
    };

    const response = await axios.postForm(
      `https://api.stability.ai/v2beta/stable-image/generate/core`,
      axios.toFormData(payload, new FormData()),
      {
        validateStatus: undefined,
        responseType: "arraybuffer",
        headers: {
          Authorization: `Bearer ${process.env.STABILITY_API_KEY}`,
          Accept: "image/*",
        },
      }
    );

    if (response.status === 200) {
      return returnData({
        message: "ok",
        base64: Buffer.from(response.data).toString("base64"),
      });
    } else {
      throw new Error(`${response.status}: ${response.data.toString()}`);
    }
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const removeBackground = async (encodedString: string) => {
  try {
    const { Client } = await importDynamic("@gradio/client");

    const img = base64ToBlob(encodedString, "image/png");

    const app = await Client.connect(
      "ThomasSimonini/Roblox-3D-Assets-Generator-v1"
    );
    const result = await app.predict("/preprocess", [img, true]);
    console.log("URL", result.data[0].url);
    const response: any = await fetch(result.data[0].url);

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return returnData({ message: "ok", base64: buffer.toString("base64") });
  } catch (error) {
    console.error(error);
  }
};

export const createMesh = async (encodedString: string) => {
  try {
    const { Client } = await importDynamic("@gradio/client");

    const img = base64ToBlob(encodedString, "image/png");

    const app = await Client.connect(
      "ThomasSimonini/Roblox-3D-Assets-Generator-v1"
    );
    const result = await app.predict("/generate_mvs", [
      img,
      30, // number (numeric value between 30 and 75) in 'Sample Steps' Slider component
      3, // number  in 'Seed Value' Number component
    ]);
    console.log("URL", result.data[0].url);
    const response: any = await fetch(result.data[0].url);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64MeshImage = buffer.toString("base64");
    const mvs_image = await base64ToBlob(base64MeshImage, "image/png");

    const result3D = await app.predict("/make3d", [mvs_image]);
    // const responseObj3D: any = await fetch(result3D.data[0].url);
    // const arrayBufferObj3D = await response.arrayBuffer();
    // const bufferObj3D = Buffer.from(arrayBuffer);

    return returnData({
      message: "ok",
      mvsImage: base64MeshImage,
      obj3DUrl: result3D.data[0].url,
    });
  } catch (error) {
    console.error(error);
  }
};
