import pkg from 'whatsapp-web.js';
const { Client, LocalAuth,MessageMedia } = pkg;
import qrcode from "qrcode";
import Replicate from 'replicate';
import dotenv from 'dotenv';
import axios from 'axios';
import fs from "fs"
import { app } from './server.js';
import { beachPrompts, festivalPrompts, solidColorPrompts, streetCityPrompts, vintageClassicPrompts } from './prompts.js';

dotenv.config();


export const client = new Client({
    puppeteer: {
        headless: true,
		args: ['--no-sandbox'],
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
app.listen(3000, () => {
    console.log(`Server is running on port 3000`);
});

client.on('message', async msg => {
    if(msg.body === '!ping') {
		client.sendMessage(msg.from, 'pong');
	}

        if(msg.hasMedia) {
            const image = await msg.downloadMedia();

            if (image.mimetype.startsWith("image/")){
                createImage(image,msg,'Beach')
                msg.reply("Image is Being Processed")
            }

        }

     
});

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const getRandomPrompt = (theme) => {
    switch (theme) {
        case 'Beach':
            return beachPrompts[Math.floor(Math.random() * beachPrompts.length)];
        case 'SolidColor':
            return solidColorPrompts[Math.floor(Math.random() * solidColorPrompts.length)];
        case 'StreetCity':
            return streetCityPrompts[Math.floor(Math.random() * streetCityPrompts.length)];
        case 'VintageClassic':
            return vintageClassicPrompts[Math.floor(Math.random() * vintageClassicPrompts.length)];
        case 'Festival':
            return festivalPrompts[Math.floor(Math.random() * festivalPrompts.length)];
        default:
            return 'Design a backdrop that enhances the allure of showcased clothing items';
    }
};


const createImage = async (image, msg, theme) => {
    try {
        const base64Image = image.data.toString("base64");
        const mimeType = image.mimetype;
        const dataURI = `data:${mimeType};base64,${base64Image}`;

        const prompt = getRandomPrompt(theme);

        const output = await replicate.run(
            "logerzhu/ad-inpaint:b1c17d148455c1fda435ababe9ab1e03bc0d917cc3cf4251916f22c45c83c7df",
            {
                input: {
                    image_path: dataURI,
                    prompt: "pink dress girl, change background as behind her montains and around beatiful flowers",
                    negative_prompt: "human, 3d, no animation, no cartoon, real posture, no blur, real body parts, no zoom-out, fit to  screen, product level, text, watermark, background object, real background, white border, modification in product"
                },
            }
        );
            const imageUrl = output[1];
            const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
            const base64Image2 = Buffer.from(response.data, 'binary').toString('base64');
            const media = new MessageMedia('image/png', base64Image2);
            msg.reply(media).then((res) => console.log(res));
    } catch (error) {
        console.log(error);
        msg.reply("There has been a problem");
    }
};

