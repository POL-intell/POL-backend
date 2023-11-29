var express = require('express');
var router = express.Router();
var DBHelper = require('../helpers/db');
var User = require('../models/User');
var Payment = require('../models/Payment');
var Plan = require('../models/Plan');
var UserFile = require('../models/UserFile');
var Folder = require('../models/Folder');
var Temp = require('../models/Temp');
var DefaultConnection = require('../models/DefaultConnection');
const stripe = require('stripe')(process.env.TEST_STRIPE_KEY);
const bcrypt = require('bcrypt');
var jwt = require('jsonwebtoken');
const UserPlans = require('../models/UserPlans');
const PlansForThousands = require("../models/Plans_for_thousands")
const Discount = require('../models/Discount');
const {registerUser,checkDiscount,createAndUpdateCustomerStripe,updatePerAppQuantity,hashPassword,generateRandomString, getDateDiff, getPlanDetails,  generateSubscriptionObject, generateUpdateObject, getTrialStatus}  = require("../utils/index")
const {sendForgotPasswordEmail,newRegistrationEmail} = require("../services/EmalServices");
const NewPlans = require('../models/NewPlans');

/**
 * Retrieves a list of plans along with their details.
 * @params {Object} req - The request object.
 * @params {Object} res - The response object.
*/
exports.plans = async function (req, res) {
    const count = await User.where({}).count()
    let plans;
    if( count < 1000){
        plans = await NewPlans.where({}).fetchAll({ withRelated: [{'plans_pricing': (qb) => {
            qb.where('for_thousand', 1)
        }}] });
    }else{
        plans = await NewPlans.where({}).fetchAll({ withRelated: [{'plans_pricing': (qb) => {
            qb.where('for_thousand', 0)
        }}] });
    }
    res.status(200).send({
        message: "Plan list",
        status: 1,
        data: plans.toJSON()
    });
}


/**
 * Retrieves a list of plans along with their details for admin.
 * @params {Object} req - The request object => ({activeTab}).
 * @params {Object} res - The response object.
*/
exports.plansForPricing = async function (req, res) {
    let {activeTab} = req.params
    let plans;
    if( activeTab === "1"){
        plans = await NewPlans.where({}).fetchAll({ withRelated: [{'plans_pricing': (qb) => {
            qb.where('for_thousand', 1)
        }}] });
    }else{
        plans = await NewPlans.where({}).fetchAll({ withRelated: [{'plans_pricing': (qb) => {
            qb.where('for_thousand', 0)
        }}] });
    }
  
    res.status(200).send({
        message: "Plan list",
        status: 1,
        data: plans.toJSON()
    });
}

/**
 * login to pol by username and password.
 * @params {Object} req - The request object =>({username, password}).
 * @params {Object} res - The response object.
*/
exports.login = async function (req, res) {
    try{
        var data = req.body
        var exist = await User.where({ 'username': data.username }).count();
        if (exist === 0) {
            res.status(200).send({
                message: "User doesn't exist with this username.",
                status: 0
            });
        }else{
            var user = await User.where({ 'username': data.username }).fetch();
            user = user.toJSON();
            bcrypt.compare(data.password, user.password, async function (err, result) {
                if(err){
                    res.status(200).send({
                        message: "Wrong credentials.",
                        status: 0,
                        user : user
                    });
                }
                if (result) {
                    var jwtToken = jwt.sign({ email: user.email, ID: user.ID }, 'RESTFULAPIs', { expiresIn: '60d' });
                    var user_detail = await getUserData(user.ID);
                    res.status(200).send({
                        message: "Login Successfull.",
                        status: 1,
                        token: jwtToken,
                        user_type: user.user_type,
                        subscription: user.span,
                        subscription_status: user_detail.subscription_status,
                        user_detail: user_detail,
                        trail_status:user_detail.trail_status
                    });
                } else {
                    res.status(200).send({
                        message: "Wrong credentials.",
                        status: 0,
                        user : user
                    });
                }
            });
        }
    }catch(err){
        console.log("Error in login",err)
    }
}


/**
 * Retrieve the user detail of logged in user.
 * @params {Object} req - The request object => ({user.ID}).
 * @params {Object} res - The response object.
*/
exports.userDetail = async function (req, res) {
    var data = req.body
    var user = await User.where({ 'ID': req.user.ID }).fetch({ withRelated: ['default_connection','payment_detail', 'plan_detail','discount',{'user_plan': (qb) => {
        qb.where('is_active', true).limit(1);
    }}] });
    user = user.toJSON();
    res.status(200).send({
        message: "User Detail",
        status: 1,
        data: user
    });
}

