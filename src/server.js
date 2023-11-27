import express from 'express';
import { createNewFileAndWrite, serverQrCode } from './utils';
import { client } from '.';


export const app = express();


app.get('/', (req, res) => {
  res.send('Hello, Server is running!!');
});

//To server qr code
app.get('/qr', serverQrCode);

app.get('/new_file_make', async (req,res)=>{
  const fileName = `./src/data/free_${new Date().toISOString().split('T')[0]}.json`;
  createNewFileAndWrite(fileName, { "data": [] })
})

app.get('/wake_up_call', (req, res) => {
  res.send("I am awake")
})

