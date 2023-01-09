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
const stripe = require('stripe')('sk_test_51ImKQbAMjNDVHKZlXycRU5zEeZlyZW7HHL25yLBenlFeKrkiuiM3Xgje8XAYnKpbaa7i2gLSU0p6XgX5gIQlCADD00F60in1Rw');
const bcrypt = require('bcrypt');
var jwt = require('jsonwebtoken');
const saltRounds = 10;


exports.usersList = async function (req, res) {

    var users = await User.where({ }).fetchAll();
    users = users.toJSON();



    res.status(200).send({
        message: "users list",
        status: 1,
        data: users

    });
    return

}

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
		'auto_renewal':data.auto_renewal,
		'type':data.type,
		'span':data.span
        })
            .save(null, { method: 'insert' });

        res.status(200).send({
            message: "Successfully Added",
            status: 1
        });

    });
}
exports.userUpdate = async function (req, res) {
    var data = req.body



    bcrypt.hash(data.password, saltRounds, async function (err, hash) {


        await User.where({ 'ID': data.ID }).save({
            'password': hash,
            'first_name': data.first_name,

            'mobile': data.mobile,
            'surname': data.surname,
            'plain_password': data.password,
		'auto_renewal':data.auto_renewal,
		'type':data.type,
		'span':data.span
        }, { patch: true });


        res.status(200).send({
            message: "Successfully Updated",
            status: 1
        });

    });
}

exports.userDelete = async function (req, res) {
    var data = req.body;
    await User.where({ 'ID': data.ID }).destroy();
    res.status(200).send({
        message: "Successfully deleted",
        status: 1
    });
}

exports.consoleUserAdd = async function (req, res) {
    var data = req.body;
    bcrypt.hash(data.password, saltRounds, async function (err, hash) {
        var exist = await User.where({ "username": data.username, "user_type": "admin" }).count();
        console.log(exist,'exist')
        if (exist > 0) {
            await User.where({ 'username': data.username }).save({
                'password': hash,
                'plain_password':data.password

            }, { patch: true });

            res.status(200).send({
                message: "Successfully Updated",
                status: 1
            });

        } else {
            await new User({
                'username': data.username,
                'password': hash,
                'plain_password':data.password,
                'user_type':'admin'

            }).save(null, { method: 'insert' });
            res.status(200).send({
                message: "Successfully Added",
                status: 1
            });

        }
    })
}