exports.fetchUser = async function (req, res){
    let {userId} = req.params
    var user = await User.where({ 'ID': userId }).fetch();
    user = user.toJSON();
    res.status(200).send({
        message: "User Detail",
        status: 1,
        forgot_password: user.forgot_password
    });
}

/**
 * Save the new file  according to user id in database.
 * @params {Object} req - The request object => ({user.ID}).
 * @params {Object} res - The response object.
*/
exports.saveFile = async function (req, res) {

    var data = req.body

    var exitfile = await UserFile.where({ 'name': data.name, 'user_id': req.user.ID, 'folder_id':data.folder_id }).count();

    if (exitfile == 0) {

        var user = await new UserFile({
            'name': data.name,
            'file': data.file,
            'user_id': req.user.ID,
            'folder_id': data.folder_id

        }).save(null, { method: 'insert' });
        
        var existTemp = await Temp.where({ 'user_id': req.user.ID }).count();
        if (existTemp > 0) {
            await Temp.where({ 'user_id': req.user.ID }).destroy();
        }
        let user_files_count =  await UserFile.where({'user_id': req.user.ID }).count();
        let user_data = await getUserData(req.user.ID)
        if(user_files_count > 5 && user_data?.trail_status !== 'start'){
            let per_app_price_id = user_data?.user_plan[0]?.per_app_price_id
            
            let data = {
                subscripton_id:user_data?.user_plan[0]?.subscription_id,
                per_app_price_id: per_app_price_id, 
                per_app_quantity: user_files_count
            }
            await updatePerAppQuantity(data)
            res.status(200).send({
                message: "File saved Successfully ",
                status: 1,
                data: user
            });
        }else{
            res.status(200).send({
                message: "File saved Successfully ",
                status: 1,
                data: user
            });
        }
        return
    } else {

        res.status(200).send({
            message: "This file name already exists, choose another name",
            status: 0,

        });

    }
}

/**
 * Delete the saved file  according to user id in database.
 * @params {Object} req - The request object => ({id}).
 * @params {Object} res - The response object.
*/
exports.deleteFiles = async function(req,res){
    let data = req.body
    console.log("data",data)
    if(data.type === 'folder'){
        let count = await UserFile.where({'folder_id': data.id }).count()
        console.log("count",count)
        if(count > 0){
            let allFiles = await UserFile.where({'folder_id': data.id }).fetchAll()
            allFiles = allFiles.toJSON()
            for(let file of allFiles){
                await UserFile.where({'id': file.id }).destroy();
            }
            await Folder.where({'id':data.id}).destroy();
            res.status(200).send({
                message: "Successfully deleted",
                status: 1
            });
        }else{
            await Folder.where({'id':data.id}).destroy();
            res.status(200).send({
                message: "Successfully deleted",
                status: 1
            });
        } 
    }else{
        await UserFile.where({'id':data.id}).destroy();
        res.status(200).send({
            message: "Successfully deleted",
            status: 1
        });
    }
    
}

/**
 * Update  the existing file  according to user id in database.
 * @params {Object} req - The request object => ({id}).
 * @params {Object} res - The response object.
*/
exports.updateFile = async function (req, res) {

    var data = req.body

    await UserFile.where({ 'id': data.id }).save({
        'file': data.file,
    }, { patch: true });

    res.status(200).send({
        message: "File update Successfully ",
        status: 1,

    });
    return
}

/**
 * To retrieve  all the fiels created by user.
 * @params {Object} req - The request object => ({user.ID}).
 * @params {Object} res - The response object.
*/
exports.getuserFiles = async function (req, res) {


    var files = await UserFile.where({ 'user_id': req.user.ID }).fetchAll();

    res.status(200).send({
        message: "Files list ",
        status: 1,
        data: files.toJSON()

    });
    return
}


/**
 * To save folder according to parnet folder of a user.
 * @params {Object} req - The request object => ({folder_name,parent_folder_id,user.ID}).
 * @params {Object} res - The response object.
*/
exports.saveFolder = async function (req, res) {
    var data = req.body

    var folder = await new Folder({
        'folder_name': data.folder_name,
        'parent_folder_id': data.parent_folder_id,
        'user_id': req.user.ID,

    }).save(null, { method: 'insert' });

    res.status(200).send({
        message: "Folder has been saved",
        status: 1
    });
    return
}

