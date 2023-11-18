// import 'dotenv/config'
// import * as venom from "venom-bot";
// import Replicate from "replicate";
// import sharp from "sharp";
// import fs from "fs";
// import axios from "axios";

// const replicate = new Replicate({
//   auth: process.env.REPLICATE_API_TOKEN,
// });
// venom
//   .create({
//     session: "sd-bot", //name of session
//   })
//   .then((client) => start(client))
//   .catch((erro) => {
//     console.log(erro);
//   });

// function start(client: venom.Whatsapp) {
//   client.onMessage(async (message) => {
//     if (message.body === "Hi" && message.isGroupMsg === false) {
//       client
//         .sendText(message.from, "Hello Karan")
//         .then(() => console.log("msg send!"))
//         .catch((erro) => console.error("Error when sending: ", erro));
//     } else if (message.mediaData.type === "image") {
//       const buffer = await client.decryptFile(message);
//       client
//         .sendText(message.from, "Received image...")
//         .then(() => client.sendText(message.from, "Processing them..."))
//         .catch((erro) => console.error("Error when sending processing message: ", erro));

//       processImage(buffer, client, message.from);
//     }
//   });
// }

// const resizeImage = async (imageBuffer: Buffer): Promise<Buffer> => {
//   return sharp(imageBuffer)
//     .resize(1024, 1024)
//     .toBuffer();
// };

// const processImage = async (imageBuffer: Buffer, client: venom.Whatsapp, recipient: string) => {
//   try {
//     const resizedImageBuffer = await resizeImage(imageBuffer);

//     // Convert the resized image buffer to a base64-encoded string
//     const base64Image = resizedImageBuffer.toString("base64");
//     const mimeType = "image/png";
//     const dataURI = `data:${mimeType};base64,${base64Image}`;

//     const output:any = await replicate.run(
//       "logerzhu/ad-inpaint:b1c17d148455c1fda435ababe9ab1e03bc0d917cc3cf4251916f22c45c83c7df",
//       {
//         input: {
//           image_path: dataURI,
//           prompt: "Product photography, outdoor setting, natural lighting, close-up shot, multiple angles, maintain aspect ratio, maintain height, maintain shadow",
//           negative_prompt: "illustration, 3d, sepia, painting, cartoons, sketch, (worst quality:2),no distracting elements in the background"
//         },
//       }
//     );
//     // console.log({output});
//     // fs.writeFile('replicate-response.json',JSON.stringify(output),(err)=>console.log({err}))
//     // Assuming the output is an array of image URLs
    
//     for (const imageUrl of output) {
//       const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
//       const base64Image = Buffer.from(response.data, 'binary').toString('base64');
//       client.sendImageFromBase64(
//         recipient,
//         `data:image/png;base64,${base64Image}`,
//         'Processed Image',
//         ""
//       ).then((imgRes) => console.log("Image send"));
//     }
//   } catch (error) {
//     console.error("Error during image processing:", error);
//     client.sendText(recipient, "Error processing the image. Please try again later.");
//   }
// };