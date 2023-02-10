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
var DefaultConnection = require('../models/DefaultConnection');
/* GET home page. */
const stripe = require('stripe')('sk_test_51ImKQbAMjNDVHKZlXycRU5zEeZlyZW7HHL25yLBenlFeKrkiuiM3Xgje8XAYnKpbaa7i2gLSU0p6XgX5gIQlCADD00F60in1Rw');
const bcrypt = require('bcrypt');
var jwt = require('jsonwebtoken');

const saltRounds = 10;


//get all the plans list and their details
exports.plans = async function (req, res) {
    var plans = await Plan.where({}).fetchAll();
    res.status(200).send({
        message: "Plan list",
        status: 1,
        data: plans.toJSON()
    });
}


//login to pol bu username and password
exports.login = async function (req, res) {
    var data = req.body
    var exist = await User.where({ 'username': data.username }).count();
    if (exist == 0) {
        res.status(200).send({
            message: "Wrong credentials.",
            status: 0
        });
    }
    var user = await User.where({ 'username': data.username }).fetch();
    user = user.toJSON();
    bcrypt.compare(data.password, user.password, async function (err, result) {
        if (result) {
            var jwtToken = jwt.sign({ email: user.email, ID: user.ID }, 'RESTFULAPIs', { expiresIn: '60d' });
            var user_detail = await getUserData(user.ID);
            res.status(200).send({
                message: "Login Successfull.",
                status: 1,
                token: jwtToken,
		        user_type:user.user_type,
                subscription: user.span,
                subscription_status: 1,
                user_detail:user_detail
            });
        } else {
            res.status(200).send({
                message: "Wrong credentials.",
                status: 0
            });
        }
    });

}


//Susbcribe to one plan to user
exports.subscribe = async function (req, res) {

    var data = req.body

    var user = await User.where({ 'ID': req.user.ID }).fetch();
    user = user.toJSON();

    if (data.subscription_type == 'trail') {
        //update user table
        await User.where({ 'ID': req.user.ID }).save({
            'type': '',
            'span': 'T'
        }, { patch: true });

        res.status(200).send({
            message: "Subscribed Successfully ",
            status: 1
        });
        return
    }

    var plan_detail = await Plan.where({ 'id': data.plan_id }).fetch();
    plan_detail = plan_detail.toJSON();
    var price = 0;
    var interval = 'year';
    if (data.term == 'monthly') {
        price = plan_detail.monthly_per_app
        interval = 'month'
    } else {
        price = plan_detail.yearly_per_app
    }
    //create customer
    const customer = await stripe.customers.create({
        source: req.body.token.id,
        description: 'By username : ' + user.username,
        name: data.first_name,
        email:data.email
    });

    const product = await stripe.products.create({
        name: plan_detail.plan_name + ' (' + interval + ')',
    });

    //create price
    const prices = await stripe.prices.create({
        unit_amount: price * 100,
        currency: 'usd',
        recurring: { interval: interval },
        product: product.id,
    });



    stripe.subscriptions.create({
        customer: customer.id,
        items: [
            { price: prices.id },
        ],

    }, async (err, charge) => {


        if (err) {
            res.status(200).send({
                message: err,
                status: 0
            });
        } else {

		var plan = Plan.where({id:data.plan_id}).fecth();
		plan = plan.toJSON();


            //update user table
            await User.where({ 'ID': req.user.ID }).save({
                'type': plan.code,
                'subscription_status': 1
            }, { patch: true });

            //save payment infor into  table
            await new Payment({
                'user_id': user.id,
                'transaction_id': charge.id,
                'amount': price,
                'currency': charge.currency,
                'paid_status': 0,
                'status': 0,
                'receipt_url': charge.items.url,
                'plan_id': data.plan_id,
                'plan_term': data.plan_term

            }).save(null, { method: 'insert' });

            res.status(200).send({
                message: "Payment Successfull",
                status: 1
            });
        }
    })

}