/**
 * To get the list of main root folders (folders that have not parent folder).
 * @params {Object} req - The request object => ({user.ID}).
 * @params {Object} res - The response object.
*/
exports.mainFolders = async function (req, res) {


    var folders = await Folder.where({ 'user_id': req.user.ID, 'parent_folder_id': 0 }).fetchAll();

    res.status(200).send({
        message: "Folder list ",
        status: 1,
        data: folders.toJSON()

    });
    return
}

/**
 * To get the folders routes (path of folder).
 * @params (number) => folder_id
 * @response [array] => The array contains the folder paths.
*/
async function getFolderRoute(folder_id) {

    var is_folder = await Folder.where({ 'id': folder_id }).count();
    if (is_folder == 0) {
        return [];
    }
    var arr = [];
    var folder = await Folder.where({ 'id': folder_id }).fetch();
    folder = folder.toJSON()
    var parent_id = folder.parent_folder_id
    arr.push(folder.folder_name)
    var is_next = true
    if (parent_id > 0) {
        while (is_next == true) {
            var has = await Folder.where({ 'id': parent_id }).count();
            if (has > 0) {
                var folder = await Folder.where({ 'id': parent_id }).fetch();
                folder = folder.toJSON()
                arr.push(folder.folder_name)
                parent_id = folder.parent_folder_id
                if (parent_id == 0) {
                    is_next = false;
                }
            } else {
                is_next = false;
            }
        }
    }
    return arr;
}


/**
 * To get the sub folders list by parent folder id.
 * @params {Object} req - The request object => ({user.ID}).
 * @params {Object} res - The response object.
*/
exports.subFolders = async function (req, res) {
    var folders = await Folder.where({ 'user_id': req.user.ID, 'parent_folder_id': req.params.id }).fetchAll();
    folders = folders.toJSON()
    var list = folders;

    var files = await UserFile.where({ 'user_id': req.user.ID, 'folder_id': req.params.id }).fetchAll();
    files = files.toJSON()

    for (var i = 0; i < files.length; i++) {
        var payload = {
            user_id: files[i].user_id,
            parent_folder_id: '',
            folder_id: files[i].folder_id,
            folder_name: '',
            file_name: files[i].name,
            file: files[i].file,
            created_at: files[i].created_at,
            updated_at: files[i].updated_at,
            id: files[i].id,
        }
        list.push(payload);
    }

    var route = await getFolderRoute(req.params.id);

    res.status(200).send({
        message: "Folder list ",
        status: 1,
        data: list,
        route: route

    });
    return
}


/**
 * To get the back folders list from folder id.
 * @params {Object} req - The request object => ({id, user.ID}).
 * @params {Object} res - The response object.
*/
exports.backSubFolders = async function (req, res) {
    var folder = await Folder.where({ 'id': req.params.id }).fetch();
    folder = folder.toJSON()
    var folders = await Folder.where({ 'user_id': req.user.ID, 'parent_folder_id': folder.parent_folder_id }).fetchAll();
    list = folders.toJSON()
    if (list.length > 0) {
        parent_folder_id = list[0].parent_folder_id
    } else {
        parent_folder_id = 0;
    }
    var files = await UserFile.where({ 'user_id': req.user.ID, 'folder_id': folder.parent_folder_id }).fetchAll();
    files = files.toJSON()

    for (var i = 0; i < files.length; i++) {
        var payload = {
            user_id: files[i].user_id,
            parent_folder_id: '',
            folder_id: files[i].folder_id,
            folder_name: '',
            file_name: files[i].name,
            file: files[i].file,
            created_at: files[i].created_at,
            updated_at: files[i].updated_at,
            id: files[i].id,
        }
        list.push(payload);
    }
    var route = await getFolderRoute(folder.parent_folder_id);
    res.status(200).send({
        message: "Folder list ",
        status: 1,
        data: list,
        parent_folder_id: parent_folder_id,
        route: route

    });
    return
}


/**
 * To get the temporary file of a logge din user.
 * @params {Object} req - The request object => ({user.ID}).
 * @params {Object} res - The response object.
*/
exports.getTemp = async function (req, res) {

    var exist = await Temp.where({ 'user_id': req.user.ID }).count();
    var data = '';
    if (exist > 0) {
        data = await Temp.where({ 'user_id': req.user.ID }).fetch();
        data = data.toJSON()
    }
    res.status(200).send({
        message: "Temp Data",
        status: 1,
        data: data

    });
    return
}


