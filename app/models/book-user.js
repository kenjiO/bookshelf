'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var BookUser = new Schema({
	username: String,
	fullname: String,
	city: String,
	state: String,
	github: {
		id: String,
		displayName: String,
		username: String,
      publicRepos: Number
	},
});

module.exports = mongoose.model('BookUser', BookUser);
