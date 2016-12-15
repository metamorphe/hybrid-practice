// Using the property s_selected to keep track of element styling
var NORMAL_SELECT = function(path){
	name = Artwork.getPrefix(path);
	if(name == "NLED")
		path.set({strokeWidth: 2, strokeColor: "#00A8E1"});
	else
		path.set({strokeWidth: 2, dashArray: [], strokeColor: "yellow"})
}

function SelectionManager(){
	this.history = {};
	this.selection = [];
}
SelectionManager.prototype = {
	ledAdd: function(path){
		var scope = this;
		var diffs = CanvasUtil.getDiffusers(path);
		 _.each(diffs, function(diff){
			scope.add(diff);
			// console.log(scope, diff)
		});
		scope.add(path)
	},
	add: function(path){
		ids = _.map(this.selection, function(s){return s.id});
		if(ids.indexOf(path.id) > -1) return;
		this.selection.push(path);

	},
	clear: function(){
		this.selection = [];
	}, 
	update: function(){
		var scope = this;
		var leds = CanvasUtil.queryPrefix("NLED");
		var diff = [CanvasUtil.queryPrefix("DIFF"), CanvasUtil.queryPrefix("DDS")];
		var elements = _.flatten([diff, leds]);
		var selectedElements = _.filter(elements, function(el){ return el.s_selected; });
		// // console.log('SELECTED ELEMENTS')
		_.each(selectedElements, function(el){
			scope.select(el, false);
			el.s_selected = false;
		})
		_.each(this.selection, function(el){
			// el.selected = true;
			scope.select(el, true);
			el.s_selected = true;
		});
		paper.view.update();
	}, 
	select: function(path, set){
		if(set){
			this.history[path.id] = {strokeColor: path.strokeColor, dashArray: path.dashArray, fillColor: path.fillColor, strokeWidth: path.strokeWidth};
			NORMAL_SELECT(path);
			// DIFF_SELECT(path);
		} else{
			path.set(this.history[path.id]);
			delete this.history[path.id];
		}
	}, 
	currentSelectedLEDs: function(){
		var leds = CanvasUtil.queryPrefix("NLED");
		return _.filter(leds, function(el){ return el.s_selected; });;
	}
}