//registe ruser in pol 
exports.register = async function (req, res) {

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

    if (data.username != data.confirm_username) {
        res.status(200).send({
            message: "username and confirm username don't matched.",
            status: 0
        });
        return
    }


    if (data.password != data.confirm_password) {
        res.status(200).send({
            message: "Password and confirm password don't matched.",
            status: 0
        });
        return
    }

    bcrypt.hash(data.password, saltRounds, async function (err, hash) {
        var user = await new User({
            'username': data.username,
            'password': hash,
            'first_name': data.name,
            'email': data.email,
            'mobile': data.phone,
            'surname': data.family_name
        })
            .save(null, { method: 'insert' });

        res.status(200).send({
            message: "Register Successfull",
            status: 1
        });

    });
}

//get the user detail of logge din user
exports.userDetail = async function (req, res) {

    var data = req.body
    var user = await User.where({ 'ID': req.user.ID }).fetch({ withRelated: ['payment_detail','plan_detail'] });
    user = user.toJSON();
    console.log(user)
    res.status(200).send({
        message: "User Detail",
        status: 1,
        data: user
    });
}

//save the new file  according to user id in database
exports.saveFile = async function (req, res) {

    var data = req.body

    var exitfile = await UserFile.where({ 'name': data.name, 'user_id': req.user.ID }).count();

    if (exitfile == 0) {

        var user = await new UserFile({
            'name': data.name,
            'file': data.file,
            'user_id': req.user.ID,
            'folder_id':data.folder_id

        })
            .save(null, { method: 'insert' });

		var existTemp = await Temp.where({  'user_id': req.user.ID }).count();
		if(existTemp>0){
			await Temp.where({  'user_id': req.user.ID }).destroy();
		}


        res.status(200).send({
            message: "FIle saved Successfully ",
            status: 1,
            data: user
        });
        return
    } else {

        res.status(200).send({
            message: "File name already exist",
            status: 0,

        });

    }
}


