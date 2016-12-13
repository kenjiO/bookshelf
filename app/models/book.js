'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Book = new Schema({
    owner: String,
    title: String,
    authors: [String],
    volumeId: String,
    thumbnail: String
});


module.exports = mongoose.model('Book', Book);
