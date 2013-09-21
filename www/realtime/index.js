var _ = require('underscore');
var express = require('express');
var request = require('require');
var handlebars = require('handlebars');
var hbs = require('hbs');

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