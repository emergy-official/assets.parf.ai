
import axios from "axios";

// Dynamic import for optional dependencies. 
// This allows for lazy loading and can improve initial load times.
export const importDynamic = new Function(
  "modulePath",
  "return import(modulePath)"
);

// Utility function to introduce a delay.  Useful for testing or rate limiting.
export const wait = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

// Reusable function to format data for Lambda responses.  Ensures consistent output format.
interface LambdaResponse<T> {
  statusCode: number;
  body: string;
}

export const returnData = <T>(data: T): LambdaResponse<T> => {
  const output: LambdaResponse<T> = {
    statusCode: 200,
    body: JSON.stringify(data),
  };

  // Consider using a proper logging library for production applications
  console.log("OUTPUT", output);
  return output;
};

// Converts a base64 string to a Blob.  Handles large base64 strings efficiently.
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


// Generates an image using the Stability.ai API.
export const generateImage = async (prompt: string): Promise<LambdaResponse<{ message: string; base64: string }> | null> => {
  try {
    const payload = {
      prompt,
      output_format: "png", // Specify the desired output format
    };

    const response = await axios.postForm(
      `https://api.stability.ai/v2beta/stable-image/generate/core`,
      axios.toFormData(payload, new FormData()), // Convert payload to FormData
      {
        validateStatus: undefined, // Handle all status codes
        responseType: "arraybuffer", // Expect binary data
        headers: {
          Authorization: `Bearer ${process.env.STABILITY_API_KEY}`, // Securely store API key
          Accept: "image/*", // Specify accepted response types
        },
      }
    );

    if (response.status === 200) {
      return returnData({
        message: "ok",
        base64: Buffer.from(response.data).toString("base64"),
      });
    } else {
      // More robust error handling, including the error message in the log.
      const errorMessage = `${response.status}: ${response.data.toString()}`;
      console.error(errorMessage);
      throw new Error(errorMessage); // Re-throw for proper error propagation
    }
  } catch (error) {
    console.error(error);
    return null; // Indicate failure with null return
  }
};

// Removes the background from an image using a Gradio app.
export const removeBackground = async (encodedString: string): Promise<LambdaResponse<{ message: string; base64: string }> | undefined> => {
  try {
    const { Client } = await importDynamic("@gradio/client"); // Dynamically import the Gradio client
    const img = base64ToBlob(encodedString, "image/png");


    const app = await Client.connect("ThomasSimonini/Roblox-3D-Assets-Generator-v1");
    const result = await app.predict("/preprocess", [img, true]); // Call the preprocess endpoint
    console.log("URL", result.data[0].url); // Log the returned URL

    const response: Response = await fetch(result.data[0].url);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return returnData({ message: "ok", base64: buffer.toString("base64") });
  } catch (error) {
    console.error(error); // Handle errors appropriately
    return undefined; // Indicate failure with undefined (better for void functions)
  }
};


// Creates a 3D mesh from an image using a Gradio app.  Similar structure to removeBackground for consistency.
export const createMesh = async (encodedString: string): Promise<LambdaResponse<{ message: string; mvsImage: string; obj3DUrl: string }> | undefined> => {
  try {
    const { Client } = await importDynamic("@gradio/client");

    const img = base64ToBlob(encodedString, "image/png");

    const app = await Client.connect("ThomasSimonini/Roblox-3D-Assets-Generator-v1");

    // Call the generate_mvs endpoint with appropriate parameters.  Use named constants for magic numbers.
    const SAMPLE_STEPS = 30;
    const SEED_VALUE = 3;
    const result = await app.predict("/generate_mvs", [img, SAMPLE_STEPS, SEED_VALUE]);
    console.log("URL", result.data[0].url);

    const response: Response = await fetch(result.data[0].url);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64MeshImage = buffer.toString("base64");
    const mvs_image = base64ToBlob(base64MeshImage, "image/png");

    const result3D = await app.predict("/make3d", [mvs_image]);


    return returnData({
      message: "ok",
      mvsImage: base64MeshImage,
      obj3DUrl: result3D.data[0].url,
    });
  } catch (error) {
    console.error(error);
    return undefined;
  }
};