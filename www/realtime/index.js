var _ = require('underscore');
var express = require('express');
var request = require('request');
var hbs = require('hbs');
var keys = require(__dirname + '/index.js');
var sendgrid = require('sendgrid')('mnaughto', keys.SENDGRID);
var Firebase = require('firebase');
var FirebaseTokenGenerator = require('firebase-token-generator');
var fb_root = new Firebase('https://feedlisten.firebaseio.com/');
var tokenGenerator = new FirebaseTokenGenerator('nkn6OpQUq6gILOZq2vlrcH21P7aFtVCjgVLwQTYt');

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
});

app.get('/callback', function(req, res){
	var token = 'flashing7';
	if(req.query['hub.mode'] && req.query['hub.challenge'] && req.query['hub.verify_token']){
		if(req.query['hub.verify_token'] == token){
			res.type('txt');
			res.send(req.query['hub.challenge']);
		}
	}
});

app.post('/callback', function(req, res){
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
					console.log('got post_id');
					//get the post from facebook
					request({json: true, url:'https://graph.facebook.com/' + entryItem.id + '_' + post_id, qs: {'access_token':token}}, function(error, response, body){
						if(!error && response.statusCode == 200){
							console.log('got the post');
							if(body.message){
								console.log('got the message');
								var bodyData = 'apikey=' + keys.ALCHEMY + '&text=' + encodeURIComponent(body.message) + '&outputMode=json';
								request({method: 'post', url:'http://access.alchemyapi.com/calls/text/TextGetTextSentiment', body:bodyData}, function(error, response, body){
									console.log('came back from alchemyapi');
									if(!error && response.statusCode == 200){
										console.log('alchemyapi success');
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
							console.log('main error');
							console.log(body);
							console.log(token);
							console.log(post_id);
							console.log(entryItem.id);
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

exports.app = app;