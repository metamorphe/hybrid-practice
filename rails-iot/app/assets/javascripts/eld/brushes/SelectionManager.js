// Using the property s_selected to keep track of element styling
var NORMAL_SELECT = function(path){
	name = Artwork.getPrefix(path);
	if(name == "NLED")
		path.set({strokeWidth: 2, strokeColor: "#00A8E1"});
	else
		path.set({strokeWidth: 2, dashArray: [], strokeColor: "yellow"})
}

function SelectionManager(stylizeFn = NORMAL_SELECT){
	this.history = {};
	this.stylize = stylizeFn;
	this.selection = [];
}
SelectionManager.prototype = {
	ledAdd: function(path){
		var scope = this;
		scope.add(path); // important ordering!

		var diffs = CanvasUtil.getDiffusers(path);
		this.update();
		 _.each(diffs, function(diff){
			scope.add(diff);
		});

		
	},
	add: function(path){
		ids = _.map(this.selection, function(s){return s.id});
		if(ids.indexOf(path.id) > -1){
			// remove the diffuser if it doesnt have any selected LEDS
			var leds = CanvasUtil.getLEDS(path);
			leds = _.reject(leds, function(led){ return led.id == path.id; });
			
			var none_s = _.every(leds, function(led){ return !led.s_selected;});
			if(none_s) this.remove(path);
			
			return;
		}
		this.selection.push(path);
	},
	remove: function(path){
		this.selection = _.reject(this.selection, function(s){
			return s.id == path.id;
		});
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
			this.stylize(path);
			// DIFF_SELECT(path);
		} else{
			path.set(this.history[path.id]);
			delete this.history[path.id];
		}
	}, 
	currentSelectedLEDs: function(){
		var leds = CanvasUtil.queryPrefix("NLED");
		return _.filter(leds, function(el){ return el.s_selected; });;
	}, 
	makeBlock: function(info){
		var scope = this;
		console.log("SAVING TO SERVER", info)
		
		var png = $('canvas')[0].toDataURL("image/png");       

		var data = {
			image: png,
			name: [info.file, info.type, info.name].join('_'), 
			data: JSON.stringify(info)
		}


		$.ajax({
		  url: '/tool/visual_block',
		  type: 'POST',
		  data: data,
		  success: function(data) {
		    console.log("Saved to the server!", data);
		    sl.populate();
		  }
		});
	}
}