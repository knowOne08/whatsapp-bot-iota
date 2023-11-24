import axios from "axios"
import { qrUrl } from "."
import dotenv from "dotenv"
import  {Attachment, AttachmentBuilder, EmbedBuilder} from "discord.js"
dotenv.config()
export const serverQrCode = (req,res) => {
    if(qrUrl){
        res.send(`
            <img src="${qrUrl}"/>
        `)
    } else {
        res.send(`QR is not  ready yet`)
    }
}

export const discordLog = async (msg,hasCredits,greetingMessageSent) => {
    const chat = await msg.getChat()
    const messages = await chat.fetchMessages()
    messages.push(msg)

    greetingMessageSent ?
        hasCredits 
        ?   sendLog(messages.slice(-12))
        :   sendLog(messages.slice(-10))
    
    :   hasCredits 
        ?   sendLog(messages.slice(-9))
        :   sendLog(messages.slice(-7))
}

const sendLog = async (messages) => {
    let fields =  [];
    let attachments = [];
    // console.log(messages)
    // const logImage = async (message) => {
        
    //     let base64Image = '';
    //     try {
    //         const res = await downloadMedia(message);

    //         base64Image = res.data;
    //         // console.log("Base64 Image:", base64Image);
    //         const data = base64Image.split(',');
    //         console.log(data)
    //         return Buffer.from(data[1], 'base64');  
    //     } catch (error) {
    //         console.error("Error downloading media:", error);
    //     }
    //     return base64image;
    // };

    // const embed = new ()
    messages.map(async (message)=> {
        if(message.type == 'image' && !message.fromMe){
            const res = await downloadMedia(message)
            const b64image = `data:${res.mimeType};base64,${res.data}`
            
            const data = b64image.split(',')[1]; 
            const buf = new Buffer.from(data, 'base64');
            const file = new AttachmentBuilder(buf,{name: "img.jpg"});
            console.log(file)
            attachments.push(file)
        } else {
            fields.push({
                name: `\n\n${message.fromMe ? 'Bot' : message.from}:\n`,
                value: `${message.body}\n\n`
            })
        }
    })
    const embed = new EmbedBuilder()
        .addFields(fields)
        .setImage('attachment://img.jpg')
    
    const log = {
                
        "content": 'Snapcraft bot log',
        "embeds" : [embed],
        "files": attachments
    }

    const response = await axios.post(process.env.WEBHOOK_URL,log,{
        headers: {
            'Content-Type': 'application/json', 
        }
    });
    
    if (response.status === 204) {
        console.log('Webhook message sent successfully');
    } else {
        console.error('Failed to send webhook message:', response.status, response.statusText);
    }
    
}


export const downloadMedia = async (msg) =>{  
    return await msg.downloadMedia();
}
