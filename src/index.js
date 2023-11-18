import pkg from 'whatsapp-web.js';
const { Client, LocalAuth,MessageMedia } = pkg;
import qrcode from "qrcode";
import Replicate from 'replicate';
import dotenv from 'dotenv';
import axios from 'axios';
import fs from "fs"

dotenv.config();


export const client = new Client({
    puppeteer: {
        headless: false,
		args: ['--no-sandbox'],
        authStrategy: new LocalAuth()
	}
});

export let qrUrl = null
client.on('qr', async (qr) => {
    // console.log('QR RECEIVED', qr);
    qrUrl = await qrcode.toDataURL(qr)
});

client.on('')

client.on('ready', () => {
    console.log('Client is ready!');
});

 
client.initialize();

client.on('message', async msg => {
	if(msg.body === '!ping') {
		client.sendMessage(msg.from, 'pong');
	}

        // if(msg.hasMedia) {
        //     const image = await msg.downloadMedia();
        //     // do something with the media data here
        //     // createImage(image.mimetype);
        //     if (image.mimetype.startsWith("image/")){
        //         // console.log(msg.author)
        //         createImage(image,msg)
        //         msg.reply("Image is Being Processed")
        //     }

        //     // console.log(image.mimetype != "image/jpeg")
        // }

     
});
// console.log(process.env.REPLICATE_API_TOKEN)

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const createImage = async (image,msg) => {
    try{
        const base64Image = image.data.toString("base64");
        const mimeType = image.mimetype
        const dataURI = `data:${mimeType};base64,${base64Image}`;

        // console.log(dataURI)
        const output = await replicate.run(
                "logerzhu/ad-inpaint:b1c17d148455c1fda435ababe9ab1e03bc0d917cc3cf4251916f22c45c83c7df",
                {
                    input: {
                    image_path: dataURI,
                    prompt: "Product photography, outdoor setting, natural lighting, close-up shot, multiple angles, maintain aspect ratio, maintain height, maintain shadow",
                    negative_prompt: "illustration, 3d, sepia, painting, cartoons, sketch, (worst quality:2),no distracting elements in the background"
                    },
                }
                );
        
        for(const imageUrl of output){
            const response = await axios.get(imageUrl, { responseType: 'arraybuffer'});
            const base64Image = Buffer.from(response.data, 'binary').toString('base64');
            // const image = `data:image/png;base64,${base64Image}`
            const image = new MessageMedia('image/png',base64Image)
            msg.reply(image).then((res)=> console.log(res))
            // console.log(base64Image)
        }
    }   catch (error) {
        console.log(error);
        msg.reply("There has been a problem")
    }
    
}