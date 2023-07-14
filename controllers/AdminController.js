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
const stripe = require('stripe')('sk_test_51NQ4fmAkUiKpvdL3NF0vA1uM5yCf0o5fmfsBblqFLGLhP9OAu0h0laGdO6571MM5CPlu2KZtfBmgo5MtVWh6W10h00eP38kfab');
const bcrypt = require('bcrypt');
var jwt = require('jsonwebtoken');
const Discount = require('../models/Discount');
const saltRounds = 10;


/**Get all users list from users table */
exports.usersList = async function (req, res) {

    var users = await User.where({}).fetchAll({ withRelated: [{
        'discount': (qb) => {
          qb.where('is_active', true)
        }
    }]});
    users = users.toJSON();
    console.log("users::::::::>>>",users)

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
    console.log("data:::::>>>",data)
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
            'span': data.span
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
    console.log("req.body",data)
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
            console.log("user",user)
            if(user.customer_id !== null){
                console.log("update customer",user.customer_id)
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
        console.log(exist, 'exist')
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
            message: "Coupon Created Successfully ",
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
            console.log("activeCoupon",activeCoupon)
           
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