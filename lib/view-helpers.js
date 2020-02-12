module.exports = function(render, parseValue){ // Accept render function from view engine
	return {
		block: { // Default block helpers
			each: function(operandString, innerTemplate, context) {
				let collection = context[operandString.split(' ')[0]];
				return collection.map(function(item){
					return render(innerTemplate, item);
				})
				.join('');
			},
	    if: function(operandString, innerTemplate, context){
				// Check for else or else-if tags; if they exist, subdivide the template
				// around them to get set of template sections. If no `else` or `else-if`
				// tags are found, there will only be one template section.
				const templateSections = innerTemplate.trim().split(/\s*\n*\<\$\s*else.*\$\>\n*\s*/);
				const conditions = [
					operandString, // Condition for the 'if'
					...innerTemplate.match(/(?<=\<\$\s*else\-if\s+).*(?=\s*\$\>)/g) // Conditions for the 'else-if's, if they exist
					// `match` doesn't retain capture groups when /g is used
					// so use positive lookahead and lookbehind to skip parts we don't want
				].map(opStr => parseValue(opStr)); // Note: Eventually replace with true evaluation
				for (let i = 0; i< conditions.length; i++) {
					// Terminate and render at the first true condition
					if (conditions[i]) { return render(templateSections[i]) }
				}
				if (templateSections.length > conditions.length) { // If there is an else (and we haven't terminated)
					return render(templateSections.slice(-1)[0]);
				}
				return ""; // If there is no 'else' and the condition is false
	    }
		},
		inline: { // Default inline helpers
			upperCase: function(str){
				return str.toUpperCase();
			}
		}
	};
};
