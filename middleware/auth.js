var express = require('express');
var router = express.Router();
var knex = require('knex');

var knexfile = require('../knexfile');
var jwt = require('jsonwebtoken');

//this function chekc the jwt token and ecode and check its correct or not

exports.auth = function(req, res,next) {
    var url = req.protocol + '://' + req.get('host') + req.originalUrl; 
    
    if(req.headers && req.headers.authorization && req.headers.authorization.split(' ')[0]==='jwt'){
        jwt.verify(req.headers.authorization.split(' ')[1],'RESTFULAPIs',function(err,decode){
            if(err) {               
                res.status(401).json({ error: err });                        
            }else{
                req.user =  decode;
                next();
            }
        }); 
    }else{      
        return res.status(401).json({'message':'Unauthorized'});
    }
    
}
