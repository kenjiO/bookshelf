'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Trade = new Schema({
        requestor: String,
        requestee: String,
        desiredBook: {type: Schema.Types.ObjectId, ref: 'Book' },
        offeredBook: {type: Schema.Types.ObjectId, ref: 'Book' },
    status: {type: String, enum: ['PROPOSED', 'COMPLETE', 'REJECTED', 'OVERRIDED']}
});


module.exports = mongoose.model('Trade', Trade);
