var bookshelf = require('bookshelf');
var knex = require('knex');

var knexfile = require('../knexfile');
var db = knex(knexfile.development);
var bookshelf = require('bookshelf')(db);
//var Paginator = require('bookshelf-paginator');
var Plan = require('./Plan');

module.exports =  bookshelf.Model.extend({
  	tableName: 'payments'  ,
 	plan_detail: function () { 
		return this.hasOne(Plan ,'id','plan_id');
	},
});

