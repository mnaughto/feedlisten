var Templates = {};
Templates.cache = {};

Templates.preload = function(templates, callback) {
	if(!callback) callback = function() {};
	if(!templates || !templates.length) return;

	var delayedCallback = _.after(templates.length, callback);
	_.each(templates, function(template) {
		Templates.get(template, delayedCallback);
	});
};

Templates.get = function(template, callback) {
	if(!$.isFunction(callback)) {
		console.error('You must pass a valid callback to Templates.get()');
		return;
	}

	if(typeof Templates.cache[template] != 'undefined') {
		callback(Templates.cache[template]);
		return; // Purposely don't return the template here even though we have it
				// to force the use of the callback.. we don't want clients to
				// accidentally rely on the output since this may not be cached.
	}

	$.get('/templates/' + template + '.tmpl', function(response) {
		response = '' + response;

		var compiled = Handlebars.compile(response);
		Templates.cache[template] = compiled;

		callback(compiled);
	}, 'text');

	return;
};

Handlebars.registerHelper('foreach', function(context, options) {
    var ret = "";
    for(var prop in context)
    {
        ret = ret + options.fn({
			property:prop, value:context[prop]
        });
    }
    return ret;
});