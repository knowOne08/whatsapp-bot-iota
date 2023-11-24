import pkg from 'whatsapp-web.js';
const { Client, LocalAuth, MessageMedia, List, Buttons } = pkg;
import qrcode from "qrcode";
import Replicate from 'replicate';
import dotenv from 'dotenv';
import axios from 'axios';
// import fs from 'fs'
import { app } from './server';
import { beachPrompts, festivalPrompts, solidColorPrompts, streetCityPrompts, vintageClassicPrompts } from './prompt';
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
const messageResponse = async (msg) => {
    const user = msg.author;
    let chatId = msg.from;
    const greetingMsg =
`🌟 *Welcome to Snapcraft Bot!* 🌟
    
Hello there! I'm Snapcraft, your AI-enhanced image bot. 🤖✨
`;
    const sendImageMsgMedia = MessageMedia.fromFilePath(`./src/assets/productEditImg${Math.floor(Math.random() * 3) + 1}.jpeg`);
    
    const sendImageMsg = 
`📷 *Send Image*
    
Ready to enhance your image! 🚀 Please send the image you'd like me to work on, and let the magic begin! ✨
`;
    
    const askNameMsg = 
`🤖 *Send Product Name*
    
Before we start, could you please provide the name of the product or describe what you're looking for? It will help personalize the enhancements. 🎨✨
`;
    
    const processingMsg = 
`⌛ *Processing Image*
    
Great choice! Sit tight while I work on enhancing your image. 🛠️✨ This might take a moment, but the results will be worth it! 🌈
`;
    
    const themeMsg = 
`🎨 *Choose Theme*
    
Time to add some style! 🌟 Choose a theme for your enhanced image:
    
1. Festival 🎉
2. Vintage 📽️
3. Street City 🏙️
4. Solid Color 🌈
5. Beach 🏖️
    
Please enter the number of your preferred option:
`;

const endMsg = 
`🎉 **Congratulations!**

Your enhanced images are ready! 🖼️✨ Thank you for using Snapcraft Bot. If you have any more requests or need further assistance, feel free to ask. Enjoy your enhanced images! 🌟
`;

    const downloadMedia = async (msg) =>{  
        return await msg.downloadMedia();
    }

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
            default:
                return 'Design a backdrop that enhances the allure of showcased clothing item';
        }
    }
    
    if(userLastMessage.body == undefined || msg.body.toLowerCase().includes('service')){
        await client.sendMessage(chatId,greetingMsg)
        
        client.sendMessage(chatId,sendImageMsgMedia,{caption:sendImageMsg}).then((res)=> botLastMessage = res)
        // askImageMsg(msg)
    }
    else if((msg.type == 'image' && botLastMessage.body.includes("Image")) || msg.type == "image"){
        productImage = await downloadMedia(msg)
        client.sendMessage(chatId,askNameMsg).then((res) => botLastMessage = res);
    }
    else if(userLastMessage.type == 'image' && botLastMessage.body.includes('name')){
        productName = msg.body
        client.sendMessage(chatId,themeMsg).then((res)=> botLastMessage = res)
    } 
    else if(msg.type == 'chat' && botLastMessage.body.includes('theme')){
        console.log(msg.type);
        productTheme = msg.body

        productTheme = getRandomTheme(productTheme)
    
        // console.log(botLastMessage.body)
        createImage(productImage, msg,productName,productTheme);
        console.log(productImage,productName,productTheme)
        client.sendMessage(chatId,processingMsg).then((res)=> botLastMessage = res)
    } 
    else {
        client.sendMessage(chatId, "Some problem occured restarting")
        client.sendMessage(chatId, sendImageMsg).then((res) => botLastMessage = res)
    }

    userLastMessage = msg;

};

const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
});

const createImage = async (image, msg, productName) => {
    try {
        const base64Image = image.data.toString("base64");
        const mimeType = image.mimetype
        const dataURI = `data:${mimeType};base64,${base64Image}`;
        console.log(productTheme)
        const output = await replicate.run(
            "logerzhu/ad-inpaint:b1c17d148455c1fda435ababe9ab1e03bc0d917cc3cf4251916f22c45c83c7df",
            {
                input: {
                    image_path: dataURI,
                    prompt: `${productName || "Product"} + ${productTheme || "photography, outdoor setting, natural lighting, close-up shot, multiple angles, maintain aspect ratio, maintain height, maintain shadow"} `,
                    // prompt: `${productName || "Product" }`,
                    negative_prompt: "illustration, 3d, sepia, painting, cartoons, sketch, (worst quality:2),no distracting elements in the background",
                    image_num: 1,
                    // api_key: process.env.OPENAI_API
                },
            }
        );
        // const output = ["https://replicate.delivery/pbxt/5RGzdE9OkAIxL5XJYzkYFsebGqQaKfWXRE3YQF2TIxcvh43RA/top.png","https://replicate.delivery/pbxt/GmJrlGOLQYaMA5AOB61libiSXgStBBth2M0GQGoC093bIe7IA/ad_inpaint_0.jpg"]
        if(output.length){
                for (const imageUrl of output.slice(1)) {
                    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
                    const base64Image = Buffer.from(response.data, 'binary').toString('base64');
                    const image = new MessageMedia('image/png', base64Image)
                    msg.reply(image).then((res) => console.log(res))
                }
        }
    } catch (error) {
        console.log(error);
        msg.reply("There has been a problem")
    }

}