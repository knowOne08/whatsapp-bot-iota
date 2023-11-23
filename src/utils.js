import { qrUrl } from "./index.js"

export const serverQrCode = (req,res) => {
    if(qrUrl){
        res.send(`
            <img src="${qrUrl}"/>
        `)
    } else {
        res.send(`QR is not  ready yet`)
    }
}

