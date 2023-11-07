const nodemailer = require("nodemailer");
const User = require("../models/User");
const Discount = require("../models/Discount");
const stripe = require('stripe')(process.env.TEST_STRIPE_KEY);
const bcrypt = require('bcrypt');

const registerUser = async (userDetails)=>{
    try{
        const count = await User.where({}).count()
        const first_thousand = count < 1000 ? 1 : 0
        const existusername = await User.where({ 'username': userDetails.username }).count();
        if (existusername > 0) {
            return{message: "Username is already registered.",status: false};
        }
    
        const existEmail = await User.where({ email: userDetails.email }).count();
        if (existEmail > 0) {
            return{ message: 'Email  is already registered',status: false};
        }
    
        if (userDetails.username != userDetails.confirm_username) {
            return{message: "username and confirm username don't matched.",status: false};
        }

        if (userDetails.password.length < 6 ) {
            return{message: "Password should be of at least 6 digit!",status: false};
        }

        if (userDetails.password != userDetails.confirm_password) {
            return{message: "Password and confirm password don't matched.",status: false};
        }
        
        const hash = await hashPassword(userDetails.password, 10);
        const user = await new User({
            'username': userDetails.username,
            'password': hash,
            'first_name': userDetails.name,
            'email': userDetails.email,
            'country_code':userDetails.code,
            'mobile': userDetails.phone,
            'surname': userDetails.family_name,
            'plain_password': userDetails.password,
            'first_thousand' : first_thousand,
            'forgot_password' : 0
        }).save();
    
        const userJson = user.toJSON();
        return { message: "Registered Successfully.", status: true, user: userJson };
    }catch(err){
       console.log("Error in registerUser",err)
       return{message: "something went wrong", status: false};
    }
   }
   
const hashPassword = (password, saltRounds)=>{
       return new Promise((resolve, reject) => {
         bcrypt.hash(password, saltRounds, (err, hash) => {
           if (err) {
             reject(err);
           } else {
             resolve(hash);
           }
         });
       });
   }
   
const checkDiscount = async(user)=>{
       try{
           let count = await Discount.where({ 'is_active': 1 , 'type' : 'user_specific', 'user_id':user.ID}).count();
           if(count>0){
               let user_coupon = await Discount.where({ 'is_active': 1 , 'type' : 'user_specific', 'user_id':user.ID}).fetch();
               return {status:true,coupon:user_coupon.toJSON()}
           }else{
            //    let count = await Discount.where({ 'is_active': 1 , 'type' : 'general'}).count();
            //    if(count>0){
            //        let user_coupon = await Discount.where({ 'is_active': 1 , 'type' : 'general'}).fetch();
            //        return {status:true,coupon:user_coupon.toJSON()} 
            //    }
               return {status:false}
           }
       }catch(err){
           console.log("Error in checkDiscount",err)
           return {status:false}
       }
   }
   
const createAndUpdateCustomerStripe = async(user,discountObj,stripeToken,card_src,amount_paid)=>{
    try{
           if(user.customer_id === null){
               let customer;
               if(discountObj?.status){
                   let discountAmount = (amount_paid * discountObj.coupon.discount_by_percentage) / 100;
                   amount_paid = amount_paid - discountAmount
                   customer = await stripe.customers.create({
                       source: stripeToken,
                       description: 'By username : ' + user.username,
                       name: user.first_name,
                       email: user.email,
                       coupon:discountObj.coupon.coupon_code
                   });
               }else{
                   customer = await stripe.customers.create({
                       source: stripeToken,
                       description: 'By username : ' + user.username,
                       name: user.first_name,
                       email: user.email
                   }); 
               }
               await User.where({ 'ID': user.ID }).save({
                   'customer_id': customer.id,
               }, { patch: true });
               return {status : true, customerId : customer.id}
           }else{
                const customer = await stripe.customers.retrieve(
                    user.customer_id
                )
                if(customer.default_source !== card_src){
                    
                    const card = await stripe.customers.createSource(
                        user.customer_id,
                        {source: stripeToken}
                    );
                    const customer = await stripe.customers.update(
                        user.customer_id,
                    {
                        default_source: card.id
                    }
                    );
                }
                if(discountObj.status){     
                    await stripe.customers.update(
                        user.customer_id,
                        {coupon : discountObj.coupon.coupon_code}
                    );
                }
               return {status : true, customerId : user.customer_id}
           }
       }catch(err){
           console.log("Error in createAndUpdateCustomerStripe",err)
           return {status : false, isCustomerUpdated: user.customer_id === null ? false : true}
       }
      
}


