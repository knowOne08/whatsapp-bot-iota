import express from 'express';
import { serverQrCode } from './utils.js';
import { client } from './index.js';


export const app = express();


app.get('/', (req, res) => {
  res.send('Hello, Server is running!!');
});

//To server qr code
app.get('/qr', serverQrCode);

app.get('/wake_up_call', (req, res) => {
  res.send("I am awake")
})