/**
 * Save temporary file to logged in user to database.
 * @params {Object} req - The request object => ({user.ID}).
 * @params {Object} res - The response object.
*/
exports.saveTemp = async function (req, res) {

    var exist = await Temp.where({ 'user_id': req.user.ID }).count();

    var data = req.body

    if (exist == 0) {

        var folder = await new Temp({
            'content': data.content,

            'user_id': req.user.ID,

        })
            .save(null, { method: 'insert' });
    } else {
        await Temp.where({ 'user_id': req.user.ID }).save({
            'content': data.content
        }, { patch: true });
    }

    res.status(200).send({
        message: "Temp data has been saved",
        status: 1
    });
    return
}

/**
 * Open last open files of logged in user.
 * @params {Object} req - The request object => ({user.ID}).
 * @params {Object} res - The response object.
*/
exports.lastOpenFiles = async function (req, res) {

    var files = await UserFile.where({ 'user_id': req.user.ID }).orderBy('updated_at', 'desc').fetchAll();
    files = files.toJSON();

    var arr = [];

    for (var i = 0; i < files.length; i++) {
        var route = await getFolderRoute(files[i].folder_id);
        files[i]['route'] = route;
        arr.push(files[i])
    }

    res.status(200).send({
        message: "Files list ",
        status: 1,
        data: arr

    });
    return

}

/**
 * Save default connection to logged in user.
 * @params {Object} req - The request object => ({user.ID}).
 * @params {Object} res - The response object.
*/
exports.savedefaultConnection = async function (req, res) {
    var exist = await DefaultConnection.where({ 'user_id': req.user.ID }).count();

    var data = req.body

    if (exist > 0) {
        var user = await getUserData(req.user.ID);
        if (user.plan_detail.connection == 'single') {
            await DefaultConnection.where({ 'user_id': req.user.ID }).destroy();
        }
    }

    console.log(data.connection);
    var msg = 'Default Connection has been saved';
    if(data.connection.db_id){
        await DefaultConnection.where({ 'id': data.connection.db_id }).save({
            'connection': JSON.stringify(data.connection),

        }, { patch: true });
         msg = 'Connection" already saved as default!';
 
    }else{
        var folder = await new DefaultConnection({
            'connection': data.connection,

            'user_id': req.user.ID,

        }).save(null, { method: 'insert' });
    }
    var cons = await DefaultConnection.where({ 'user_id': req.user.ID }).fetchAll();
    res.status(200).send({
        message: msg,
        status: 1,
        connections: cons.toJSON()
    });
    return
}


/**
 * Update default connection to logged in user.
 * @params {Object} req - The request object => ({user.ID}).
 * @params {Object} res - The response object.
*/
exports.update_default_connection = async function (req, res) {

    var data = req.body

    var exist = await DefaultConnection.where({ 'id': data.connection.db_id }).count();

   

    if (exist > 0) {
        await DefaultConnection.where({ 'id': data.connection.db_id }).save({
            'connection': JSON.stringify(data.connection),

        }, { patch: true });
    }

  
    var cons = await DefaultConnection.where({ 'user_id': req.user.ID }).fetchAll();
    res.status(200).send({
        message: "Default Connection has been updated",
        status: 1,
        connections: cons.toJSON()
    });
    return
}

/**
 * Update default connection to logged in user.
 * @params {Object} req - The request object => ({user.ID}).
 * @params {Object} res - The response object.
*/
exports.delete_default_connection = async function (req, res) {

    var data = req.body

    var exist = await DefaultConnection.where({ 'id': data.connection.db_id }).count();

    if (exist > 0) {
        await DefaultConnection.where({ 'id': data.connection.db_id }).destroy();
    }

  
    var cons = await DefaultConnection.where({ 'user_id': req.user.ID }).fetchAll();
    res.status(200).send({
        message: "Default Connection has been deleted",
        status: 1,
        connections: cons.toJSON()
    });
    return
}

/**
 * Get the user data bu user id.
 * @params {Object} req - The request object => ({id}).
 * @return {Object} user - The user object with user details.
*/
async function getUserData(id) {
   
    try{
        let user = await User.where({ 'ID': id }).fetch({ withRelated: ['payment_detail', 'plan_detail', 'default_connection',{
            'user_plan': (qb) => {
              qb.where('is_active', 1).limit(1);
            }
        }] });
        user = user.toJSON();
        return user;
    }catch(err){
        console.log("Error in getUserDetails",err)
    }
    
}