const updatePerAppQuantity = async (data)=>{
    try{
        let subscription = await stripe.subscriptions.retrieve(
            data.subscripton_id
        );
        const per_app_item = subscription.items.data.find(item => item.price.id === data.per_app_price_id);
        await stripe.subscriptionItems.update(
            per_app_item.id,
            {
                quantity : data.per_app_quantity,
                proration_behavior: 'none'
            }
        );  
        
    }catch(err){
        console.log("Error in updatePerAppQuantity",err)
        return false
    }
}

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    auth: {
        user: 'sahils.mvteams@gmail.com',
        pass: 'xqrwwctsfckfjcxz'
    }
});
 
async function replaceEmailConstantsWithValues(template, constants, data) {

    for (const constant of constants) {
      const placeholder = "[["+constant+"]]";
      if(template.includes(placeholder)) console.log(placeholder)
      if (template.includes(placeholder)) {
        if (constant in data) {
          const value = data[constant];
          template = template.replace(placeholder, value);
        }
      }
    }
    return template;
}
  
function isOneDayOrLessLeft(targetTime) {
    const currentTime = new Date().getTime();
    const differenceInTime = targetTime - currentTime;

    // Calculate the number of milliseconds in one day
    const oneDayMilliseconds = 24 * 60 * 60 * 1000;

    // Check if the difference is less than or equal to one day
    if (differenceInTime <= oneDayMilliseconds) {
        return true;
    } else {
        return false;
    }
}
  
const updatePerMinuteQuantity = async function(data){
    try{
        await delay(1000)
        let subscription = await stripe.subscriptions.retrieve(
            data.subscripton_id
        );
        const per_minute_item = subscription.items.data.find(item => item.price.id === data.per_minute_price_id);

        await stripe.subscriptionItems.update(
            per_minute_item.id,
            {
            quantity : data.per_minute_quantity,
            proration_behavior: 'none'
            }
        );  
        await User.where({ 'ID': data.userId }).save({
            'used': 0,
        }, { patch: true });
        // return {status: true}
    }catch(err){
        console.log("Error in updatePerMinuteQuantity",err)
        // return {status: false}
        // return
    }
}
const delay = ms => new Promise(res => setTimeout(res, ms));

const generateRandomString = () => {
    return new Promise((resolve, reject) => {
      const length = 7;
      const alphanumericChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let randomString = '';
  
      for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * alphanumericChars.length);
        randomString += alphanumericChars[randomIndex];
      }
  
      resolve(randomString);
    });
  };
  


const getDateDiff = async(userDetails)=>{
    const currentDate = new Date();
    const startingDate =  new Date(userDetails?.starting_date)
    const formattedCurrentDate = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${currentDate.getDate().toString().padStart(2, '0')}`;
    console.log("formattedCurrentDate",formattedCurrentDate , new Date(formattedCurrentDate).getTime()) 
    const formattedStartingDate = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${currentDate.getDate().toString().padStart(2, '0')}`;
    console.log("formattedStartingDate",formattedStartingDate,new Date(formattedStartingDate).getTime()) 
    return (formattedCurrentDate == formattedStartingDate)
}

module.exports = {registerUser,hashPassword,checkDiscount,createAndUpdateCustomerStripe,updatePerAppQuantity,transporter,replaceEmailConstantsWithValues,isOneDayOrLessLeft,updatePerMinuteQuantity,delay,generateRandomString,getDateDiff}