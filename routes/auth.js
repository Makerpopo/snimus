var express = require('express');
var router = express.Router();

// form tools
var forms = require('forms');
var crypto = require('crypto');
var csrf = require('csurf');
var csrfProtection = csrf({ cookie: true });

// auth tools
var passport = require('passport');

// state form parts
var fields = forms.fields;
var validators = forms.validators;
var widgets = forms.widgets;

// GET signup form
router.get('/signup', csrfProtection, function(req, res, next) {
    var signupform = forms.create({
        name: fields.string({
            required: true,
            widget: widgets.text({
                placeholder: res.__('Name')
            })
        }),
        email: fields.string({
            required: true,
            widget: widgets.email({
                placeholder: res.__('E-Mail')
            })
        }),
        password: fields.password({
            required: true,
            widget: widgets.password({
                placeholder: res.__('Password'),
            })
        }),
        passwordCheck: fields.password({
            required: true,
            widget: widgets.password({
                placeholder: res.__('Password Check'),
            })
        })
    });


    var locals = require('../config/globals')(req);
    locals._id = crypto.randomBytes(20).toString('hex');
    locals.csrfToken = req.csrfToken();
    locals.form = signupform;
    locals.mode = 'signup';
    locals.submitText = res.__('Sign up');
    res.render('auth', locals);
});

// POST after signup
router.post('/signup', passport.authenticate('local-signup', {
    successRedirect: '/write',
    failureRedirect: '/auth/signup'
}));

// GET login form
router.get('/login', csrfProtection, function(req, res, next) {
    var loginform = forms.create({
        email: fields.string({
            required: true,
            widget: widgets.text({
                placeholder: res.__('E-Mail')
            })
        }),
        password: fields.password({
            required: true,
            widget: widgets.password({
                placeholder: res.__('Password'),
            })
        })
    });

    var locals = require('../config/globals')(req);
    locals.csrfToken = req.csrfToken();
    locals.form = loginform;
    locals.mode = 'login';
    locals.submitText = res.__('Log in');
    res.render('auth', locals);
});

// POST after login
router.post('/login', passport.authenticate('local', {
    successRedirect: '/write',
    failureRedirect: '/auth/login'
}));

router.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
});

module.exports = router;
