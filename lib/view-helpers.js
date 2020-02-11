module.exports = function(render){ // Accept render function from view engine
	return {
		block: { // Default block helpers
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
		},
		inline: { // Default inline helpers
			upperCase: function(str){
				return str.toUpperCase();
			}
		}
	};
};
