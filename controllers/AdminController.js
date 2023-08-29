var express = require('express');
var router = express.Router();
//var Database = require('../models/Database');
var DBHelper = require('../helpers/db');
var User = require('../models/User');
var Payment = require('../models/Payment');
var Plan = require('../models/Plan');
var UserFile = require('../models/UserFile');
var Folder = require('../models/Folder');
var Temp = require('../models/Temp');
/* GET home page. */
const stripe = require('stripe')(process.env.TEST_STRIPE_KEY);
const bcrypt = require('bcrypt');
var jwt = require('jsonwebtoken');
const Discount = require('../models/Discount');
const Plans_for_thousands = require('../models/Plans_for_thousands');
const NewPlans = require('../models/NewPlans');
const Plans_Pricing = require('../models/Plans_Pricing');
const saltRounds = 10;


/**Get all users list from users table */
exports.usersList = async function (req, res) {

    var users = await User.where({}).fetchAll({ withRelated: [{
        'discount': (qb) => {
          qb.where('is_active', true)
        }
    }]});
    users = users.toJSON();
    res.status(200).send({
        message: "users list",
        status: 1,
        data: users

    });
    return

}

/** Create new user */
exports.userAdd = async function (req, res) {
    var data = req.body
    var existusername = await User.where({ 'username': data.username }).count();
    if (existusername > 0) {
        res.status(200).send({
            message: "Username is already registed.",
            status: 0
        });
        return
    }


    var existEmail = await User.where({ email: data.email }).count();
    if (existEmail > 0) {
        res.status(200).send({
            message: 'Email  is already registered',
            status: 0
        });
    }

    bcrypt.hash(data.password, saltRounds, async function (err, hash) {
        var user = await new User({
            'username': data.username,
            'password': hash,
            'first_name': data.first_name,
            'email': data.email,
            'mobile': data.mobile,
            'surname': data.surname,
            'plain_password': data.password,
            'auto_renewal': data.auto_renewal,
            'type': data.type,
            'span': data.span,
            'country_code':data.code,
            'by_admin':1,
            'subscription_status':1
        })
            .save(null, { method: 'insert' });

        if(data && data.discount_by_percentage){
            const coupon_name = "DISCOUNT" + data.discount_by_percentage
            const coupon = await stripe.coupons.create({
                percent_off: data.discount_by_percentage,
                duration: 'forever',
                name:coupon_name
            });
           
            // Save the new discount
            const newDiscount = await new Discount({
            'coupon_code': coupon.id,
            'is_active': 1,
            'type': "user_specific",
            'discount_by_percentage': data.discount_by_percentage,
            'user_id':user.id
            }).save(null, { method: 'insert' });
    
            // Update the is_active property of all discounts to 0 except for the new discount
            await Discount.query().where({'type':'user', 'user_id' : user.id}).whereNot('id', newDiscount.id).update({ is_active: 0 });
            
        }
        res.status(200).send({
            message: "Successfully Added",
            status: 1
        });

    });
}

/**Update user */
exports.userUpdate = async function (req, res) {
    var data = req.body
    bcrypt.hash(data.password, saltRounds, async function (err, hash) {
        let user  = await User.where({ 'ID': data.ID }).save({
            'password': hash,
            'first_name': data.first_name,

            'mobile': data.mobile,
            'surname': data.surname,
            'plain_password': data.password,
            'auto_renewal': data.auto_renewal,
            'type': data.type,
            'span': data.span
        }, { patch: true });
        user = user.toJSON()
        if(data && data.discount_by_percentage){
            const coupon_name = "DISCOUNT" + data.discount_by_percentage
            const coupon = await stripe.coupons.create({
                percent_off: data.discount_by_percentage,
                duration: 'forever',
                name:coupon_name
            });
            if(user.customer_id !== null){
                await stripe.customers.update(
                    user.customer_id,
                    {coupon : coupon.id}
                );
            }
            // Save the new discount
            const newDiscount = await new Discount({
            'coupon_code': coupon.id,
            'is_active': 1,
            'type': "user_specific",
            'discount_by_percentage': data.discount_by_percentage,
            'user_id':data.ID
            }).save(null, { method: 'insert' });

            // Update the is_active property of all discounts to 0 except for the new discount
            await Discount.query().where({'type':'user_specific', 'user_id' : data.ID}).whereNot('id', newDiscount.id).update({ is_active: 0 });
        }else{
            await Discount.query().where({'type':'user_specific', 'user_id' : data.ID}).update({ is_active: 0 });
        }
        res.status(200).send({
            message: "Successfully Updated",
            status: 1
        });

    });
}

