// setup ===================================================

// load up the modules!
var express = require('express');
var app = express();
var port = process.env.PORT || 3000;

var path = require('path');
var swig = require('swig');
var i18n = require('i18n');
var favicon = require('serve-favicon');

var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var uagent = require('express-useragent');

var passport = require('passport');
var flash = require('connect-flash');

var routes = require('./routes/index');
var post = require('./routes/post');
var auth = require('./routes/auth');
var category = require('./routes/category');

// configs =================================================

require('./config/passport')(passport);

// i18n setup
i18n.configure({
    locales: ['en', 'ko'],
    directory: __dirname + '/locales'
});
app.use(i18n.init);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');
app.engine('html', swig.renderFile);

// express middlewares setup
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(uagent.express());

// passport requirements
app.use(session({
    resave: false,
    saveUninitialized: false,
    secret: 'deaddo5e'
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// routes ==================================================

app.use('/', routes);
app.use('/', post);
app.use('/auth', auth);
app.use('/c', category);

// error handlers ==========================================

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// dev error handler
// will print stack
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// will not print stack
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    })
});

// launch ==================================================
app.listen(port);
console.log('listening on port %s...', port)
