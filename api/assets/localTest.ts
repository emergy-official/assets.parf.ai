import fs from "fs";
import { createWriteStream } from "fs";
import axios from "axios";
import FormData from "form-data";

/*
export AWS_ACCESS_KEY_ID=
export AWS_SECRET_ACCESS_KEY=
export AWS_REGION=us-east-1
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

// const removeBackground = async () => {
//   try {
//     const fileBuffer = fs.readFileSync("test.png");
//     const encodedString = fileBuffer.toString("base64");

//     const response: any = await rmBackgroundHandler(
//       {
//         httpMethod: "POST",
//         body: JSON.stringify({ base64: encodedString }),
//       },
//       ""
//     );

//     saveBase64Image({
//       base64String: JSON.parse(response?.body).base64,
//       outputPath: "removeBackground.png",
//     });
//     console.log("response", response);
//   } catch (error) {
//     console.error(error);
//   }
// };

// const createMesh = async () => {
//   try {
//     const fileBuffer = fs.readFileSync("removeBackground.png");
//     const encodedString = fileBuffer.toString("base64");

//     const response: any = await createMeshHandler(
//       {
//         httpMethod: "POST",
//         body: JSON.stringify({ base64: encodedString }),
//       },
//       ""
//     );

//     saveBase64Image({
//       base64String: JSON.parse(response?.body).mvsImage,
//       outputPath: "createMesh.png",
//     });

//     console.log("URL", JSON.parse(response?.body).obj3DUrl);
//     await saveObjFile(JSON.parse(response?.body).obj3DUrl, "test.obj");
//     console.log("response", response);
//   } catch (error) {
//     console.error(error);
//   }
// };
// removeBackground();
// createMesh();
// createObj();

const tt = async () => {
  try {
    const payload = {
      prompt: "One 3d tree, cartoon",
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

    console.log("RESPONSE", response)
    if (response.status === 200) {
      fs.writeFileSync("./lighthouse.png", Buffer.from(response.data));
    } else {
      throw new Error(`${response.status}: ${response.data.toString()}`);
    }

    return new Uint8Array(response.data);
  } catch (error) {
    console.error(error);
    return null;
  }
};
tt();