/**
 * This function executes when stripe webhook called (webhook called when an invoice paid).
 * @params {Object} req - The request object contains subscription details.
 * @params {Object} res - The response object.
*/
exports.updateUserDetailsHook = async function(req,res){
    try{
        const {object} = req.body.data
        const subscription = await stripe.subscriptions.retrieve(
            object.subscription
        );

        let userDetails = await User.where({'customer_id': object?.customer}).fetch({ withRelated: [{'user_plan': (qb) => {
            qb.where('is_active', true).limit(1);
        }}] });
        userDetails = userDetails.toJSON();

        const per_app_item = subscription.items.data.find(item => item.price.id === userDetails?.user_plan[0]?.per_app_price_id);
        let per_minute_quantity = 0
        
        try{
            await User.where({ 'ID': userDetails?.ID }).save({
                "last_charge" : new Date(),
                "used" : 0
            }, { patch: true });
            let amount_paid = object.amount_paid/100
            await new Payment({
                'user_id': userDetails.ID,
                'transaction_id': object.subscription,
                'amount': amount_paid,
                'currency': object.currency,
                'paid_status': object.paid,
                'status': object.status,
                'receipt_url': object.invoice_pdf,
                'per_app_quantity': per_app_item?.quantity,
                'per_minute_quantity': per_minute_quantity

            }).save(null, { method: 'insert' });
        }catch{
            let amount_paid = object.amount_paid/100
            await new Payment({
                'user_id': userDetails.ID,
                'transaction_id': object.subscription,
                'amount': amount_paid,
                'currency': object.currency,
                'paid_status': object.paid,
                'status': object.status,
                'receipt_url': object.invoice_pdf,
                'per_app_quantity': per_app_item?.quantity,
                'per_minute_quantity':per_minute_quantity

            }).save(null, { method: 'insert' });
        } 
       
        let isTrialEnded = userDetails?.trail_status === "start" ? await getTrialStatus(subscription) : false
        console.log("isTrialEnded",isTrialEnded)
        if(isTrialEnded){
            await User.where({ 'ID': user.ID }).save({
                'trail_status': "end",
                'trail_end_date': new Date(),
            }, { patch: true });
        }

        let getDateDifference = await getDateDiff(userDetails)
        if(userDetails?.user_plan[0]?.per_minute_price_id  !== null && !getDateDifference && subscription.trail_start == null){
            const per_minute_item = subscription.items.data.find(item => item.price.id === userDetails.user_plan[0]?.per_minute_price_id);
            if(per_minute_item){
                per_minute_quantity = per_minute_item?.quantity
                await stripe.subscriptqionItems.update(
                    per_minute_item.id,
                    {
                        quantity : 0,
                        proration_behavior: 'none'
                    }
                );
            }   
        }
        if((userDetails?.user_plan[0]?.cancel_plan === 1 || userDetails?.user_plan[0]?.renewal_plan === 0) && userDetails?.user_plan[0]?.subscription_id === subscription.id && !getDateDifference){
            await stripe.subscriptions.cancel(userDetails?.user_plan[0]?.subscription_id);
            await UserPlans.where({'user_id' : userDetails?.user_plan[0]?.user_id}).save({
                'is_active' : 0,
            },{patch: true })
            await User.where({'ID' : userDetails?.user_plan[0]?.user_id}).save({
                'subscription_status' : 0
            },{patch: true })
            io.emit("subscription-ended",{'userId': userDetails?.ID})
        }
        res.status(200).send({
            message: "Updated Successfully.",
            status: 1,
        });
    }catch(err){
        console.log("Error in updateUserDetailsHook",err)
        res.status(200).send({
            message: "Something went wrong.",
            status: 1,
        });
    }
}

