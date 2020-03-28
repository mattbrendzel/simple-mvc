module.exports = function(render, parser){ // Accept render function from view engine
	return {
		block: { // Default block helpers
			each: function(operands, innerTemplate, context) {
				const collection = operands[0];
				return collection.map(item => render(innerTemplate, item)).join('');
			},
	    if: function(operands, innerTemplate, context){
				const elseIfTagMatcher = /\s*\n*\<\$\s*else.*\$\>\n*\s*/; //also matches else tag
				const elseIfConditionMatcher = /\<\$\s*else\-if\s+(.+)\s*\$\>/g; // extracts condition
				// Check for else or else-if tags; if they exist, subdivide the template
				// around them to get set of template sections. If no `else` or `else-if`
				// tags are found, there will only be one template section.
				const templateSections = innerTemplate.trim().split(elseIfTagMatcher);
				const conditions = [
					operands[0], // Condition for the 'if'
					...Array.from( // Conditions for the 'else-if's, if they exist
						innerTemplate.matchAll(elseIfConditionMatcher), match => match[1]
					)
				];
				for (let i = 0; i< conditions.length; i++) {
					// Terminate and render at the first true condition
					if (conditions[i]) { return render(templateSections[i]) }
				}
				// If the function hasn't terminated yet, check for an `else` tag
				// If an `else` tag exists, there are must be template sections than
				// and the last template section corresponds to it. In that case,
				// render the last template section (and otherwise, render nothing).
				return templateSections.length > conditions.length ? render(templateSections.slice(-1)[0]) : "";
	    }
		},
		inline: { // Default inline helpers
			upperCase: function(operands, context){
				const str = operands[0];
				return str.toUpperCase();
			}
		}
	};
};
