
// zoom.js

Zoom.STEP = 0.1;
Zoom.MAX = 10;
Zoom.MIN = 0.1;

function Zoom(starting_level, paper){
	this.level = starting_level;
	this.checkbounds();
	
	
}

Zoom.prototype = {
	checkbounds: function(){
		if(this.level > Zoom.MAX) this.level = Zoom.MAX;
		if(this.level < Zoom.MIN) this.level = Zoom.MIN;
	},
	in: function(){
		this.level += Zoom.STEP;
		this.checkbounds();
		this.update();
	},
	out: function(){
		this.level -= Zoom.STEP;
		this.checkbounds();
		this.update();
	}, 
	show_scale: function(){
		// console.log("showing scale");
		// var b = designer.nodes.bounds().bounds;
		var pt = paper.view.center.clone();

		var diam = Ruler.mm2pts(24.26);
		pt.x += diam;
		pt.y += diam;
		
		this.scale = paper.Path.Circle({
			center: pt, 
			radius: diam/2, 
			strokeColor: "black"
		});
		var pt = this.scale.bounds.leftCenter.clone();
		pt.x += 15;
		pt.y += 10;
		this.text = new paper.PointText({
			point: pt,
			content: "25¢",
			fillColor: 'black', 
			fontFamily: 'Arial', 
			fontWeight: 'bold', 
			fontSize: 25
		});
		// this.text.position = this.text.bounds.center;
		
		paper.view.update();
	},
	hide_scale: function(){
		// console.log("hiding scale");
		this.scale.remove();
		this.text.remove();
		
		// this.scale.visibe = false;
		paper.view.update();
	},
	update: function(){
		paper.view.zoom = this.level;
		paper.view.update();
	}
}