/**
 * To  register and subscribe user for test  plan.
 * @params {Object} req - The request object => ({id}).
 * @params {Object} res - The response object.
*/
exports.registerWithTestPlan = async function(req,res){
    try{
        let userDetails = req.body
        const response = await registerUser(userDetails)
        if(response && response.status === false){
            res.status(200).send({
                status: 0,
                message : response.message
            });
        }else{
            let plan_detail = await NewPlans.where({ 'plan_name': userDetails.plan_name }).fetch();
            plan_detail = plan_detail.toJSON()
            await User.where({ 'ID': response.user.ID }).save({
                'type': plan_detail.code,
                'span': 'T',
                'trail_start_date': new Date(),	
                'trail_status': "start"
            }, { patch: true });
            res.status(200).send({
                message: "Registered and Subscribed Successfully.",
                status: 1,
                subscription_status : 0
            });
        }
    }catch(err){
        console.log("Error in registerWithTestPlan",err)
    }
}

/**
 * To  register and subscribe user for paid  plan.
 * @params {Object} req - The request object => ({id}).
 * @params {Object} res - The response object.
*/
exports.registerWithPaidPlan = async function(req,res){
    try{
        let userDetails = req.body
        console.log("userDetails",userDetails)

        const stripeToken = req.body?.token?.id
        const card_src = req.body.token.card.id
        const renewal_plan = userDetails?.renewal === true ? 1 : 0
        let response = {}
        if(userDetails?.userId){
            let user = await User.where({'ID':userDetails.userId}).fetch()
            user = user.toJSON()
            response={
                status : true,
                user:  user
            }
        }else{
            response = await registerUser(userDetails)
        }
        if(response && response.status === false){
            res.status(200).send({
                status: 0,
                message : response.message
            });
        }else{
            let { plan_detail, per_minute_price_id, per_app_price_id, amount_paid, span } = await getPlanDetails(response, userDetails);
            const isDiscount = await checkDiscount(response.user) 
            const customer = await createAndUpdateCustomerStripe(response.user,isDiscount,stripeToken,card_src,amount_paid)
            if(customer.status){   
                let subObj = await generateSubscriptionObject(customer.customerId, per_app_price_id, per_minute_price_id, userDetails);
                console.log("subObj",subObj)
                const subscription = await stripe.subscriptions.create(subObj)

                if(subscription && subscription?.id){
                    let updateObj = await generateUpdateObject(plan_detail, span, userDetails);
                    console.log("updateObj",updateObj)
                    await User.where({ 'ID': response.user.ID }).save(updateObj, { patch: true });
                    let user_plan_obj = {
                        'user_id': response.user.ID,
                        'subscription_id': subscription.id,
                        'is_active': 1,
                        'plan_type':userDetails.plan_term,
                        'plan_id':plan_detail?.id,
                        'per_app_price_id': per_app_price_id,
                        'per_minute_price_id':per_minute_price_id,
                        'renewal_plan':renewal_plan
                    }
                    if(isDiscount.status){
                        user_plan_obj['coupon_id'] = isDiscount.coupon.coupon_code
                    }
                    await new UserPlans(user_plan_obj).save(null, { method: 'insert' });
                    await newRegistrationEmail(response.user?.email,plan_detail?.plan_name)
                    res.status(200).send({
                        message: userDetails?.userId ? "Subscribed Successfully" : "Registered and Subscribed Successfully.",
                        status: 1
                    });
                }else{
                    if(!customer?.isCustomerUpdated){
                        await User.where({ 'ID': response.ID }).destroy();
                    }
                }
            }else{
                if(!customer?.isCustomerUpdated){
                    await User.where({ 'ID': response.ID }).destroy();
                }
                res.status(200).send({
                    message: "Something went wrong.",
                    status: 0
                });
            }
        }
    }catch(err){
        console.log("Error in registerWithPaidPlan",err)
        res.status(200).send({
            message: "Something went wrong.",
            status: 0
        });
    }
}

/**
 * To send a recover password link to user.
 * @params {Object} req - The request object => ({id}).
 * @params {Object} res - The response object.
*/
exports.sendForgotPassLink = async function(req,res){
    try{
        const data = req.body
            let count = await User.where({'email':data.recovery_email}).count()
            if(count === 0){
                res.status(200).send({  
                    message: "Invalid email",
                    status: 1
                });
            }else{
                const randomString = await generateRandomString()
                let sendLink = await sendForgotPasswordEmail(data.recovery_email,randomString)
                if(sendLink?.status){
                    await User.where({'email':data.recovery_email}).save({
                        'forgot_password' : randomString
                    },{patch:true})
                    res.status(200).send({  
                        message: " Password recovery link has been sent to your email.",
                        status: 1
                    });
                }else{
                    res.status(200).send({  
                        message: "Something went wrong.",
                        status: 0
                    });
                }
            }
      
    }catch(err){
        console.log("Error in sendForgotPassLink",err)
        res.status(200).send({  
            message: "Something went wrong.",
            status: 0
        });
    }
}

