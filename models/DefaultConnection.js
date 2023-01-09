var bookshelf = require('bookshelf');
var knex = require('knex');

var knexfile = require('../knexfile');
var db = knex(knexfile.development);
var bookshelf = require('bookshelf')(db);
var Payment = require('./Payment');
var Plan = require('./Plan');
var UserFile = require('./UserFile');
module.exports =  bookshelf.Model.extend({
  	tableName: 'default_connections',
     
});

