import pkg from 'whatsapp-web.js';
const { Client, LocalAuth,MessageMedia } = pkg;
import qrcode from "qrcode";
import Replicate from 'replicate';
import dotenv from 'dotenv';
import axios from 'axios';
import fs from "fs"
import { app } from './server';

dotenv.config();


export const client = new Client({
    puppeteer: {
        headless: true,
		args: [
            '--log-level=3', // fatal only
            '--start-maximized',
            '--no-default-browser-check',
            '--disable-infobars', 
            '--disable-web-security',
            '--disable-site-isolation-trials',
            '--no-experiments',
            '--ignore-gpu-blacklist',
            '--ignore-certificate-errors',
            '--ignore-certificate-errors-spki-list',
            '--disable-gpu',
            '--disable-extensions',
            '--disable-default-apps',
            '--enable-features=NetworkService',
            '--disable-setuid-sandbox',
            '--no-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process'
              ],
	},
    authStrategy: new LocalAuth()
});

export let qrUrl = null
client.on('qr', async (qr) => {
    qrUrl = await qrcode.toDataURL(qr)
});


client.on('ready', () => {
    console.log('Client is ready!');
});

 
client.initialize();

//To Serve Qr code
app.listen(3002, () => {
    console.log(`Server is running on port 3000`);
});

client.on('message', async msg => {
	if(msg.body === '!ping') {
		client.sendMessage(msg.from, 'pong');
	}

        if(msg.hasMedia) {
            const image = await msg.downloadMedia();

            if (image.mimetype.startsWith("image/")){
                createImage(image,msg)
                msg.reply("Image is Being Processed")
            }

        }

     
});

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const createImage = async (image,msg) => {
    try{
        const base64Image = image.data.toString("base64");
        const mimeType = image.mimetype
        const dataURI = `data:${mimeType};base64,${base64Image}`;

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
            const image = new MessageMedia('image/png',base64Image)
            msg.reply(image).then((res)=> console.log(res))
        }
    }   catch (error) {
        console.log(error);
        msg.reply("There has been a problem")
    }
    
}