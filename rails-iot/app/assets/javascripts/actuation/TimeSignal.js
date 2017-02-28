
var time_signal_counter = 0;

function TimeSignal(data){
	this.data = data; // only between 0 and 1
	this.id = time_signal_counter++;
}
TimeSignal.prototype = {
	command_list: function(timePeriod){
		var t_scale = timePeriod / this.data.length;
		var t_elapsed = 0;
		return _.map(this.data, function(datum){
			var duration = 1 * t_scale;
			var t = t_elapsed;
			t_elapsed += duration;
			return {t: t, param: datum, duration: duration}
		});
	},
	draw_axes: function(op){
	  var offset = new paper.Point(0, -4);
	  axes = [{
        from: paper.view.bounds.topLeft.subtract(offset), 
        to: paper.view.bounds.topRight.subtract(offset),
      }, {
        from: paper.view.bounds.bottomLeft.add(offset),
        to: paper.view.bounds.bottomRight.add(offset),
      }];

     return _.map(axes, function (axis){
     	axis = _.extend(op, axis);
     	return new paper.Path.Line(axis);
     });
	},
	to_visual: function(){
		return _.map(this.data, function(datum, i){ return [[i, datum], [i + 1, datum]];})
	}, 
	signal_fill: function(op){
		var visual = this.to_visual();
		var time_signal = _.flatten(visual, true);
		time_signal = _.flatten([[[0, 0]], time_signal, [[this.data.length, 0]]], true);
		op = _.extend(op, {segments: time_signal, closed: true});
		p = this.makePath(op);
		return p;
	},
	signal: function(op){
		var visual = this.to_visual();
		var time_signal = _.flatten(visual, true);
		op = _.extend(op, {segments: time_signal});
		p = this.makePath(op);
		return p;
	},	
	makePath: function(op){
		var p = new paper.Path(op);
		p.scaling.x = paper.view.bounds.width / p.bounds.width;
		p.scaling.y = -(paper.view.bounds.height - 10) / p.bounds.height;
		p.position = paper.view.center;
	},
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
