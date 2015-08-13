var express = require('express');
var router = express.Router();

// MongoDB tools
var co = require('co');
var MongoClient = require('mongodb').MongoClient;
var test = require('assert');
var dbconfig = require('../config/mongodb');

// GET index page
router.get('/', function(req, res, next) {
    var locals = require('../config/globals')(req);
    locals.title = 'Express';
    res.render('index', locals);
});

module.exports = router;
