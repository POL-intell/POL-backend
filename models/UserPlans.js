let bookshelf = require('bookshelf');
let knex = require('knex');
let knexfile = require('../knexfile');
let db = knex(knexfile.development);
bookshelf = require('bookshelf')(db);
module.exports =  bookshelf.Model.extend({
  	tableName: 'user_plans', 
	discount:function(){
		return this.hasMany(Discount ,'user_id','ID');
	},
});

