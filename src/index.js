import pkg from 'whatsapp-web.js';
const { Client, LocalAuth, MessageMedia, List, Buttons } = pkg;
import qrcode from "qrcode";
import Replicate from 'replicate';
import dotenv from 'dotenv';
import axios from 'axios';
// import fs from 'fs'
import { app } from './server';
import { beachPrompts, fabricBackgroundPrompts, festivalPrompts, flatLaysPrompts, holidayPrompts, minimalisticPrompts, naturePrompts, solidColorPrompts, streetCityPrompts, vintageClassicPrompts } from './prompt';
import { askNameMsg, greetingMsg, sendImageMsg,creditsOverMsg, endMsg,processingMsg,themeMsg, errorMsg } from './botMessages';
import { discordLog, downloadMedia } from './utils';
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
    console.log(`Server is running on port 3002`);
});

client.on('message', async msg => {
    messageResponse(msg);
});

let userLastMessage = {};
let botLastMessage = {};

let productName = '';
let productImage = '';
let productTheme = '';
let greetingMessageSent = false;
let hasCredits = false;
const messageResponse = async (msg) => {
    const user = msg.author;
    let chatId = msg.from;
    const sendImageMsgMedia = MessageMedia.fromFilePath(`./src/assets/productEditImg${Math.floor(Math.random() * 3) + 1}.jpeg`);

    const getRandomTheme = (productTheme) => {
        switch (productTheme) {
            case '1':
                return festivalPrompts[Math.floor(Math.random() * festivalPrompts.length)];
            case '2':
                return vintageClassicPrompts[Math.floor(Math.random() * vintageClassicPrompts.length)];
            case '3':
                return streetCityPrompts[Math.floor(Math.random() * streetCityPrompts.length)];
            case '4':
                return solidColorPrompts[Math.floor(Math.random() * solidColorPrompts.length)];
            case '5':
                return beachPrompts[Math.floor(Math.random() * beachPrompts.length)];
            case '6':
                return holidayPrompts[Math.floor(Math.random() * holidayPrompts.length)];
            case '7':
                return flatLaysPrompts[Math.floor(Math.random() * flatLaysPrompts.length)];
            case '8':
                return minimalisticPrompts[Math.floor(Math.random() * minimalisticPrompts.length)];
            case '9':
                return naturePrompts[Math.floor(Math.random() * naturePrompts.length)];
            case '10':
                return fabricBackgroundPrompts[Math.floor(Math.random() * fabricBackgroundPrompts.length)];
            default:
                return 'Design a backdrop that enhances the allure of showcased clothing item';
        }        
    }
    
    if((userLastMessage.body == undefined || msg.body.toLowerCase().includes('service')) && msg.type != 'image'){
        await client.sendMessage(chatId,greetingMsg)
        client.sendMessage(chatId,sendImageMsgMedia,{caption:sendImageMsg}).then((res)=> botLastMessage = res)
        greetingMessageSent = true
        // askImageMsg(msg)
    }
    else if((msg.type == 'image' && botLastMessage.body?.includes("Image")) || msg.type == "image"){
        productImage = await downloadMedia(msg)
        client.sendMessage(chatId,askNameMsg).then((res) => botLastMessage = res);
    }
    else if(userLastMessage.type == 'image' && botLastMessage.body?.includes('name')){
        productName = msg.body
        client.sendMessage(chatId,themeMsg).then((res)=> botLastMessage = res)
    } 
    else if(msg.type == 'chat' && botLastMessage.body?.includes('theme')){
        productTheme = msg.body

        productTheme = getRandomTheme(productTheme)
    
        createImage(productImage, msg,productName,productTheme,chatId);
        console.log(productImage,productName,productTheme)
        client.sendMessage(chatId,processingMsg).then((res)=> botLastMessage = res)
    } 
    else {
        client.sendMessage(chatId, errorMsg)
        client.sendMessage(chatId, sendImageMsg).then((res) => botLastMessage = res)
    }

    userLastMessage = msg;

};

const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
});

const createImage = async (image, msg, productName,chatId) => {
    try {
        const base64Image = image.data.toString("base64");
        const mimeType = image.mimetype
        const dataURI = `data:${mimeType};base64,${base64Image}`;
        const output = await replicate.run(
            "logerzhu/ad-inpaint:b1c17d148455c1fda435ababe9ab1e03bc0d917cc3cf4251916f22c45c83c7df",
            {
                input: {
                    image_path: dataURI,
                    prompt: `${productName || "Product"} + ${productTheme || "photography, outdoor setting, natural lighting, close-up shot, multiple angles, maintain aspect ratio, maintain height, maintain shadow"} `,
                    negative_prompt: "illustration, 3d, sepia, painting, cartoons, sketch, (worst quality:2),no distracting elements in the background",
                    image_num: 1,
                    // api_key: process.env.OPENAI_API
                },
            }
        );


        // const output = ["","https://cdn.discordapp.com/attachments/1143734201598886138/1173121912826765343/replicate-prediction-cko7q43buswlj45x754gwp7rxa-2.jpg?ex=656c086b&is=6559936b&hm=dd2e325ba812ddf52358f006ac6072cf9b2fec0c0b28604e5ddcb169e8b57551&"]
        if(output.length){
            for (const imageUrl of output.slice(1)) {
                const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
                const base64Image = Buffer.from(response.data, 'binary').toString('base64');
                const image = new MessageMedia('image/png', base64Image)
                msg.reply(image)
            }
            await client.sendMessage(msg.from,endMsg).then((res) => discordLog(res,hasCredits,greetingMessageSent))
            // discordLog(msg,false)
        }
        if(!output){
           hasCredits = true
        }
    //    console.log(output,"Hereeeeeeeeeeeeeee")
    } catch (error) {
        // console.log(error);
        // msg.reply(creditsOverMsg)
        // console.log(chatId)
        client.sendMessage(msg.from,creditsOverMsg).then((res) => discordLog(res,hasCredits,greetingMessageSent))
        // discordLog(msg,true,greetingMessageSent)
    } 

}