var bookshelf = require('bookshelf');
var knex = require('knex');

var knexfile = require('../knexfile');
var db = knex(knexfile.development);
var bookshelf = require('bookshelf')(db);
var Payment = require('./Payment');
var Plan = require('./Plan');
var DefaultConnection = require('./DefaultConnection');
module.exports =  bookshelf.Model.extend({
  	tableName: 'users',
      payment_detail: function () { 
		return this.hasOne(Payment ,'user_id','ID');
	},
 	plan_detail: function () { 
		return this.hasOne(Plan ,'code','type');
	},
	default_connection:function(){
		return this.hasMany(DefaultConnection ,'user_id','ID');
	},
   
});

