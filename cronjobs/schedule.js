const cron = require('node-cron');
const User = require('../models/User.js');
let knex = require('knex');
let knexfile = require('../knexfile.js');
let db = knex(knexfile.development);
const stripe = require('stripe')(process.env.TEST_STRIPE_KEY);
const {isOneDayOrLessLeft,updatePerMinuteQuantity,delay,checkDiscount, updatePerAppQuantity} = require("../utils/index.js");

const  updatePerMinuteQuantityScheduler= cron.schedule('10 42  11 * * *', async () => {
  try{
      let allUsers = await db('users')
      .where('users.subscription_status', 1)
      .whereNotNull('users.customer_id');

      for(let k in allUsers){   
        try{
          let user_data =  await User.where({'ID': allUsers[k].ID, 'trail_status': ['end', null] }).fetch({ withRelated: ['plan_detail',{'user_plan': (qb) => {
            qb.where('is_active', true).limit(1);
          }}, {'discount': (qb) => {
            qb.where('is_active', true)
          }}] });
          user_data = user_data.toJSON()
  
          await delay(1000)
          
          const incoming_invoice = await stripe.invoices.retrieveUpcoming({
            customer:user_data['customer_id'],
          });
          let next_invoice_pay_date = incoming_invoice.next_payment_attempt * 1000
          let discountObj = await checkDiscount(user_data)
          if(discountObj?.status){
            await stripe.customers.update(
              user_data.customer_id,
              {coupon : discountObj?.coupon?.coupon_id}
            );
          }

          if(incoming_invoice && user_data?.used > 0 && user_data?.user_plan.length > 0 && user_data?.user_plan[0]?.per_minute_price_id !== null){
            if(isOneDayOrLessLeft(next_invoice_pay_date)){
              let data = {
                'userId': user_data.ID,
                "per_minute_price_id": user_data?.user_plan[0]?.per_minute_price_id,
                "per_minute_quantity": user_data.used,
                "subscripton_id" : user_data.user_plan[0].subscription_id
              }
              await updatePerMinuteQuantity(data)
            }
          }
        }catch{
          continue
        } 
      }
  }catch  (err){
    console.log("Error while inserting updatePerMinuteQuantityScheduler",err)

  }
});

const trackTrialPlanScheduler = cron.schedule('59 53 14 * * *', async () => {
  try{
    let currentTime =  new Date().getTime()
    let count = await User.where({'trail_status' : 'start'}).count();
    if(count  > 0){   
      let allUsers = await User.where({'trail_status' : 'start'}).fetchAll();
      allUsers = allUsers.toJSON();
      allUsers.forEach(async (user) => {
        let startTime  = new Date(user.trail_start_date).getTime()
        const timeDifference = Math.abs(currentTime - startTime);
        const hours = Math.floor(timeDifference / (1000 * 60 * 60));
        if(hours > 336){
          await User.where({ 'ID': user.ID }).save({
            'trail_status': "end",
            'trail_end_date': new Date(currentTime),
          }, { patch: true });
        }
      });
    }
  }catch  (err){
    console.log("Error in trackTrialPlanScheduler",err)    
  }
});



module.exports = {updatePerMinuteQuantityScheduler,trackTrialPlanScheduler}