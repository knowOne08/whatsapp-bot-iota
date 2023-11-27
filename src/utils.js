import fs from 'fs';
import path from 'path';
import { qrUrl } from "."
import dotenv from "dotenv"
import  { AttachmentBuilder, EmbedBuilder, WebhookClient} from "discord.js"
import { scheduleJob, RecurrenceRule } from 'node-schedule';
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
        ?   sendLog(messages.slice(-8))
        :   sendLog(messages.slice(-7))
}

const sendLog = async (messages) => {
    let fields =  [];
    let attachments = [];

    messages.map(async (message)=> {
        if(message.type == 'image' && !message.fromMe){
            try {
                const res = await downloadMedia(message);
                const data = res.data.toString("base64")
                // const data = '/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEABsbGxscGx4hIR4qLSgtKj04MzM4PV1CR0JHQl2NWGdYWGdYjX2Xe3N7l33gsJycsOD/2c7Z//////////////8BGxsbGxwbHiEhHiotKC0qPTgzMzg9XUJHQkdCXY1YZ1hYZ1iNfZd7c3uXfeCwnJyw4P/Zztn////////////////CABEIADwAIQMBIgACEQEDEQH/xAAsAAADAQEBAAAAAAAAAAAAAAAAAwUEAgEBAQEAAAAAAAAAAAAAAAAAAAAB/9oADAMBAAIQAxAAAADEzU6XDzUWTTaDKU1pRWpwk9DFMMqUNEkLBKKntU09757j02i//8QAIRAAAgICAgIDAQAAAAAAAAAAAAECAxETBBIxQRAhUWH/2gAIAQEAAT8Aguy6zQqH6NY6zWKEZYaIVtGpP0SpRqZTFEK00aidZrKiHMm5NQj9Ijy5ppTj5HcmbTkPRXkhyeucoV+xxWGkh8g3I53M2tRj4RG1dMCtNjO/9EJHgjCU84NcvwQhlbamsfH/xAAUEQEAAAAAAAAAAAAAAAAAAAAw/9oACAECAQE/AE//xAAUEQEAAAAAAAAAAAAAAAAAAAAw/9oACAEDAQE/AE//2Q=='
                const buf = Buffer.from(data, 'base64');
                // const file = new AttachmentBuilder().setFile(buf).setName("img.png");
                const file = new AttachmentBuilder('./src/assets/productEditImg1.jpeg').setName("productEditImg1.jpeg");
                // console.log(file)
                attachments.push(file);
            } catch (error) {
                console.error('Error downloading media:', error);
            }
        } else {
            fields.push({
                name: `\n\n${message.fromMe ? 'Bot' : message.from}:\n`,
                value: `${message.body}\n\n`
            })
        }
    })
    const embed = new EmbedBuilder()
        .addFields(fields)
        // .setImage('attachment://img.png')
        .setImage('attachment://productEditImg1.jpeg')
        
        

    const webhookClient = new WebhookClient({ url: process.env.WEBHOOK_URL });

    webhookClient.send({
        embeds: [embed],
        files: attachments
    }).then((res)=>{
        // console.log(res)
    })
 
    
}


export const downloadMedia = async (msg) =>{  
    return await msg.downloadMedia();
}




// Function to create a new JSON file for the day
export const createNewFileAndWrite = (fileName,data) => {
    fs.writeFileSync(fileName, data);
};



// Function to read data from the JSON file
export const readDataFromFile = (fileName) => {
    try {
        if(fs.existsSync(fileName)){
            const data = fs.readFileSync(fileName);
            return JSON.parse(data);
        }else{
            return { "data": [] };
        }
    } catch (err) {

        console.error(`Error reading data from file: ${err.message}`);
    }
};
// Function to write data to the JSON file
export const writeDataToFile = (fileName, jsonData) => {
    try {
        if(fs.existsSync(fileName)){
            fs.writeFileSync(fileName, JSON.stringify(jsonData, null, 2));
        }else{
            createNewFileAndWrite(fileName, JSON.stringify(jsonData, null, 2));
        }
    } catch (err) {
        console.error(`Error writing data to file: ${err.message}`);
    }
};
export const deleteFile = () => {
    const fileName = `./src/data/free_${new Date().toISOString().split('T')[0]}.json`
    try {
        fs.unlinkSync(fileName);
        console.log(`File ${fileName} deleted successfully.`);
    } catch (err) {
        console.error(`Error deleting file ${fileName}: ${err.message}`);
    }
};


// Define the rule for scheduling midnight every day
const localDataClearRule = new RecurrenceRule();
localDataClearRule.tz = 'Asia/Kolkata'
localDataClearRule.hour = 0;
localDataClearRule.minute = 1;


scheduleJob(localDataClearRule, ()=>{
    console.log('bane 6')
    const fileName = `./src/data/free_${new Date().toISOString().split('T')[0]}.json`;
    createNewFileAndWrite(fileName, JSON.stringify({ "data": [] }))  
});


