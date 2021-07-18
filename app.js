var express = require('express');

var cookieParser = require('cookie-parser');
var logger = require('morgan');
var createError = require('http-errors');
var path = require('path');

var app = express();
const expressWS = require('express-ws')(app) 
const aWss = module.exports = expressWS.getWss('/chat');

var indexRouter = require('./routes/index');
var chatRouter = require('./routes/chat');
var usersRouter = require('./routes/users');

// // view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/chat', chatRouter);

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
  res.status(err.status || 500);
  res.render('error');
});

const port = process.env.PORT || "8000";
app.listen(port, () => {
  console.log(`Listening to requests on http://localhost:${port}`);
});
module.exports = app;
