var request = require('request');
var crypto = require('crypto');
var bcrypt = require('bcrypt-nodejs');
var util = require('../lib/utility');
var mongoose = require('mongoose');
var db = require('../app/config');
var User = db.User;
var Link = db.Link;
// var User = require('../app/models/user');
// var Link = require('../app/models/link');
// var Users = require('../app/collections/users');
// var Links = require('../app/collections/links');

exports.renderIndex = function(req, res) {
  res.render('index');
};

exports.signupUserForm = function(req, res) {
  res.render('signup');
};

exports.loginUserForm = function(req, res) {
  res.render('login');
};

exports.logoutUser = function(req, res) {
  req.session.destroy(function() {
    res.redirect('/login');
  });
};

exports.fetchLinks = function(req, res) {
  Links.reset().fetch().then(function(links) { // links is undefined.
    res.status(200).send(links.models); // .fetch is old method.
  }); // TODO;

};

exports.saveLink = function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.sendStatus(404);
  }

  Link.findOne({ url: uri }, 'url code baseUrl title', function(err, url) {
    if (url) {
      res.status(200).send(url);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.sendStatus(404);
        } 
        var newLink = Link({
          url: uri,
          title: title,
          baseUrl: req.headers.origin
        });
        console.log('saving------------');
        newLink.save();
        res.status(200).send(newLink);
        console.log('still working! ------------');
        // res.status(200).send(newLink);
      });
    }
  });
};

exports.loginUser = function(req, res) {
  var username = req.body.username;
  var password = req.body.password;
  console.log('attempting LOGIN ----------');

  User.findOne({username: username}, 'username password', function(err, user) {
    if (err) {
      console.log(err, 'ERROR! in LOGIN');
    }
    if (!user) {
      console.log('could not find user');
      res.redirect('/login');
    } else {
      console.log(user, 'found user -- going to compare password');
      User.comparePassword(user, password, function(match) {
        console.log('comparing passwords');
        if (match) {
          util.createSession(req, res, user);
        } else {
          res.redirect('/login');
        }
      });
    }
  });
};

exports.signupUser = function(req, res) {
  var username = req.body.username;
  var password = req.body.password;

  User.findOne({username: username}, 'username password', function(err, user) {
    if (!user) {
      console.log('creating user----------');
      var newUser = User({
        username: username,
        password: password
      });
      newUser.save();
      util.createSession(req, res, newUser);
    } else {
      console.log('Account already exists');
      res.redirect('/signup');
    }
  });
};

exports.navToLink = function(req, res) {
  console.log('called navToLink-------------', req.params['0']);
  Link.findOne({ code: req.params['0'] }, 'url code baseUrl title', function(err, link) {
    if (!link) {
      res.redirect('/');
    } else {
      link.visits = link.visits + 1;
      link.save();
      return res.redirect(link.url);
    }
  });
};