//Update already exusting file
exports.updateFile = async function(req,res){

  
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

//to get  all the fiels created by user
exports.getuserFiles = async function(req,res){

  
  		var files = await UserFile.where({  'user_id': req.user.ID }).fetchAll();

        res.status(200).send({
            message: "Files list ",
            status: 1,
		data:files.toJSON()
           
        });
        return
    }
    
   
//To save folder according to parnet folder of a user
exports.saveFolder = async function(req,res){

    var data = req.body

  	var folder = await new Folder({
            'folder_name': data.folder_name,
            'parent_folder_id': data.parent_folder_id,
            'user_id': req.user.ID,

        })
            .save(null, { method: 'insert' });

        res.status(200).send({
            message: "Folder has been saved",
            status: 1
        });
        return
    }

// to get the list of main root folders (folders that have not parent folder)
exports.mainFolders = async function(req,res){

  
  	 var folders = await Folder.where({  'user_id': req.user.ID ,'parent_folder_id':0}).fetchAll();

        res.status(200).send({
            message: "Folder list ",
            status: 1,
		data:folders.toJSON()
           
        });
        return
}

//get the folders routes (path of folder)
async function getFolderRoute(folder_id){
	
    var is_folder = await Folder.where({  'id': folder_id }).count();
    console.log(is_folder)
    if(is_folder== 0){
        return [];
    }
	var arr=[];
	var folder = await Folder.where({  'id': folder_id }).fetch();
	folder = folder.toJSON()
	var parent_id = folder.parent_folder_id
	arr.push(folder.folder_name)
      console.log(arr);
	var is_next=true
	if(parent_id>0){
		while(is_next==true){
			var has = await Folder.where({  'id': parent_id }).count();
			console.log(has,'has')
			if(has>0){
				var folder = await Folder.where({  'id': parent_id }).fetch();
				folder = folder.toJSON()
				arr.push(folder.folder_name)
            		parent_id= folder.parent_folder_id
				if( parent_id == 0){
					is_next = false;
				}
			}else{
				is_next = false;
			}
		}
	}
    console.log(arr);
    return arr;
}


//Get the dub folders list by parent folder id
exports.subFolders = async function(req,res){

 
  	var folders = await Folder.where({  'user_id': req.user.ID ,'parent_folder_id':req.params.id}).fetchAll();
	folders = folders.toJSON()
	var list = folders;

      var files = await UserFile.where({  'user_id': req.user.ID ,'folder_id':req.params.id }).fetchAll();
      files = files.toJSON()

	for(var i=0;i<files.length;i++){
		var payload ={
			user_id:files[i].user_id,
			parent_folder_id:'',
			folder_id:files[i].folder_id,
			folder_name:'',
			file_name:files[i].name,
			file:files[i].file,
			created_at:files[i].created_at,
			updated_at:files[i].updated_at,
			id:files[i].id,
		}
		list.push(payload);
	}

      var route = await getFolderRoute(req.params.id);

        res.status(200).send({
            message: "Folder list ",
            status: 1,
		data:list,
		route:route
           
        });
        return
}


//get the back folders list from folder id
exports.backSubFolders = async function(req,res){
  var folder = await Folder.where({  'id':req.params.id}).fetch();
  folder = folder.toJSON()
  	 var folders = await Folder.where({  'user_id': req.user.ID ,'parent_folder_id':folder.parent_folder_id}).fetchAll();
	list = folders.toJSON()
    if(list.length>0)
    {
        parent_folder_id=list[0].parent_folder_id
    }else{
        parent_folder_id = 0;
    }
	var files = await UserFile.where({  'user_id': req.user.ID ,'folder_id':folder.parent_folder_id }).fetchAll();
  	files = files.toJSON()

	for(var i=0;i<files.length;i++){
		var payload ={
			user_id:files[i].user_id,
			parent_folder_id:'',
			folder_id:files[i].folder_id,
			folder_name:'',
			file_name:files[i].name,
			file:files[i].file,
			created_at:files[i].created_at,
			updated_at:files[i].updated_at,
                  id:files[i].id,
		}
		list.push(payload);
	}
var route = await getFolderRoute(folder.parent_folder_id);
        res.status(200).send({
            message: "Folder list ",
            status: 1,
		data:list,
		parent_folder_id:parent_folder_id,
		route:route
           
        });
        return
}


//Get the temporary file of a logge din user
exports.getTemp = async function(req,res){

  	var exist = await Temp.where({  'user_id': req.user.ID }).count();
      var data ='';
	if(exist>0){
  	  data = await Temp.where({  'user_id': req.user.ID }).fetch();
	  data = data.toJSON()
	}
        res.status(200).send({
            message: "Temp Data",
            status: 1,
		data:data
           
        });
        return
}


//Save temporary file to logged in user to database
exports.saveTemp = async function(req,res){

	var exist = await Temp.where({  'user_id': req.user.ID }).count();

      var data = req.body

	if(exist==0){

  		var folder = await new Temp({
            'content': data.content,
            
            'user_id': req.user.ID,

        	})
            .save(null, { method: 'insert' });
	}else{
 		await Temp.where({  'user_id': req.user.ID }).save({
           	'content': data.content
        	}, { patch: true });
	}

        res.status(200).send({
            message: "Temp data has been saved",
            status: 1
        });
        return
    }


//Open last open files of logged in user
exports.lastOpenFiles = async function(req,res){

	  var files = await UserFile.where({  'user_id': req.user.ID }).orderBy('updated_at','desc').fetchAll();
	  files = files.toJSON();

	  var arr=[];

	  for(var i=0;i<files.length;i++){
		var route = await getFolderRoute(files[i].folder_id);
		files[i]['route'] = route;
		arr.push(files[i])
	  }

        res.status(200).send({
            message: "Files list ",
            status: 1,
		data:arr
           
        });
        return

}

//Save default connection to logged in user
exports.savedefaultConnection = async function(req,res) {
	var exist = await DefaultConnection.where({  'user_id': req.user.ID }).count();

      var data = req.body
	console.log(data)

	if(exist>0){
        var user = await getUserData(req.user.ID);
        if(user.plan_detail.connection == 'single'){
		    await DefaultConnection.where({  'user_id': req.user.ID }).destroy();
        }
	}

  		var folder = await new DefaultConnection({
            'connection': data.connection,
            
            'user_id': req.user.ID,

        	})
            .save(null, { method: 'insert' });
	var cons = await DefaultConnection.where({  'user_id': req.user.ID }).fetchAll();
        res.status(200).send({
            message: "Default Connection has been saved",
            status: 1,
		connections:cons.toJSON()
        });
        return
}

//Get the user data bu user id
async function getUserData(id){
  
    var user = await User.where({ 'ID':id }).fetch({ withRelated: ['payment_detail','plan_detail','default_connection'] });
    user = user.toJSON();
    console.log('user',user)
    return user;
}