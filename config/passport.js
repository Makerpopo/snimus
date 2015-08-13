var LocalStrategy = require('passport-local').Strategy;
var bcrypt = require('bcrypt-nodejs');

// MongoDB tools
var co = require('co');
var MongoClient = require('mongodb').MongoClient;
var test = require('assert');
var dbconfig = require('../config/mongodb');

module.exports = function(passport) {

    // serialize the user for the session
    passport.serializeUser(function(user, done) {
        done(null, user._id);
    });

    // and to deserialize
    passport.deserializeUser(function(id, done) {
        var o_id = new require('mongodb').ObjectID(id);
        co(function* () {
            var db = yield MongoClient.connect(dbconfig.url);
            var col = db.collection('user');
            var user = yield col.findOne({ _id: o_id });
            db.close();
            done(null, user);
        }).catch(function(err) {
            console.error(err.stack);
        });
    });

    // local signup strats
    passport.use('local-signup', new LocalStrategy({
            usernameField: 'email',
            passwordField: 'password',
            passReqToCallback: true
        },
        function(req, email, password, done) {
            if (!(password === req.body.passwordCheck)) {
                return done(null, false, { message: 'Check the password' });
            }
            co(function* () {
                var db = yield MongoClient.connect(dbconfig.url);
                var col = db.collection('user');
                var user = yield col.findOne({ email: email });

                if (user) {
                    db.close();
                    return done(null, false, { message: 'Email already taken' });
                } else {
                    var newUser = {
                        index: (yield col.count({})) + 1,
                        email: email,
                        password: bcrypt.hashSync(password, bcrypt.genSaltSync(8), null),
                        name: req.body.name
                    }
                    var r = yield col.insertOne(newUser);
                    db.close();
                    test.equal(1, r.insertedCount);
                    return done(null, newUser);
                }

            }).catch(function(err) {
                console.error(err.stack);
            });
        })
    );

    // local login strats
    passport.use('local', new LocalStrategy({
            usernameField: 'email',
            passwordField: 'password',
            passReqToCallback: true
        },
        function(req, email, password, done) {
            co(function* () {
                var db = yield MongoClient.connect(dbconfig.url);
                var col = db.collection('user');
                var user = yield col.findOne({ email: email });
                db.close();

                if (!user) {
                    return done(null, false, { message: 'Incorrect username.' });
                }
                if (!bcrypt.compareSync(password, user.password)) {
                    return done(null, false, { message: 'Incorrect password.' });
                }
                return done(null, user);
            }).catch(function(err) {
                console.error(err.stack);
            });
        })
    );
};
