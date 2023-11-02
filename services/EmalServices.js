const Emails = require("../models/Emails");
const User = require("../models/User");
const apiKey = process.env.BREVO_API_KEY;
const apiUrl = process.env.BREVO_API_URL;
const {transporter,replaceEmailConstantsWithValues}  = require("../utils/index")
// const crypto = require ("crypto");
const CryptoJS = require('crypto-js');

const sendForgotPasswordEmail = async (userEmail,randomString)=>{
    try{
        let user_details = await User.where({'email':userEmail}).fetch()
        user_details = user_details.toJSON()
        
        let emailSubj = await Emails.where({'slug':'forgot-password'}).fetch()
        emailSubj = emailSubj.toJSON()
        let encryptedData = await encryptData(user_details.ID)
        if(encryptedData?.status){
            let routeLink = `<a href=https://pol-bi.online/#/forgot-pass/${encryptedData?.encryptedUserId}/${randomString}>Click Here</a>`
            let dataObj = {
                fullName : user_details?.first_name + " "  + user_details?.surname,
                userName : user_details?.username,
                routeLink : routeLink
            }
            const emailConstants = ['userName', 'age', 'routeLink', 'fullName'];
            let html_template = await replaceEmailConstantsWithValues(emailSubj.body,emailConstants,dataObj)
            await sendMail (userEmail, emailSubj?.subject, html_template)

            return {status:true}
        }else{
            return {status:false}
        }
    }catch(err){
        console.log("Error insdie sendForgotPasswordEmail",err)
        return {status:false}
    }
}
const newRegistrationEmail = async (userEmail,planName)=>{
    try{
        let user_details = await User.where({'email':userEmail}).fetch()
        user_details = user_details.toJSON()
        
        let emailSubj = await Emails.where({'slug':'register-user'}).fetch()
        emailSubj = emailSubj.toJSON()
        let dataObj = {
            fullName : user_details?.first_name + " "  + user_details?.surname,
            planName : planName,
            userName : user_details?.username
        }
        const emailConstants = ['fullName','planName','userName'];
        let html_template = await replaceEmailConstantsWithValues(emailSubj.body,emailConstants,dataObj)
        await sendMail (userEmail, emailSubj?.subject, html_template)
     
        return {status:true}
    }catch(err){
        console.log("Error insdie newRegistrationEmail",err)
        return {status:false}
    }
}

const encryptData = async (data) => {
    try {
        // const aesKey = CryptoJS.enc.Utf8.parse(process.env.AESKEY);
        // const aesIv = CryptoJS.enc.Utf8.parse(process.env.AESKEY);
        const aesKey = CryptoJS.enc.Utf8.parse('aeskeyaeskeyaeskeyaeskeyaeskey32');
        const aesIv = CryptoJS.enc.Utf8.parse('0123456789abcdef');
        const aesOptions = {
            iv: aesIv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7,
        };
        const plaintext = data.toString();
        const ciphertext = CryptoJS.AES.encrypt(plaintext, aesKey, aesOptions).ciphertext.toString();
        const encoded = { ciphertext: CryptoJS.enc.Hex.parse(ciphertext) };
        const decodedText = CryptoJS.AES.decrypt(encoded.ciphertext, aesKey, aesOptions).toString(CryptoJS.enc.Utf8);
        return { status: true, encryptedUserId: ciphertext };
    } catch (err) {
        console.log("Error inside encryptData", err);
        return { status: false };
    }
};

// const sendMail = async(userEmail, subject, html_template) =>{
//     try{
//         console.log("transporter",transporter)
//         const info = await transporter.sendMail({
//             from: '"POL" <sahils.mvteams@gmail.com>', 
//             to: userEmail, 
//             subject:subject,
//             html: html_template, 
//         });
//     }catch(err){
//         console.log("Error inside sendMail",err)
//     }
   
// }


const sendMail = async(userEmail, subject, html_template) =>{
    const emailData = {
        sender: {
          name: 'Pol Intel',
          email: 'no-reply@pol-intell.com'
        },
        to: [
          {
            email: userEmail,
          }
        ],
        subject:subject,
        htmlContent: html_template
      };
      fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'api-key': apiKey
        },
        body: JSON.stringify(emailData)
      })
      .then(response => response.json())
      .then(data => {
        console.log('Email sent successfully:', data);
      })
      .catch(error => {
        console.error('Error sending email:', error);
      });
}




module.exports = {sendForgotPasswordEmail,newRegistrationEmail}
