// stroke_select_ui

function StrokeSelectUI() {
	this.moving_trace = null;
	this.anchor_trace = null;
	this.magnet_strength = 0.5;
}


StrokeSelectUI.prototype = {
	initDOM: function(){

	},
	switchTraces: function(){
		var temp = this.moving_trace;
		this.moving_trace = this.anchor_trace;
		this.anchor_trace = temp;
	}
}