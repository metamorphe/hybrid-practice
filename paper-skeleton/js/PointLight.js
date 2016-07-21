function PointLight (options) {
	this.options = options;
	this.source = this.init();
	this.emmision();

}
PointLight.prototype = {
	init: function(argument) {
		source = new paper.Path.Rectangle({
			size: new paper.Size(Ruler.mm2pts(5), Ruler.mm2pts(1.4)), 
			position: this.options.position,
			fillColor: "white", 
			strokeColor: "#333", 
			strokeWidth: 1
		});
		return source;
	}, 
	toLocalSpace: function(angle){
		return angle - 90;
	},
	emmision: function(){
		for(var theta = -60; theta <= 60; theta += 30){
			this.emit(source.position, this.toLocalSpace(theta), 1, "red");
		}
		// this.emit(source.position, this.toLocalSpace(0), 1, "red");
	},
	emit: function(origin, direction, strength, color){
		var strength = strength * 0.1 + 1;
		var rayEnd = new paper.Point(0, -1);
		rayEnd.length = 100;
		rayEnd.angle = direction;

		return new paper.Path.Line({
			from: origin, 
			to: origin.add(rayEnd),
			strokeColor: color, 
			strokeWidth: strength
		});
	}
}