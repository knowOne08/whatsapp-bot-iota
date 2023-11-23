import pkg from 'whatsapp-web.js';
const { Client, LocalAuth, MessageMedia, List, Buttons } = pkg;
import qrcode from "qrcode";
import Replicate from 'replicate';
import dotenv from 'dotenv';
import axios from 'axios';
import fs from "fs"
import { app } from './server';
import { channel } from 'diagnostics_channel';

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
    messageResponse(msg);
});

let productName = '';
let productImage = '';
const messageResponse = async (msg) => {
    const user = msg.author;
    let chatId = msg.from;
    const greetingMsg = `Basic Greeting Message`;
    const sendImageMsg = `Please Send the Image`;
    const askNameMsg = `Please write the name of the product`;
    const processingMsg = `Please wait while image is being processed`

    const chat = await msg.getChat()
    const messages  = await chat.fetchMessages({fromMe:true});
    
    const lastMessage = messages[messages.length - 1].body
    console.log(lastMessage)
    

    const downloadMedia = async (msg) =>{  
        if (msg.type == 'image') {
            return await msg.downloadMedia();
        }
    }

    if (msg.body.toLowerCase().includes('service')) {
        client.sendMessage(chatId,greetingMsg)
        client.sendMessage(chatId,sendImageMsg)
    } 
    else if (lastMessage.includes("Image")) {
        productImage = await downloadMedia(msg)
        client.sendMessage(chatId,askNameMsg)
    } 
    else if(lastMessage.includes("name")){
        productName = msg.body
        console.log(productImage);
        createImage(productImage,msg,productName);
        client.sendMessage(chatId,processingMsg)
    }

    

};

const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
});

const createImage = async (image, msg, productName) => {
    try {
        const base64Image = image.data.toString("base64");
        const mimeType = image.mimetype
        const dataURI = `data:${mimeType};base64,${base64Image}`;
        // console.log(process.env.OPENAI_API)
        const output = await replicate.run(
            "logerzhu/ad-inpaint:b1c17d148455c1fda435ababe9ab1e03bc0d917cc3cf4251916f22c45c83c7df",
            {
                input: {
                    image_path: dataURI,
                    prompt: `${productName || "Product" } photography, outdoor setting, natural lighting, close-up shot, multiple angles, maintain aspect ratio, maintain height, maintain shadow`,
                    negative_prompt: "illustration, 3d, sepia, painting, cartoons, sketch, (worst quality:2),no distracting elements in the background",
                    image_num: 1,
                    // api_key: process.env.OPENAI_API
                },
            }
        );

        for (const imageUrl of output) {
            const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
            const base64Image = Buffer.from(response.data, 'binary').toString('base64');
            const image = new MessageMedia('image/png', base64Image)
            msg.reply(image).then((res) => console.log(res))
        }
    } catch (error) {
        console.log(error);
        msg.reply("There has been a problem")
    }

}