/** Delete user */
exports.userDelete = async function (req, res) {
    var data = req.body;
    await User.where({ 'ID': data.ID }).destroy();
    res.status(200).send({
        message: "Successfully deleted",
        status: 1
    });
}

/**Add new console user */
exports.consoleUserAdd = async function (req, res) {
    var data = req.body;
    bcrypt.hash(data.password, saltRounds, async function (err, hash) {
        var exist = await User.where({ "username": data.username, "user_type": "admin" }).count();
        if (exist > 0) {
            await User.where({ 'username': data.username }).save({
                'password': hash,
                'plain_password': data.password

            }, { patch: true });

            res.status(200).send({
                message: "Successfully Updated",
                status: 1
            });

        } else {
            await new User({
                'username': data.username,
                'password': hash,
                'plain_password': data.password,
                'user_type': 'admin'

            }).save(null, { method: 'insert' });
            res.status(200).send({
                message: "Successfully Added",
                status: 1
            });

        }
    })
}


exports.userUpdateTrackedTime = async function(req,res){
    try{
        let data = req.body
        let userData = await User.where({ 'ID': req.user.ID }).fetch()
        const currentUsedValue = userData.get('used');
        const updatedUsedValue = currentUsedValue + req.body.used;
        await User.where({ 'ID': req.user.ID }).save({ 'used': updatedUsedValue }, { patch: true });
     
        res.status(200).send({
            message: "Successfully Updated",
            status: 1
        });
    }catch(err){
        console.log("Error userUpdateTrackedTime",err)  

    }
}

exports.createCoupon= async function(req,res){
    try{
        const data = req.body;
        let count = await Discount.where({'type': 'general', 'is_active': 1})
        const coupon_name = "DISCOUNT" + data.discount_by_percentage;
        const coupon = await stripe.coupons.create({
            percent_off: data.discount_by_percentage,
            duration: 'forever',
            name:coupon_name
        });
        // Save the new discount
        const newDiscount = await new Discount({
        'coupon_code': coupon.id,
        'is_active': 1,
        'type': data.type,
        'discount_by_percentage': data.discount_by_percentage
        }).save(null, { method: 'insert' });

        // Update the is_active property of all discounts to 0 except for the new discount
        await Discount.query().where('type', 'general').whereNot('id', newDiscount.id).update({ is_active: 0 });
        
        res.status(200).send({
            message: count !== 0 ? "Coupon updated successfully." : "Coupon created successfully.",
            status: 1,
        });
    }catch(err){
        console.log("Error in createCoupon",err)
    }
}


exports.fetchActiveCoupon= async function(req,res){
    try{
        let activeCoupon = {}
        let count = await Discount.where({ 'is_active': 1 , 'type':'general'}).count();
        if(count > 0){
            activeCoupon = await Discount.where({ 'is_active': 1 , 'type':'general'}).fetch();
            activeCoupon = activeCoupon.toJSON()
           
        }
        res.status(200).send({
            status: 1,
            activeCoupon:activeCoupon
        });
    }catch(err){
        console.log("Error in fetchActiveCoupon",err)
        res.status(200).send({
            status: 1,
            activeCoupon:{}
        });
    }
}

// price: '51', id: 2, type: 'monthly_5_app'
exports.updatePlanPrice = async function(req,res){
    try{
        const data = req.body
        data.forEach(async (element) => {
            let plan
            if(req.params?.activeTab === "1"){
               
                // plan = await Plans_for_thousands.where({'id' : element.id}).fetch()
                plan =  await NewPlans.where({'id' : element.id}).fetch({ withRelated: [{'plans_pricing': (qb) => {
                    qb.where('for_thousand', 1)
                }}] });
            }else{
                // plan = Plan.where({'id' : element.id}).fetch()
                plan =  await NewPlans.where({'id' : element.id}).fetch({ withRelated: [{'plans_pricing': (qb) => {
                    qb.where('for_thousand', 0)
                }}] });
            }
            plan = plan.toJSON()
            const price = element.price % 1 != 0 ? parseFloat(element.price) : parseInt(element.price)
            if(plan[element.type] !== price){
                let newPlanPrice = await createNewPlanPrice(element,plan)

                if(newPlanPrice.status){
                    let updated_plan  = await updatePlan(element,price,newPlanPrice.price,req.params?.activeTab)
                    if(updated_plan.status){
                        res.status(200).send({
                            status: 1,
                            message:"Updated Successfully"
                        }); 
                    }else{
                        res.status(200).send({
                            status: 0,
                            message:"Something went wrong"
                        }); 
                    }
                }else{
                    res.status(200).send({
                        status: 0,
                        message:"Something went wrong"
                    });
                }
            }
        });
    }catch(err){
        console.log("Error in updatePlanPrice",err)
    }
}