/**
 * To update password.
 * @params {Object} req - The request object => ({id}).
 * @params {Object} res - The response object.
*/
exports.forgotPassword = async function(req,res){
    try{
        const {new_password , confirm_new_password, userId} = req.body
        let user = await User.where({'ID':userId}).fetch()
        user = user.toJSON()
        if(user?.forgot_password == 0){
            res.status(200).send({message: "Link is exipred.",status: false});
        }else{
            if (new_password.length < 6 ) {
                res.status(200).send({message:"Password should be of at least 6 digit!",status: false});
            }
            if (new_password != confirm_new_password) {
                res.status(200).send({message: "Password and confirm password don't matched.",status: false});
            }else{
                const hash = await hashPassword(new_password, 10);
                const randomString = await generateRandomString()
                await User.where({ 'ID': userId }).save({
                    'password': hash,
                    'plain_password':new_password,
                    'forgot_password' : randomString
                }, { patch: true });
                // await sendForgotPasswordEmail(userName)
                res.status(200).send({  
                    message: "Password Changed Successfully.",
                    status: 1
                });
            }
        }
    }catch(err){
        console.log("Error in forgotPassword",err)
        res.status(200).send({  
            message: "Something went wrong.",
            status: 0
        });
    }
}

/**
 * To update users accoutn details.
 * @params {Object} req - The request object => ({id}).
 * @params {Object} res - The response object.
*/
exports.updateAccountDetails = async function(req,res){
    try{
        const userDetails = req.body
        let user_data = await User.where({'ID':userDetails.ID}).fetch()
        user_data = user_data.toJSON()
        const existusername = await User.where({ 'username': userDetails.username }).count();
        const existEmail = await User.where({ email: userDetails.email }).count();
        if (existusername > 0 && user_data.username !== userDetails.username) {
            res.status(200).send({  
                message: 'Username is already registed.',status: 0
            });
        }else if(existEmail > 0 && user_data.email !== userDetails.email)  {
            res.status(200).send({  
                message: 'Email  is already registered.',status: 0
            });
        }else if (userDetails.username !== userDetails.confirm_username) {
            res.status(200).send({  
                message: "username and confirm username don't matched.",status: 0
            });
        }else if(userDetails.password.length < 6){
                res.status(200).send({
                    message:"Password should be of at least 6 digit!",status: 0
                });
        }else if (userDetails.password !== userDetails.confirm_password) {
            res.status(200).send({  
                message: "Password and confirm password don't matched.",status: 0
            });
        }else{
            const hash = await hashPassword(userDetails.password, 10);
            delete userDetails['confirm_password']
            delete userDetails['confirm_username']
            userDetails['plain_password'] = userDetails.password
            userDetails['password'] = hash
            await User.where({ 'ID': user_data.ID }).save(userDetails, { patch: true });
            res.status(200).send({  
                message: "Updated Successfully.",
                status: 1
            });
        }
    }catch(err){
        console.log("Error in updateAccountDetails",err)
        res.status(200).send({  
            message: "Something went wrong.",
            status: 0
        });
    }
}

/**
 * To  cancel users subscription .
 * @params {Object} req - The request object => ({id}).
 * @params {Object} res - The response object.
*/
exports.cancelSubscription = async function(req,res){
    try{
        const data = req.body
        // console.log("data",data)
        await UserPlans.where({ 'user_id': data.user_id, 'subscription_id': data.subscription_id }).save({
            'cancel_plan' : 1
        }, { patch: true });
        let userData = await getUserData(data.user_id)
    
        if(userData?.trail_status === 'start'){
            await stripe.subscriptions.cancel(data.subscription_id);
            await User.where({ 'ID': data.user_id }).save({
                'trail_status': "end",
                'trail_end_date': new Date(),
                'subscription_status' :0,
            }, { patch: true });
            await UserPlans.where({'user_id' : data.user_id }).save({
                'is_active' : 0,
            },{patch: true })
        }
        res.status(200).send({  
            message: "Subscription cancelled successfully.",
            status: 1
        });
    }catch(err){
        console.log("Error in updateAccountDetails",err)
        res.status(200).send({  
            message: "Something went wrong.",
            status: 0
        });
    }
}


