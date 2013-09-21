var _ = require('underscore');
var express = require('express');
var request = require('request');
var hbs = require('hbs');
var keys = require(__dirname + '/../index.js');
var sendgrid = require('sendgrid')('mnaughto', keys.SENDGRID);
var firebase = require('firebase');
var firebaseTokenGen = require('firebase-token-generator');
var fb_root = new Firebase('https://feedlisten.firebaseio.com/');
var tokenGenerator = new FirebaseTokenGenerator(keys.FIREBASE);

var adminToken = tokenGenerator.createToken({}, {
	admin: true,
	debug: false,
	expires: 1577836800
});

fb_root.auth(adminToken);

var app = express();

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
	var token = 'flashing7';
	if(req.query['hub.mode'] && req.query['hub.challenge'] && req.query['hub.verify_token']){
		if(req.query['hub.verify_token'] == token){
			res.send(req.query['hub.challenge']);
		}
	}
});

app.post('/', function(req, res){
	if(req.body && req.body.entry){
		_.each(req.body.entry, function(entryItem){
			fb_root.child(entryItem.id).once('value', function(entrySnap){
				if(entrySnap.val()){
					var entryData = entrySnap.val();
					//get post id to view text of post
					var post_id;
					var token = entryData.token;
					try {
						post_id = entryItem.changes[0].value.post_id;
					} catch(ex){
						console.log(ex);
						return;
					}
					//get the post from facebook
					request({json: true, url:'https://graph.facebook.com/' + post_id, qs: {'access_token':token}}, function(error, response, body){
						if(!error && response.statusCode == 200){
							if(body.message){
								var bodyData = 'apikey=' + keys.ALCHEMY + '&text=' + encodeURIComponent(body.message) + '&outputMode=json';
								request({method: 'post', url:'http://access.alchemyapi.com/calls/text/TextGetTextSentiment', body:bodyData}, function(error, response, body){
									if(!error && response.statusCode == 200){
										body = JSON.parse(body);
										if(body.docSentiment){
											var sentiment = {
												type: body.docSentiment.type,
												value: body.docSentiment.score
											};
											if((entryData.type == 'either') || (entryData.type == sentiment.type)){
												//send an email
												console.log('send an email');
												console.log(entryData);
											} 
										} else {
											console.log(body);
											console.log(bodyData);
											res.send(500, 'Could not get a sentiment');	
										}
									} else {
										console.log(body);
										console.log(bodyData);
										res.send(500, 'Could not get a sentiment');
									}
								});
							}
						} else {
							console.log(error);
						}
					});
					//send the post message to alchemy
					//once alchemy returns, detect the sentiment. 
					//if the sentiment is beyond the threshold in the right direction, 
					//send an email to the destination
				}
			});
		});
	}
});

exports = app;