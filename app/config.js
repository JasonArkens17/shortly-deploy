var path = require('path');
var Promise = require('bluebird');
var bcrypt = require('bcrypt-nodejs');
var crypto = require('crypto');
// var knex = require('knex')({
//   client: 'sqlite3',
//   connection: {
//     filename: path.join(__dirname, '../db/shortly.sqlite')
//   },
//   useNullAsDefault: true
// });
// var db = require('bookshelf')(knex);

// db.knex.schema.hasTable('urls').then(function(exists) {
//   if (!exists) {
//     db.knex.schema.createTable('urls', function (link) {
//       link.increments('id').primary();
//       link.string('url', 255);
//       link.string('baseUrl', 255);
//       link.string('code', 100);
//       link.string('title', 255);
//       link.integer('visits');
//       link.timestamps();
//     }).then(function (table) {
//       console.log('Created Table', table);
//     });
//   }
// });

// db.knex.schema.hasTable('users').then(function(exists) {
//   if (!exists) {
//     db.knex.schema.createTable('users', function (user) {
//       user.increments('id').primary();
//       user.string('username', 100).unique();
//       user.string('password', 100);
//       user.timestamps();
//     }).then(function (table) {
//       console.log('Created Table', table);
//     });
//   }
// });

var mongoose = require('mongoose');
var db = mongoose.connect('mongodb://localhost:27017/test').connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log('-----------we\'re connected!-----------');
});

var Schema = mongoose.Schema;

var users = new Schema({
  username: {type: String, required: true, index: {unique: true}},
  password: {type: String, required: true}
});
users.pre('save', function(next) {
  var cipher = Promise.promisify(bcrypt.hash);
  return cipher(this.password, null, null).bind(this)
    .then(function(hash) {
      this.password = hash;
      next();
    });
});

var User = mongoose.model('User', users);
// users.methods = {};

User.comparePassword = function(user, attemptedPassword, callback) {
  console.log('comparePassword called-----------------');
  bcrypt.compare(attemptedPassword, user.password, function(err, isMatch) {
    callback(isMatch);
  });
  
};
  
var urls = new Schema({
  //id: [Schema.Types.ObjectId], // ??
  url: String,
  baseURL: String,
  code: String,
  title: String,
  visits: Number,
  timestamps: Date
});
urls.pre('save', function(next) { 
  var shasum = crypto.createHash('sha1');
  shasum.update(this.url);
  this.code = shasum.digest('hex').slice(0, 5);
  next();
});

var Link = mongoose.model('Link', urls);  

module.exports = {
  db: db,
  User: User,
  Link: Link
}; 