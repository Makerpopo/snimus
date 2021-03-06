var express = require('express');
var router = express.Router();

// MongoDB tools
var co = require('co');
var MongoClient = require('mongodb').MongoClient;
var test = require('assert');
var dbconfig = require('../config/mongodb');

// so you can check if the request is authenticated
var isLoggedIn = function(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.status(401).end();
}

// POST the post that came through
router.post('/add', isLoggedIn, function(req, res) {
    co(function* () {
        var db = yield MongoClient.connect(dbconfig.url);
        var col = db.collection('category');
        var entry = {};
        entry.name = req.body.name;
        entry.index = ((yield col.findOne({}, {sort: {_id: -1}})) || { index: 0 }).index + 1;

        var r = yield col.insertOne(entry);
        db.close();

        test.equal(1, r.insertedCount);
        res.send(JSON.stringify(r.ops));
    }).catch(function(err) {
        console.error(err.stack);
        switch (err.code) {
            default:
                res.setHeader('Content-Type', 'text/plain');
                res.end('some kind of error');
        }
    });
});

module.exports = router;
