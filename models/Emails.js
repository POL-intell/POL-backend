var bookshelf = require('bookshelf');
var knex = require('knex');

var knexfile = require('../knexfile');
var db = knex(knexfile.development);
var bookshelf = require('bookshelf')(db);
//var Paginator = require('bookshelf-paginator');

module.exports =  bookshelf.Model.extend({
  	tableName: 'emails'  
});