const createNewPlanPrice = async(dataObj,plan)=>{

    try{
        const priceInCents = dataObj.price * 100 
        const interval = dataObj?.monthly_per_app || dataObj?.monthly_5_app || dataObj?.user_per_min ? 'month' : 'year'
        const tiers_mode = dataObj.user_per_min ? "graduated" : "volume"
        const  getTiersArray = await createTiersArray(dataObj,priceInCents,plan)
        let new_price = await stripe.prices.create({
                currency: 'usd',
                recurring: {interval: interval},
                product: plan.product_id,
                billing_scheme: "tiered",
                tiers_mode:tiers_mode,
                tiers: getTiersArray,
                expand: ['tiers'],  
            });
        return{status:true, price:new_price}
    }catch(err){
        console.log("Error in createNewPrice",err)
        return{status:false}
    }
}

const updatePlan = async(element,price,priceObj,activeTab)=>{
    try{
        const getUpdatedObj = await createUpdatedObj(element,price,priceObj)
        console

        if(activeTab === "1"){
            await Plans_Pricing.where({'id' : element.id, 'for_thousand' : 1}).save(getUpdatedObj, { patch: true });
            return {status :true}
        }else{
            await Plans_Pricing.where({'id' : element.id, 'for_thousand' : 0}).save(getUpdatedObj, { patch: true });
            return {status :true}
        }
        
    }catch(err){
        console.log("Error in updatePlan",err)
        return {status :false}
    }
    
}
const createTiersArray = async (dataObj,priceInCents,plan)=>{
    let tiersArray =  [];
    try{
        if(dataObj.type === 'monthly_per_app'){
            const monthly_5_app_price = plan?.plans_pricing[0]?.monthly_5_app * 100
            tiersArray = [
                {
                    flat_amount: monthly_5_app_price,
                    up_to: 5,
                },
                {
                    unit_amount: priceInCents,
                    up_to: 'inf',
                }
            ]
        }
        if(dataObj.type === "monthly_5_app"){
            const monthly_per_app_price = plan?.plans_pricing[0]?.monthly_per_app * 100

            tiersArray = [
                {
                    flat_amount:priceInCents,
                    up_to: 5,
                },
                {
                    unit_amount: monthly_per_app_price,
                    up_to: 'inf',
                }
            ]
        }
        if(dataObj.type === "yearly_per_app"){
            const yearly_5_app_price = plan?.plans_pricing[0]?.yearly_5_app * 100

            tiersArray = [
                {
                    flat_amount:yearly_5_app_price,
                    up_to: 5,
                },
                {
                    unit_amount: priceInCents,
                    up_to: 'inf',
                }
            ] 
        }
        if(dataObj.type === "yearly_5_app"){
            const yearly_per_app_price = plan?.plans_pricing[0]?.yearly_per_app * 100
            tiersArray = [
                {
                    flat_amount:priceInCents,
                    up_to: 5,
                },
                {
                    unit_amount: yearly_per_app_price,
                    up_to: 'inf',
                }
            ] 
        }
        if(dataObj.type === "user_per_minute"){
            tiersArray = [
                {
                    unit_amount:priceInCents,
                    up_to: 'inf',
                }
            ] 
        }
    }catch(err){
        console.log("Error in createNewPrice",err)
    }
    return tiersArray;
}


const createUpdatedObj= async (element,price,priceObj)=>{
    try{
        if(element.type === "monthly_per_app"){
            return {
                'monthly_per_app': price,
                'monthly_price_id' : priceObj.id,
            }
        }
        if(element.type === "monthly_5_app"){
            return {
                'monthly_5_app': price,
                'monthly_price_id' : priceObj.id,
            }
        }
        if(element.type === "yearly_per_app"){
            return {
                'yearly_per_app': price,
                'yearly_price_id' : priceObj.id,
            }
        }
        if(element.type === "yearly_5_app"){
            return {
                'yearly_5_app': price,
                'yearly_price_id' : priceObj.id,
            }
        }
        if(element.type === "user_per_min"){
            return {
                'user_per_min': element.price,
                'per_minute_price_id' : priceObj.id,
            }
        }
    }catch(err){
        console.log("Error in createUpdatedObj")
    }
}
