var express = require('express');
var router = express.Router();

// etc. tools
var marked = require('marked');
var cheerio = require('cheerio');

// MongoDB tools
var co = require('co');
var MongoClient = require('mongodb').MongoClient;
var test = require('assert');
var dbconfig = require('../config/mongodb');

// GET index page
router.get('/', function(req, res, next) {
    var locals = require('../config/globals')(req);

    co(function* () {
        var db = yield MongoClient.connect(dbconfig.url);
        var col = db.collection('entry');
        var r = yield col.find({}, {sort:{index:-1}, skip:0, limit:10}).toArray();
        test.ok(r);
        locals.articles = r;

        for (var i = 0; i < locals.articles.length; i++) {
            var $ = cheerio.load('<body>' + marked(locals.articles[i].article) + '</body>');
            $('table, iframe, ul, ol').remove();
            var text = $('body').text();
            if (text.length > 200) {
                text = text.substring(0, 200) + '...';
            }
            locals.articles[i].article = text;
            locals.articles[i].image = $('img').first().attr('src');
            locals.articles[i].dateISO = new Date(locals.articles[i].date);
            locals.articles[i].dateISO = locals.articles[i].dateISO.toISOString();

            var user = db.collection('user');
            var category = db.collection('category');
            var r = yield [
                user.findOne({index:locals.articles[i].author}),
                category.findOne({index:locals.articles[i].category})
            ];
            test.ok(r);
            locals.articles[i].author = {};
            locals.articles[i].author.index = r[0].index;
            locals.articles[i].author.name = r[0].name;
            locals.articles[i].category = r[1];
        }

        db.close();

        res.render('index', locals);
    }).catch(function(err) {
        console.error(err.stack);
        if (err.actual == null) {
            res.setHeader('Content-Type', 'text/plain');
            res.end('error');
        }
    });
});

// POST index page
// -- which should output in JSON format so you can AJAX it
router.post('/', function(req, res, next) {
    res.send('index');
});

module.exports = router;
