var bookshelf = require('bookshelf');
var knex = require('knex');

var knexfile = require('../knexfile');
var db = knex(knexfile.development);
var bookshelf = require('bookshelf')(db);
var Payment = require('./Payment');
var Plan = require('./Plan');
var User = require('./User');
module.exports =  bookshelf.Model.extend({
  	tableName: 'user_files',
      user: function () { 
		return this.hasOne(User ,'ID','user_id');
	},
   
});

