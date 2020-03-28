"use strict";

const fs = require('fs');
const root = process.cwd();
const App = require(`${root}/lib/app.js`);
const CodeParser = require(`${root}/lib/js-parser.js`);

const ViewEngine = {};

const partials = (App.partials || {}).extend({
  // Default partials
  // Not sure if these would need to exist -- maybe for forms?
});

const render = function(str, context) {
  context = context || {};
	// console.log('STR:', JSON.stringify(str));
	var blockHelperMatcher = /\n*\t*(<\$\#(\S*)\s[^\$]*\$>[\s\S]*<\$\/\2\s*\$>)/;
	// <$#blockHelper operandString$> ... <$/blockHelper$>
  var partialMatcher = /(<\$>\S*\s\$>)/;
	// <$>partial $>
	var interpolationMatcher = /(<\$\=[^\$]*\$>)/;
	// <$= inlineHelper(operands) $>  (e.g. <$= uppercase(myName) $> => "Matt")
	// <$= interpolatedExpression $>  (e.g. <$= 1 + 1 $> => 2)

	return str
	.split(blockHelperMatcher)
	.filter(function(str, index, arr){
		return (index > 0)? arr[index - 1].substr(0, 3) !== '<$#' : true;
	}) // filter out captured groups
	.map(function(segment){  // handle block helpers
		if (segment.substr(0,3) !== '<$#') { return segment; }
		var tokens = segment.match(/<\$\#(.\S*)\s([^\$]*)\$>([\s\S]*)</);
    const helperName = tokens[1];
    const operands = CodeParser.parseToken(`[${tokens[2]}]`, context);
    const innerTemplate = tokens[3].trimRight();
		if (helpers.block[helperName]) { // if defined as a block helper
      return helpers.block[helperName](operands, innerTemplate, context);
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
	.map(function(segment){  // handle inline helpers / raw interpolation
		if(segment.substr(0,3) !== '<$=') { return segment; }
    const contentToken = segment.match(/<\$\=\s*([^\$]*)\s*\$>/)[1].trim();
    return CodeParser.parseToken(contentToken, context.extend(helpers.inline));
	})
	.join('');
};

const helpers = require(`${root}/lib/view-helpers.js`)(render, CodeParser); // Load default helpers
helpers.block.extend(App.viewHelpers.block);    // .extend is from object-model.js
helpers.inline.extend(App.viewHelpers.inline); // user-defined helpers are unable to override defaults

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
    // See developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/
    //   Global_Objects/String/replace#Specifying_a_string_as_a_parameter
    return render(template, controller);
  });
};

module.exports = ViewEngine;
