var books = require('google-books-search');
var Book = require('../models/book.js');


function getLoggedInUser (req) {
	if (req.isAuthenticated()) {
		return req.user.username;
	} else {
		return undefined;
	}
}

module.exports = function(app, passport) {


    app.route('/api/search')
        .get(function(req, res, next) {
            var title = req.query.title ? req.query.title.trim() : "";
            if (!title) return res.json({'error': 'Title not provided'});
            books.search(title, function(error, results) {
                error ?  res.json({'error': error})  : res.json(results);
            });
        })
    ; //end app.route('/api/search')
    
    app.route('/api/add')
        .get(function(req, res, next) {
            var bookId = req.query.bookId;
            if (!bookId) return res.json({'error': 'Book ID not provided'});
            books.lookup(bookId, function(error, results) {
                error ?  res.json({'error': error})  : addBook(req, res, next, results);
            });
        })
    ; //end app.route('/api/search')
};

function addBook(req, res, next, book) {
    var user = getLoggedInUser(req);
    if (!user) return res.json({error: 'Not logged in'});
    Book.create({
        owner: user,
        title: book.title,
        authors: book.authors,
        volumeId: book.id,
        thumbnail: book.thumbnail
    }, function(err,book){
        if (err) return res.json({error: err});
        res.json(book);
    });
}