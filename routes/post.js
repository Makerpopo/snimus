var express = require('express');
var router = express.Router();

// etc. tools
var marked = require('marked');

// MongoDB tools
var co = require('co');
var MongoClient = require('mongodb').MongoClient;
var test = require('assert');
var dbconfig = require('../config/mongodb');

// form tools
var forms = require('forms');
var crypto = require('crypto');
var csrf = require('csurf');
var csrfProtection = csrf({ cookie: true });

// state form parts
var fields = forms.fields;
var validators = forms.validators;
var widgets = forms.widgets;

// so you can check if the request is authenticated
var isLoggedIn = function(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect('/auth/login');
}

var formIterate = function(name, object) {
    if (!Array.isArray(object.widget.classes)) {
        object.widget.classes = [];
    }
    var error = object.error ? '<div class="sn-form-field-err">' + object.error + '</div>' : '';
    var widget = '<div class="sn-form-field sn-' + name + '">' +
        object.widget.toHTML(name, object) + '</div>';
    return widget + error;
}

// write form
var writeform = forms.create({
    title: fields.string({
        required: true,
        widget: widgets.text({
            placeholder: 'title goes here', // res.__('Thine title goeth hereth')
            classes: ['sn-title']
        })
    }),
    category: fields.string({
        choices: {},
        required: true,
        widget: widgets.select({ classes: ['sn-select'] })
    }),
    article: fields.string({
        required: true,
        widget: widgets.textarea({
            placeholder: 'text goes here', // res.__('Write down thine words!'),
            rows: 60
        })
    })
});

// GET individual post
router.get(/^\/([0-9]+)\/?$/, function(req, res, next) {
    co(function* () {
        var db = yield MongoClient.connect(dbconfig.url);
        var col = db.collection('entry');
        var r = yield col.findOne({
            index: req.params[0] * 1
        });
        test.ok(r);
        var post = r;
        var col = db.collection('category');
        var r = yield col.findOne({
            index: post.category * 1
        });
        test.ok(r);
        var category = r;
        db.close();

        post.article = marked(post.article);
        var date = new Date(post.date);

        var locals = require('../config/globals')(req);
        locals.post = post;
        locals.post.categoryName = category.name;
        locals.date = date;
        res.render('post', locals);
    }).catch(function(err) {
        console.error(err.stack);
        if (err.actual == null) {
            res.setHeader('Content-Type', 'text/plain');
            res.end('post does not exist');
        }
    });
});

// GET individual post editing
router.get(/^\/([0-9]+)\/edit\/?$/, isLoggedIn, csrfProtection, function(req, res, next) {
    co(function* () {
        var db = yield MongoClient.connect(dbconfig.url);
        var col = db.collection('entry');
        var r = yield col.findOne({
            index: req.params[0] * 1
        });
        test.ok(r);
        db.close();

        var locals = require('../config/globals')(req);
        locals.csrfToken = req.csrfToken();
        locals.form = writeform.bind(r).toHTML(formIterate);
        res.render('write', locals);
    }).catch(function(err) {
        console.error(err.stack);
        if (err.actual == null) {
            res.setHeader('Content-Type', 'text/plain');
            res.end('post does not exist');
        }
    });
});

// POST individual post editing
router.post(/^\/([0-9]+)\/edit\/?$/, isLoggedIn, csrfProtection, function(req, res) {
    writeform.handle(req, {
        success: function(form) {
            co(function* () {
                var db = yield MongoClient.connect(dbconfig.url);
                var col = db.collection('entry');

                var r = yield col.updateOne({ index: req.params[0] * 1 }, {
                    $set: { title: form.data.title },
                    $set: { article: form.data.article}
                })
                db.close();

                test.equal(1, r.matchedCount);
                res.redirect('/' + req.params[0]);
            }).catch(function(err) {
                console.error(err.stack);
                switch (err.code) {
                    case 11000:
                        res.setHeader('Content-Type', 'text/plain');
                        res.end('duplicate entry');
                        break;

                    default:
                        res.setHeader('Content-Type', 'text/plain');
                        res.end('some kind of error');
                }
            });
        },
        other: function(form) {
            var locals = require('../config/globals')(req);
            locals._id = crypto.randomBytes(20).toString('hex');
            locals.csrfToken = req.csrfToken();
            locals.form = form.toHTML(formIterate);
            res.render('write', locals);
        }
    })
});

// GET write form
router.get('/write', isLoggedIn, csrfProtection, function(req, res, next) {
    co(function* () {
        var db = yield MongoClient.connect(dbconfig.url);
        var col = db.collection('category');
        var r = yield col.find({}).toArray();

        writeform.fields.category.choices = {};

        for (i = 0; i < r.length; i++) {
            writeform.fields.category.choices[r[i].index] = r[i].name;
        }

        writeform.fields.category.choices.add = res.__('More...');

        var locals = require('../config/globals')(req);
        locals._id = crypto.randomBytes(20).toString('hex');
        locals.csrfToken = req.csrfToken();
        locals.form = writeform.toHTML(formIterate);
        res.render('write', locals);
    }).catch(function(err) {
        console.error(err.stack);
        switch (err.code) {
            default:
                res.setHeader('Content-Type', 'text/plain');
                res.end('some kind of error');
        }
    });
});

// POST the post that came through
router.post('/write', isLoggedIn, csrfProtection, function(req, res) {
    writeform.handle(req, {
        success: function(form) {
            co(function* () {
                var db = yield MongoClient.connect(dbconfig.url);
                var col = db.collection('entry');

                var entry = form.data;
                delete entry._csrf;
                entry.index = (yield col.findOne({}, {sort: {_id: -1}})).index + 1;
                entry.date = Date.now();

                var r = yield col.insertOne(entry);
                db.close();

                test.equal(1, r.insertedCount);
                res.redirect(r.ops[0].index);
            }).catch(function(err) {
                console.error(err.stack);
                switch (err.code) {
                    case 11000:
                        res.setHeader('Content-Type', 'text/plain');
                        res.end('duplicate entry');
                        break;

                    default:
                        res.setHeader('Content-Type', 'text/plain');
                        res.end('some kind of error');
                }
            });
        },
        other: function(form) {
            res.render('write', {
                user: req.user,
                _id: crypto.randomBytes(20).toString('hex'),
                csrfToken: req.csrfToken(),
                form: form.toHTML(formIterate)
            });
        }
    })
});

module.exports = router;
