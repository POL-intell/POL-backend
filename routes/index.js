var express = require('express');
var router = express.Router();
var mysql      = require('mysql2');
var DBController = require('../controllers/DBController');
var Interpretor = require('../controllers/Interpretor');
var AuthController = require('../controllers/AuthController');
var auth_middleware = require('../middleware/auth');
var AdminController = require('../controllers/AdminController');

//to check the database connection if its connected or not
router.all('/add/database', DBController.addDatabase);
//get the tables list of a particular table
router.all('/getTables', DBController.getTables);
//get the tables list of a particular table
router.all('/tables/:db_id', DBController.listTables);
//to get the data from a table
router.all('/getResults/:table' , DBController.getTableData);
//to get the meta data about a database table
router.all('/getMetaData/:table' , DBController.getMetaData);
//to get the result of sql statement - data link
router.all('/getSqlData' , DBController.getSqlData);
//to get the value of one particular set by row and col value
router.all('/getValue/:table/:col/:row', DBController.getColRowValue);

//router.all('/execuatePoll', DBController.execuatePoll);
//to exceute the pol function
router.all('/execuatePoll', Interpretor.execuatePoll);
//Commit the pol function executation
router.all('/commitPoll', Interpretor.commitPoll);
//Rollback the pol function
router.all('/rollbackPoll', DBController.rollbackPoll);
//Add pol column to table 
router.all('/addPolColumn/:table', DBController.addPolColumn);



//auth and payment
router.post('/register' , AuthController.register);
router.get('/plans' , AuthController.plans);
router.post('/login' , AuthController.login);

router.post('/subscribe', auth_middleware.auth,AuthController.subscribe);
router.post('/user_detail', auth_middleware.auth,AuthController.userDetail);
router.post('/save_file', auth_middleware.auth,AuthController.saveFile);
router.post('/update_file', auth_middleware.auth,AuthController.updateFile);
router.post('/get_user_files', auth_middleware.auth,AuthController.getuserFiles);
//folder
router.post('/save_folder', auth_middleware.auth,AuthController.saveFolder);
router.get('/main_folders', auth_middleware.auth,AuthController.mainFolders);
router.get('/sub_folders/:id', auth_middleware.auth,AuthController.subFolders);
router.get('/get_back_folders/:id', auth_middleware.auth,AuthController.backSubFolders);

//temp
router.post('/save_temp', auth_middleware.auth,AuthController.saveTemp);
router.get('/get_temp', auth_middleware.auth,AuthController.getTemp);

//default connection
router.post('/save_default_connection', auth_middleware.auth,AuthController.savedefaultConnection);

//open last 10 files
router.get('/last_open_files', auth_middleware.auth,AuthController.lastOpenFiles);

//admin
router.get('/users/list', auth_middleware.auth,AdminController.usersList);
router.post('/user/add', auth_middleware.auth,AdminController.userAdd);
router.post('/user/update', auth_middleware.auth,AdminController.userUpdate);
router.post('/user/delete', auth_middleware.auth,AdminController.userDelete);
router.post('/user/delete', auth_middleware.auth,AdminController.userDelete);
router.post('/console_user/add', auth_middleware.auth,AdminController.consoleUserAdd);

module.exports = router;
