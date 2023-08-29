var bookshelf = require('bookshelf');
var knex = require('knex');

var knexfile = require('../knexfile');
const PlansPricing = require('./Plans_Pricing');
var db = knex(knexfile.development);
var bookshelf = require('bookshelf')(db);
//var Paginator = require('bookshelf-paginator');

module.exports =  bookshelf.Model.extend({
  	tableName: 'new_plans' ,
    plans_pricing: function () { 
		return this.hasMany(PlansPricing ,'plan_id','id');
	},
});

