
TerminalHandler.NEGATIVE = 0;
TerminalHandler.POSITIVE = 1;
TerminalHandler.A = 0;
TerminalHandler.B = 1;

function TerminalHandler(num_of_terminals, polar){
	this.terminals = $.map(_.range(num_of_terminals), function(){ return [[]]});
	this.polar = polar;
}
TerminalHandler.prototype = {
	polarity: function(){
		return this.polar;
	},
	add: function(element, polarity){
		this.terminals[polarity].push(element);
	}, 
	remove: function(element, polarity){
		this.terminals[polarity] = reject(this.terminals[polarity], function(el){ return el.uuid == element.uuid });
	}, 
	getDirection: function(from){
		// console.log("from", from.id, from.terminal.polarity());
		if(from.terminal.polar == 2) return 0;
		var term = this.findTerminal(from);
		

		if(term == TerminalHandler.A) return 1;
		else return -1; 
	},
	getTerminal: function(idx){
		return this.terminals[idx];
	},
	findTerminal: function(el){
		if(_.isNull(el)) return TerminalHandler.B;
		
		var term = _.map(this.terminals, function(terminal, i, arr){
			return _.isUndefined(_.find(terminal, function(other){ return other.uuid == el.uuid }));
		});
		// [false, true, false]
		return term.indexOf(false);
		// return term;
	},
	getChildren: function(parent){

		var idx = this.findTerminal(parent);
		return _.flatten(_.reject(this.terminals, function(el, i){ return i == idx; }));
	}
}