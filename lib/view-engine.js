"use strict";

const fs = require('fs');
const root = process.cwd();
const App = require(`${root}/lib/app.js`);

const ViewEngine = {};

const partials = (App.partials || {}).extend({
  // Default partials
});

const helpers = {
	block: (App.viewHelpers.block || {}).extend({
    // Default block helpers
		each: function(operandString, innerTemplate, context) {
			let collection = context[operandString.split(' ')[0]];
			return collection.map(function(item){
				return render(innerTemplate, item);
			})
			.join('');
		},
    // if: function(operandString, innerTemplate, context){
    //   let isVisible = parseValue(operandString);
    //   return isVisible? render(innerTemplate) : '';
    // }
	}),
	inline: (App.viewHelpers.inline || {}).extend({
		upperCase: function(str){
			return str.toUpperCase();
		}
	})
};

const parseValue = function(str, context) {
  context = context || {};
	if (str.match(/^\d+(\.\d*)?$/)) {
		// console.log(JSON.stringify(str),'is a raw number');
		return Number(str);
	} else if (str.match(/^\'.*\'$/) || str.match(/\".*\"$/)) {
		// console.log(JSON.stringify(str),'is a raw string');
		return (str.match(/^\'(.*)\'$/) || str.match(/^\"(.*)\"$/))[1];
	} else if (str.match(/^(true|false)$/)) {
		// console.log(JSON.stringify(str),'is a raw boolean');
		return !!str.match(/^true$/);
	} else if (str.match(/^null$/)) {
		// console.log(JSON.stringify(str),'is a raw null');
		return null;
	} else {
		// console.log(JSON.stringify(str),'may be a variable');
		let pieces = str.split('.');
		let value = context;
		try {		// winnow down through nested properties ('.' only)
			for (let i = 0; i < pieces.length; i++) {
				value = value[pieces[i]];
			}
			console.log('value:', value);
			return value.toString();
		}
		catch(err) {  // undefined
			console.log(JSON.stringify(str),'is undefined;', err);
		}
	}
};

const render = function(str, context) {
  context = context || {};
	// console.log('STR:', JSON.stringify(str));
	var blockHelperMatcher = /\n*\t*(<\$\#(\S*)\s[^\$]*\$>[\s\S]*<\$\/\2\s*\$>)/;
	// <$#blockHelper operandString$> ... <$/blockHelper$>
  var partialMatcher = /(<\$>\S*\s\$>)/;
	// <$>partial $>
	var interpolationMatcher = /(<\$[^\$]*\$>)/;
	// <$inlineHelper operand$>
	// <$interpolatedData$>
	return str
	.split(blockHelperMatcher)
	.filter(function(str, index, arr){
		return (index > 0)? arr[index - 1].substr(0, 3) !== '<$#' : true;
	}) // filter out captured groups
	.map(function(segment){  // handle block helpers
		if (segment.substr(0,3) !== '<$#') { return segment; }
		var tokens = segment.match(/<\$\#(.\S*)\s([^\$]*)\$>([\s\S]*)</);
		var helperName = tokens[1];
		var operand = tokens[2];
		var innerTemplate = tokens[3].trimRight();
		if (helpers.block[helperName]) { // if defined as a block helper
			return helpers.block[helperName](operand, innerTemplate, context);
		} else {
			// UNDEFINED -- SHOW ERROR
			console.error('Helper Not Defined: ', helperName);
		}
	})
	.join('')
	.split(partialMatcher)
 	.map(function(segment){  // handle interpolated partial templates
		if (segment.substr(0,3) !== '<$>') {return segment;}
		var partialName = segment.match(/<\$>(\S*)/)[1];
		if (partials[partialName]) {
			return render(partials[partialName], context);
		}
		else {
			// UNDEFINED -- SHOW ERROR
			console.error('Partial Not Defined: ', partialName);
		}
	})
	.join('')
	.split(interpolationMatcher)
	.map(function(segment){  // handle inline helpers and raw interpolation
		if(segment.substr(0,2) !== '<$') { return segment; }
		segment = segment.replace(/(<\$)|(\$>)/g, '').trim();

		// split by EITHER pairs of quotes OR spaces BUT NOT spaces within quotes
		// "helper operand" or "someVariableOrValue"
		var tokens = segment.split(/(\'[^\']*\'|\"[^\"]*\")/) // split around raw strings
		.filter(function(seg){ return seg; }) 		  // drop any empty segments created by split
		.map(function(subsegment){                  // if segment is not a raw string, split by spaces
			return subsegment.match(/^(\'.*\'|\".*\")$/)?
				subsegment :
				subsegment.split(' ').filter(function(seg){ return seg; });
				// drop any empty segments created by split
		})
		.reduce(function(m, e) {return m.concat(e);}, []) // flatten array

		// console.log("TOKENS:", tokens);
		if (helpers.inline[tokens[0]]) { // if defined as an inline helper
			return helpers.inline[tokens[0]].apply(null,
				// [parseValue(tokens[1], context)]  						 // for only one argument
				tokens.slice(1).map(function(t){ return parseValue(t, context); }) // for N arguments
			);
		}
    else {						               // otherwise, parse the value
		 	return parseValue(tokens[0], context).toString();
		}
	})
	.join('');
};

ViewEngine.renderViewFor = function(controller) {
  let layoutName = "application";
  let layoutContent;
  return App.loader.loadLayout(layoutName)
  .then(function(layoutData){
    layoutContent = layoutData;
    return App.loader.loadView(controller.resource, controller.params.action);
  })
  .then(function(template){
    template = layoutContent.replace("<$ outlet $>",() => template); // interpolate template into layout
    // Note: A wrapper function is used here so that .replace will not try to
    // use any of the special replacement patterns (e.g. $$) for the match, and
    // will just insert `template` as a literal.
    // See developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace#Specifying_a_string_as_a_parameter
    return render(template, controller);
  });
};

module.exports = ViewEngine;
