var bookshelf = require('bookshelf');
var knex = require('knex');

var knexfile = require('../knexfile');
var db = knex(knexfile.development);
var bookshelf = require('bookshelf')(db);
var Payment = require('./Payment');
var Plan = require('./Plan');
var DefaultConnection = require('./DefaultConnection');
const UserPlans = require('./UserPlans');
const Discount = require('./Discount');
const NewPlans = require('./NewPlans');
module.exports =  bookshelf.Model.extend({
  	tableName: 'users',
	payment_detail: function () { 
		return this.hasOne(Payment ,'user_id','ID');
	},
 	// plan_detail: function () { 
	// 	return this.hasOne(Plan ,'code','type');
	// },
	plan_detail: function () { 
		return this.hasOne(NewPlans ,'code','type');
	},
	user_plan : function (){
		return this.hasMany(UserPlans ,'user_id','ID');
	},
	default_connection:function(){
		return this.hasMany(DefaultConnection ,'user_id','ID');
	},
	discount:function(){
		return this.hasMany(Discount ,'user_id','ID');
	},
},{
	defaults: {
	  subscription_status: 0 // Set the default value for the subscription_status column
	},
	// Enable cascading deletes
	cascadeDelete: true,

});

