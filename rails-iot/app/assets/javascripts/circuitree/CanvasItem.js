

function CanvasItem(paper, path, type, t_config){
	if(_.isUndefined(t_config)) this.t_config = [];
	else this.t_config = t_config;

	this.className = "CanvasItem";
	this.paper = paper;
	this.id = path.id;
	this.guid = guid();

	
	this.type = type;
	if(type == "ArtworkLayerElement")
		this.path = path;
	else
		this.path = new paper.Group([path]);
	this.path.canvasItem = this;

	this.path.applyMatrix = true;
	// if(!_.isUndefined(this.path.parent)){
	// 	this.path.parent.applyMatrix = true;
	// }
	this.name = path.name;

	// transformation rectangle
	this.ref_x = false;
	this.ref_y = false;

	
	this.init_bounds = path.bounds.clone().expand(10, 10);
	this.selection_rectangle = this.initSelectionRectangle();
	
	// c.remove();
	// c.parent.removeChild(c);
	// this.path.addChild(c);
	// var g = new paper.Group([this.path, c]);
	// paper.project.activeLayer.addChild(c);
	// if(this.t_config.length > 0) this.addTerminals(this.t_config);
}
CanvasItem.prototype = {
	setOpacity: function(val){
		this.path.opacity = val;
	},
	getBounds: function(){
		return this.path.bounds;
	},
	removeTerminals: function(){
		_.each(_.values(this.terminals), function(el, i, arr){
			el.remove();
		});
		this.terminals = {};
	},
	ledOn: function(on1_off0){
		if(on1_off0){
			this.path.led_on = true;
			this.path.children[0].style = {
				shadowColor: "yellow",
				shadowBlur: 100,
				shadowOffset: new paper.Point(0, 0), 
				strokeWidth: 2, 
				strokeColor: "yellow"
			}
			this.path.children[0].opacity = 1;
		} else {
			this.path.led_on = false;
			this.path.children[0].style = {
				shadowColor: "yellow",
				shadowBlur: 0,
				shadowOffset: new paper.Point(0, 0)
			}
			this.path.children[0].opacity = 1;
		}
	},
	flashTerminal: function(key, duration){
		if(!(key in this.terminals)) return;

		var term = this.terminals[key];
		term.style = {
			shadowColor: "blue",
			shadowBlur: 30,
			shadowOffset: new paper.Point(0, 0)
		}
		designer.animation_handler.add(function(event){
			var t = Math.sin(event.count/5); //[-1, 1]
			t += 1; //[0, 2];
			t /= 2; //[0, 1];
			term.shadowColor.alpha = t;
		}, duration);
	},
	addTerminals: function(){
		var b = this.path.bounds;
		this.terminals = {};
		console.log("TERM", this.path.className);
		// console.log(this.name, b);
		padding = 4;
		lpos = b.leftCenter.clone();
		lpos.x += 5/2 + padding;

		rpos = b.rightCenter.clone();
		rpos.x -= 5/2 + padding;

		tpos = b.topCenter.clone();
		tpos.y += 5/2 + padding;

		bpos = b.bottomCenter.clone();
		bpos.y -= 5/2 + padding;

		if(this.t_config.indexOf('w') != -1){
			

			var c = this.paper.Path.Circle({
				fillColor: "red", 
				radius: 16, 
				position: b.center, 
				name: "terminal",
				polarity: 1,
				direction: 'w',
				parent: this.path
			});
			rect_pos = b.topCenter.clone();
			rect_pos.y -=2;
			rect_pos.x -=5;
			var r = this.paper.Path.Rectangle({
				point: rect_pos, 
				fillColor: "blue", 
				size: new paper.Size(30, 50)
			});
			this.terminals['w'] = c.subtract(r);
			this.terminals['w'].name =  "terminal";
			this.terminals['w'].polarity =  1;
			this.terminals['w'].direction =  'w';
			this.terminals['w'].parent =  this.path;
			r.remove();
			c.remove();

		}
		if(this.t_config.indexOf('e') != -1){
			// this.terminals['e']  = this.paper.Path.Circle({
			// 	fillColor: "#333333", 
			// 	radius: 5, 
			// 	position: rpos, 
			// 	name: "terminal", 
			// 	polarity: 0,
			// 	direction: 'e',
			// 	parent: this.path
			// });

			var c = this.paper.Path.Circle({
				fillColor: "#333333", 
				radius: 16, 
				position: b.center, 
				name: "terminal",
				polarity: 0,
				direction: 'e',
				parent: this.path
			});
			rect_pos = b.topCenter.clone();
			rect_pos.y -= 2;
			rect_pos.x -= 25;
			var r = this.paper.Path.Rectangle({
				point: rect_pos, 
				fillColor: "blue", 
				size: new paper.Size(30, 50)
			});
			this.terminals['e'] = c.subtract(r);
			this.terminals['e'].name =  "terminal";
			this.terminals['e'].polarity =  0;
			this.terminals['e'].direction =  'e';
			this.terminals['e'].parent =  this.path;

			r.remove();
			c.remove();

		}
		if(this.t_config.indexOf('s') != -1){
			bpos.x -= 20/2;
			bpos.y -= 8/2;
			this.terminals['s']  = this.paper.Path.Rectangle({
				fillColor: "red", 
				size: new paper.Size(20, 8),
				point: bpos, 
				name: "terminal", 
				polarity: 1, 
				direction: 's',
				parent: this.path
			});
		}
		if(this.t_config.indexOf('n') != -1){
			tpos.y += 7/2;
			this.terminals['n']  = this.paper.Path.RegularPolygon({
				fillColor: "#333333", 
				radius: 7, 
				sides: 3,
				center: tpos, 
				name: "terminal", 
				polarity: 0,
				direction: 'n',
				parent: this.path
			});
		}
	}, 
	duplicate: function(){
		var p = this.path.clone();
		var wp = new CanvasItem(paper, p);
		wp.material = this.material;
		wp.reflect_x = this.reflect_x;
		wp.reflect_y = this.reflect_y;
		wp.path.id = 47;
		wp.path.position.x +=5;
		wp.update();
		return wp;
	},
	reflect_x: function(){
		this.ref_x != this.ref_x;
		this.path.scaling.x *= -1;
		this.paper.view.update();
	},
	reflect_y: function(){
		this.ref_y != this.ref_y;
		this.path.scaling.y *= -1;
		this.paper.view.update();
	},
	remove: function(){
		this.path.remove();
		this.selection_rectangle.remove();
	},
	initSelectionRectangle: function() {
	    var b = this.path.bounds.clone().expand(10, 10);
	    selectionRectangle = new paper.Path.Rectangle(b);
	    
	   	selectionRectangle.position = b.center.clone();
	 
	    selectionRectangle.pivot = selectionRectangle.position;
	    selectionRectangle.insert(2, new paper.Point(b.center.x, b.top));
	    selectionRectangle.insert(2, new paper.Point(b.center.x, b.top-25));
	    selectionRectangle.insert(2, new paper.Point(b.center.x, b.top));
	    selectionRectangle.strokeWidth = 1;
	    selectionRectangle.strokeColor = '#00A8E1';
	    selectionRectangle.name = "selection rectangle";
	    selectionRectangle.selected = true;
	    selectionRectangle.ppath = this.path;
	    selectionRectangle.item = this;
	    selectionRectangle.ppath.pivot = selectionRectangle.pivot;
	   	selectionRectangle.remove();


		selectionRectangle.position = this.path.bounds.center.clone();
				
        this.init_size = new paper.Point(b.left, b.bottom).subtract(b.center).length;
        selectionRectangle.applyMatrix = true;
	
	    return selectionRectangle;
	}, 
	updateHandles: function(){
		this.selection_rectangle.remove()
		this.selection_rectangle = this.initSelectionRectangle();
	}
}

function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
}


