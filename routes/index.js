var express = require('express');
var router = express.Router();
var mysql      = require('mysql2');
var DBController = require('../controllers/DBController');
var Interpretor = require('../controllers/Interpretor');
var AuthController = require('../controllers/AuthController');
var auth_middleware = require('../middleware/auth');
var AdminController = require('../controllers/AdminController');

router.all('/add/database', DBController.addDatabase);
router.all('/getTables', DBController.getTables);


router.all('/tables/:db_id', DBController.listTables);
router.all('/getResults/:table' , DBController.getTableData);
router.all('/getMetaData/:table' , DBController.getMetaData);
router.all('/getSqlData' , DBController.getSqlData);

router.all('/getValue/:table/:col/:row', DBController.getColRowValue);

//router.all('/execuatePoll', DBController.execuatePoll);
router.all('/execuatePoll', Interpretor.execuatePoll);

router.all('/commitPoll', Interpretor.commitPoll);
router.all('/rollbackPoll', DBController.rollbackPoll);
router.all('/addPolColumn/:table', DBController.addPolColumn);



router.get('/interpretor' , DBController.interpretor);
router.get('/skeleton' , DBController.skeleton);

router.get('/insert' , DBController.insert);

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
