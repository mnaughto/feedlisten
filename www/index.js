var _ = require('underscore');
var express = require('express');
var request = require('request');
var handlebars = require('handlebars');
var hbs = require('hbs');
var sendgrid = require('sendgrid');

var app = express();

hbs.registerHelper('foreach', function(context, options) {
    var ret = "";
    for(var prop in context)
    {
        ret = ret + options.fn({
			property:prop, value:context[prop]
        });
    }
    return ret;
});

app.configure('development', function() {
	app.use(express.bodyParser());
	app.use(express.errorHandler());
	app.locals.pretty = true;

	app.set("view engine", 'tmpl');
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
	res.send(__dirname + '/public/index.html');
});

app.get('/selection', function(req, res){
	if(req.query.token && req.query.fbid){
		request({json: true, url:'https://graph.facebook.com/me', qs:{'access_token':req.query.token}}, function(error, response, body){
			if(!error && response.statusCode == 200){
				var user_info = body;
				request({json: true, url:'https://graph.facebook.com/me/accounts', qs:{'access_token':req.query.token}}, function(error, response, body){
					if(!error && response.statusCode == 200){
						var data = {
							name: user_info.first_name,
							accessToken: req.query.token,
							pages: body.data
						};
						//res.send(data);
						//res.send('this is a thing.');

						res.render('pages', {
							name: user_info.first_name,
							accessToken: req.query.token,
							pages: body.data
						}, function(err, html){
							console.log(err);
							console.log('got here');
							res.send(html);
						});
					}
				});
			}
		});
	} else {
		res.redirect(__dirname + '/public/index.html');
	}
});

app.get('/:pageid', function(req, res){

});

app.get('/:pageid/:postid', function(req, res){

});

app.listen(80);