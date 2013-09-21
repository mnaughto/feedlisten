var _ = require('underscore');
var express = require('express');
var request = require('request');
var handlebars = require('handlebars');
var hbs = require('hbs');
var sendgrid = require('sendgrid');
var keys = require(__dirname + '/keys.js');

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
						console.log(data);
						res.render('pages', data, function(err, html){
							if(err){
								console.log(err);
							} else {
								res.send(html);
							}
						});
					}
				});
			}
		});
	} else {
		res.redirect('/');
	}
});

app.get('/:pageid', function(req, res){
	if(req.query.token){
		request({json: true, url:'https://graph.facebook.com/me/accounts', qs:{'access_token':req.query.token}}, function(error, response, body){
			if(!error && response.statusCode == 200){
				var page;
				_.each(body.data, function(element){
					if(element.id == req.params.pageid){
						page = element;
					}
				});
				res.redirect('/' + page.id + '?pageToken=' + page.access_token);
			}
		});
	} else if(req.query.pageToken) {
		request({json: true, url:'https://graph.facebook.com/' + req.params.pageid, qs:{'access_token':req.query.pageToken}}, function(error, response, body){
			if(!error && response.statusCode == 200){
				var page = body;
				request({json: true, url:'https://graph.facebook.com/' + req.params.pageid + '?fields=feed', qs:{'access_token':req.query.pageToken}}, function(error, response, body){
					var item = body.feed.data[0];
					request({method: 'post', url:'http://access.alchemyapi.com/calls/text/TextGetTextSentiment', body:{apikey:keys.ALCHEMY, text:item.message, outputMode:'json'}}, function(error, response, body){
						var sentiment = {
							type: body.docSentiment.type,
							value: body.docSentiment.score
						};
						var viewData = {
							post: item,
							sentiment: sentiment, 
							page: page,
							name: 'Random User'
						};
						res.render('page', viewData, function(err, html){
							if(err){
								console.log(err);
							} else {
								res.send(html);
							}
						});
					});
				});
			}
		});
	} else {
		res.redirect('/');
	}
});

app.post('/:pageid', function(req, res){
	if(req.query.token){

	} 
});

app.get('/:pageid/:postid', function(req, res){
	res.send('Nope');
});

app.listen(80);