
// Cartesian SIA
// var cartesian = new SIA(leds, {
// 								i: function(led, i, arr){ return i; }
// 								alpha: function(led, i, arr){ return led.position.x;}, // primary axis 
// 								beta: function(led, i, arr){ return led.position.y;}, // secondary axis
// 								gamma: function(led, i, arr){ return led.position.distanceTo(new paper.Point(0, 0)); } // tertiary access
// 							}
// 						);

// cartesian.each(["alpha", "beta", "gamma"], function(led, index){
// 	led.set({
// 		fillColor: {hue: index.alpha.param * 360, saturation: index.beta.param, index.gamma.param}
// 	})
// });


// range: [0, 256], 
// resolution: 1,
// alpha: 1.1, 
// inertia: function(from, to){ return 0;}


function TimeSignal(){
	this.data = [0, 1, 0]; // only between 0 and 1
}
TimeSignal.prototype = {
	express: function(actuator, options){
		var gamm = 1/actuator.alpha;
		var gamma_corrected_signal = _.map(this.data, function(datum){ return Math.pow(datum, actuator.alpha); });
		var time_signal = _.map(gamma_corrected_signal, function(datum, i){ return [i, datum];});
		
		var p = new paper.Path({segments: time_signal});



		var total_samples = this.temporal_range * this.sampling_rate;
		var signal = _.range(0, total_samples, 1);
		return _.map(signal, function(sample){
			return p.getPointAt(sample / total_samples).y;
		});
	}
}


function SIA(collection = [], indices){
	this.collection = collection;
	this.indexFNs = indices;
	this.updateIndices();
}

SIA.prototype = {
	append: function(items){
		this.collection = _.flatten(this.collection.append(items));
		this.updateIndices();
	},
	remove: function(items){
		if(typeof items == "object"){
			var rejectIDs = _.map(items, function(item){ return item.id;});
		} else rejectIDs = [items.id];

		this.collections = _.reject(this.collections, function(item){ _.contains(rejectIDs, item.id); });
		this.updateIndices();
	},
	updateIndices: function(){
		var scope = this;
		indices = _.mapObject(this.indexFNs, function(fn, key){
			return _.map(scope.collection, function(c, i, arr){ return fn(c, i, arr);})
		});
		this.indices = _.mapObject(indices, function(values, key, obj){
			return _.map(values, function(val, i, arr){
				var max = _.max(arr);
				var min = _.min(arr);
				var range = max - min;
				var param = (val - min) / range;
				return {value: val, max: max, min: min, param: param}
			});
		});
	},	
	each: function(ordering_schema, fn){
		var scope = this;
		if(!_.contains(_.keys(scope.indices), ordering_schema)){
			msg = "Ordering Schema " + ordering_schema + " does not exist. Try " + _.keys(scope.indices).join(', ') + "."; 
			throw Error(msg);
		}
		_.each(this.collection, function(c, i, arr){
			var remap = _.mapObject(scope.indices, function(val, key){return val[i]; });
			fn(c, remap);
		});	
	}, 
	toString: function(ordering_schema){
		this.each(ordering_schema, function(c, i){
			console.log(c.id, i);
		});
	}
}