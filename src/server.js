import express from 'express';
import { serverQrCode } from './utils';


const app = express();

const port = 3000

app.get('/', (req, res) => {
  res.send('Hello, Server is running!!');
});

//To server qr code
app.get('/qr', serverQrCode);

app.get('/wake_up_call', (req,res)=>{
  res.send("I am awake")
})

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});