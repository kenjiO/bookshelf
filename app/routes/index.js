'use strict';

var path = process.cwd();
var books = require('google-books-search');
var User = require('../models/book-user')
var Book = require('../models/book.js');
var Trade = require('../models/trade.js');

module.exports = function (app, passport) {

	function requireLoggedIn (req, res, next) {
		if (req.isAuthenticated()) {
			return next();
		} else {
			res.redirect('/login');
		}
	}
	
	function getLoggedInUser (req) {
		if (req.isAuthenticated()) {
			return req.user.username;
		} else {
			return undefined;
		}
	}
	
	app.route('/login')
		.get(function (req, res) {
			res.sendFile(path + '/public/login.html');
		});

	app.route('/logout')
		.get(function (req, res) {
			req.logout();
			res.redirect('/');
		});

	app.route('/profile')
		.get(requireLoggedIn, function (req, res) {
			res.render('profile', {user: req.user});
		})
		.post(requireLoggedIn, function(req, res, next){
			var name = req.body.name.trim();
			var city = req.body.city.trim();
			var state = req.body.state.trim();
			if (!name || !city || !state)
				return res.end("Name, City and State must be filled in");
			User.findOneAndUpdate({'username': { $regex : new RegExp(req.user.username, "i") }}, 
				{'fullname': name, 'city': city, 'state': state}, function(err, poll){
    				if (err) return next(err);
    				req.user.name = name;
    				req.user.city = city;
    				req.user.state = state;
    				res.render('profile', {user: req.user});
			});
		})
	; // end app.route('/profile')


	app.route('/auth/github')
		.get(passport.authenticate('github'));

	app.route('/auth/github/callback')
		.get(passport.authenticate('github', {
			successRedirect: '/',
			failureRedirect: '/login'
		}))
	;
	
	app.route('/')
		.get(function (req, res, next) {
			Book.find({}, 'title volumeId authors thumbnail owner _id id', function(err, books){
				if (err) return next(err);
				res.render('index', {books: books, user: req.user});
			});
		});
		
	app.route('/search')
		.get(function(req, res, next) {
	  		var title = req.query.title.trim();
	  		if (!title) return res.end('Title not provided');
			books.search(title, function(error, results) {
    			if (!error) {
        			res.render('search-results', {user: req.user, results: results});
        			// id, authors[], title, thumbnail
				} else {
        			next(error);
    			}
			});
		})
	; // end app.route('/search')
	
	app.route('/add')
		.get(function(req, res, next){
			res.render('add-book',{user: req.user});
		})
	;
	
	app.route('/trades')
		.get(function(req, res, next){
			var user = getLoggedInUser(req);
			if (!user) return res.end('You must be logged in');
			//Trade.find({ $or: [{requestor: user}, {requestee: user}]})
			Trade.find({requestee: user, status: 'PROPOSED'})
				.populate('desiredBook')
				.populate('offeredBook')
				.exec(function(err, trades) {
				if (err) return res.json(err);
				var myTrades = [];
				var tradeRequests = [];
				trades.forEach(function(trade) {
					(trade.requestor === user) ? myTrades.push(trade) : tradeRequests.push(trade); 
				});
				res.render('trades', {myTrades: myTrades, tradeRequests: tradeRequests, user: user});
			});
		})
	;
		
	app.route('/trade')
		.post(function(req, res, next){
			var user = getLoggedInUser(req);
			if (!user) return res.end('You must be logged in');
			var status;
			if (req.body.tradeAction === 'Yes') {
				status = 'COMPLETE';
			} else if (req.body.tradeAction === 'No') {
				status = 'REJECTED';
			} else {
				return res.end('Invalid Action on Form: ' + req.body.tradeAction);
			}
			Trade.findOneAndUpdate(
				{_id:req.body.tradeId, requestee: user},
				{status: status},
				{new: true}, 
				function(err, trade){
					if (err) return next(err);
					if (status === 'REJECTED') return res.redirect('/trades');
	
					Book.findOneAndUpdate({_id: trade.desiredBook},
						{owner: trade.requestee}, {new: true}, function(err, book){
							if (err) console.log(err);
						}
					);
					
					Book.findOneAndUpdate({_id: trade.offeredBook},
						{owner: trade.requestor}, {new: true}, function(err, book){
							if (err) console.log(err);
						}
					);
					res.redirect('/trades');
				} // end callback after Trade.findOneAndUpdate
			); //end Trade.findOneAndUpdate
		})
	;
		
	app.route('/trade/:id')
		.get(function(req, res, next){
			Book.find({owner: req.user.username}, function(err, books) {
				if (err) return res.json(err);
				res.render('trade', {myBooks: books, desiredBookId: req.params.id, user: req.user});
			});
		})
	;
	
	app.route('/trade/:desiredBookId/:myBookId')
		.get(function(req, res, next){
			var user = getLoggedInUser(req);
			if (!user) 
				return res.end('You must be logged in');
			else
				user = user.toLowerCase();
			var mine = req.params.myBookId;
			var yours = req.params.desiredBookId;
			var ObjectId = require('mongoose').Types.ObjectId;
			Book.find({ '_id' : { $in: [ObjectId(mine), ObjectId(yours)]}}, function(err, books) {
				if (err) return res.json(err);
				var book0Owner = books[0].owner.toLowerCase();
				var book1Owner = books[1].owner.toLowerCase();
				if (book0Owner === user && book1Owner !== user) {
					var myBook = books[0];
					var yourBook = books[1];
				} else if (book0Owner !== user && book1Owner === user) {
					myBook = books[1];
					yourBook = books[0];
				} else if (book0Owner === user && book1Owner === user) {
					res.end("You can't trade a book to yourself");
				} else {
					res.end("You do not own the book you are trying to trade");
				}
				var newTrade = new Trade({
					requestor: myBook.owner,
					requestee: yourBook.owner,
    				desiredBook: myBook._id,
    				offeredBook: yourBook._id,
    				status: 'PROPOSED'});
				newTrade.save(function(err, trade){
					if (err) return req.json(err);
					res.redirect('/');
				});
			});
		})
	;
	
	
};
