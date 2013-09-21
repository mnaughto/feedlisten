var _ = require('underscore');
var express = require('express');
var request = require('request');
var handlebars = require('handlebars');
var hbs = require('hbs');
var sendgrid = require('sendgrid');

var app = express();

app.configure('development', function() {
	app.use(express.bodyParser());
	app.use(express.errorHandler());
	app.locals.pretty = true;

	app.set("view engine", 'hbs');
	app.set("view options", { layout: false });

	app.engine('tmpl', require('hbs').__express);

	app.use(express.static(__dirname + '/public'));
});

app.get('/', function(req, res){
	if(req.query.token){
		//show page with selection of groups
		//maybe should be client-side js for loading the groups?
	} else {
		//send them a facebook auth screen - this could be done on the client side, too
	}
	res.send('Hello');
});

app.get('/:groupid', function(req, res){

});

app.get('/:groupid/:postid', function(req, res){

});

app.listen(80);