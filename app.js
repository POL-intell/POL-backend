var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const cors = require('cors')
require('dotenv').config()
const indexRouter = require('./routes/index');
const {updatePerMinuteQuantityScheduler,trackTrialPlanScheduler} = require('./cronjobs/schedule.js') ;


const app = express();


// app.use(cors());
// const corsOptions = {
//   origin: 'https://43b8-49-156-101-39.ngrok-free.app/',
//   methods: ['GET', 'POST', 'PUT', 'DELETE'],
// };
const corsOptions = {
  origin: 'https:/localhost:4200/',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
};
app.use(cors());
app.options('*', cors(corsOptions));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'twig');
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/', indexRouter);

updatePerMinuteQuantityScheduler.start()
trackTrialPlanScheduler.start()

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  //res.status(err.status || 500);
  //res.render('error');
  res.status(err.status || 500).send({
            message: err,
            status:0         
      });
});

module.exports = app;
