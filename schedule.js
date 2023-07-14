const cron = require('node-cron');
const User = require('./models/User');
let knex = require('knex');
let knexfile = require('./knexfile.js');
const Plan = require('./models/Plan');
let db = knex(knexfile.development);
const stripe = require('stripe')('sk_test_51NQ4fmAkUiKpvdL3NF0vA1uM5yCf0o5fmfsBblqFLGLhP9OAu0h0laGdO6571MM5CPlu2KZtfBmgo5MtVWh6W10h00eP38kfab');

const  updatePerMinuteQuantityScheduler= cron.schedule('10 35  14 * * *', async () => {
  try{
    let allUsers = await db('users')
      .where('users.subscription_status', 1)
      .whereNotNull('users.customer_id');

      for(let k in allUsers){   
        let user_data =  await User.where({'ID': allUsers[k].ID}).fetch({ withRelated: ['plan_detail',{'user_plan': (qb) => {
          qb.where('is_active', true).limit(1);
        }}] });
        user_data = user_data.toJSON()
        await delay(1000)
  
        const incoming_invoice = await stripe.invoices.retrieveUpcoming({
          customer:user_data['customer_id'],
        });
        let next_invoice_pay_date = incoming_invoice.next_payment_attempt * 1000
        
        if(incoming_invoice && user_data.used > 0 && user_data.plan_detail !== undefined && Object.keys(user_data.plan_detail).length > 0 && user_data.user_plan.length > 0){
          console.log("isOneDayOrLessLeft(next_inoive_pay_date",isOneDayOrLessLeft(next_invoice_pay_date))
          if(isOneDayOrLessLeft(next_invoice_pay_date)){
            console.log("user_data.plan_detail",user_data.plan_detail)
            let data = {
              'userId': user_data.ID,
              "per_minute_price_id": user_data.plan_detail.per_minute_price_id,
              "per_minute_quantity": user_data.used,
              "subscripton_id" : user_data.user_plan[0].subscription_id
            }
            await updatePerMinuteQuantity(data)
          
          }
        }
      }
  }catch  (err){
    console.log("Error while inserting all news feeds",err)
  }
});

const trackTrialPlanScheduler = cron.schedule('59 10 15 * * *', async () => {
  try{
    let currentTime =  new Date().getTime()
    let count = await User.where({'trail_status' : 'start'}).count();
    console.log("count",count)
    if(count  > 0){   
      let allUsers = await User.where({'trail_status' : 'start'}).fetchAll();
      allUsers = allUsers.toJSON();
      allUsers.forEach(async (user) => {
        let startTime  = new Date(user.trail_start_date).getTime()
        const timeDifference = Math.abs(currentTime - startTime);
        const hours = Math.floor(timeDifference / (1000 * 60 * 60));
        console.log("hours",hours)
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

function isOneDayOrLessLeft(targetTime) {
  const currentTime = new Date(1691868598000).getTime();
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
    console.log("data>>>>.",data)
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
   
  }catch(err){
      console.log("Error in updatePerMinuteQuantity",err)
  }
}
const delay = ms => new Promise(res => setTimeout(res, ms));



module.exports = {updatePerMinuteQuantityScheduler,trackTrialPlanScheduler}