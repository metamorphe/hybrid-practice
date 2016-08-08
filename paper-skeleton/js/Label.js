// Default Label Style Settings
var DEFAULT_TEXT_STYLE = {
	justification: "center",
    fillColor: 'black',
    fontFamily: 'Helvetica',
    fontWeight: 'bold',
    fontSize: 20
}
var DEFAULT_BOX_STYLE = {
	padding: {x: 16, y: 8}, 
	strokeColor: "black",
	strokeWidth: 2
};
var DEFAULT_HANDLE_STYLE = {
	strokeColor: "black",
	strokeWidth: 3
}

function LabelBox(text, text_style=DEFAULT_TEXT_STYLE, box_style=DEFAULT_BOX_STYLE){
		this.text = text;
		this.style = {
			text: text_style, 
			box: box_style
		};
		this.dom = this.init();
	};
LabelBox.prototype = {
	init: function(){
		text = this.makeText();
		box = this.makeBox(text);
		return new paper.Group([box, text]);
	},
	clone: function(){
		return new LabelBox(this.text, this.style.text, this.style.box);
	},
	makeText: function(){
		var text = new PointText({
		    point: paper.view.center,
		    content: this.text
		});
		text.set(this.style.text);
		return text;
	}, 
	makeBox: function(text){
		var box = new paper.Path.Rectangle(text.bounds.expand(DEFAULT_BOX_STYLE.padding.x, DEFAULT_BOX_STYLE.padding.x));
		box.set(this.style.box);
		box.pivot = box.bounds.leftCenter;
		return box;
	}, 
	getTerminal: function(orientation){
		// Create vector from center to center + 1000
		var label_box_center = this.dom.bounds.center.clone();
		label_box_center.length = 1000;
		label_box_center.angle = orientation;

		// Rotate so that the vector points in the opposite direction 
		label_box_center = label_box_center.rotate(180);
		label_box_vector = new paper.Path([this.dom.bounds.center,label_box_center]);
		
		// Calculate the intersections between the label box and the vector
		var label_box_path = new paper.Path.Rectangle(this.dom.bounds);
		label_box_itx = label_box_path.getIntersections(label_box_vector);
		var nearestPoint = label_box_itx[0].point;
		
		// Determine the closest magnet to the intersection found
		this.dom.setMagnets();
		var magnets = _.map(this.dom.magnets, function(value, key){ return {name: key, point: value }});
		var label_box_terminal = _.min(magnets, function(m){
			// Set bias so that it usually chooses east and west
			var bias = ["north", "south"].indexOf(m.name) > -1 ? 10 : 0;
			return nearestPoint.getDistance(m.point) + bias;
		});
		return label_box_terminal;
	}
}

function Handle(orientation, length=100, style=DEFAULT_HANDLE_STYLE){
	this.style = style;
	this.settings = {orientation:orientation, length:length , style:style};
	this.dom = this.init(orientation,length);
};
Handle.prototype = {
	init: function(orientation, length){
		var mainLine = new paper.Point(0,0);
		var mainLine = new paper.Point(0,0);
		mainLine.angle = orientation;
		mainLine.length = length;

		var pullOutLine = new paper.Point(0,0);
		pullOutLine.angle = 0;
		pullOutLine.length = length/3;
		var labelLine  = new paper.Path();
		labelLine.set(this.style);
		var tempTerminalPoint = new paper.Point(0,0);
		if(orientation>= -90 & orientation<=90){
			labelLine.segments = [tempTerminalPoint, tempTerminalPoint.add(mainLine), tempTerminalPoint.add(mainLine).add(pullOutLine)];
		}else{
			labelLine.segments = [tempTerminalPoint, tempTerminalPoint.add(mainLine), tempTerminalPoint.add(mainLine).subtract(pullOutLine)];
		}
		labelLine.position = new paper.Point(500,500);
		// this.extend(this.path);
		return labelLine;
	},
	extend: function(path, terminal){
		// Check if the repositioning of the handle is necessary
		var vector = new paper.Path([path.bounds.center, terminal]);
		var itx = path.getIntersections(vector);
		this.dom.firstSegment.point = itx[0].point;
	},
	clone: function(){
		return new Handle(this.settings.orientation, this.settings.length, this.settings.style);
	}
}
