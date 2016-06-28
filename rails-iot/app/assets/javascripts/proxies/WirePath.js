WirePath.termination = {
	NONE: 0, 
	EXTEND: 1,
	SPIRAL: 2, 
	COIL_LOOP: 3,
	SIMPLE_LOOP: 4
}
WirePath.weight_profile = {
	NONE: 0,
	UNIFORM: 1, 
	TAPERED: 2,
	UNITAPERED: 3
}

WirePath.baseMaterial = new Material({style: {color: "#000000"}});


function WirePath(paper, path){
	this.id = path.id;
	
	this.path = path;
	this.path.applyMatrix = true;
	if(!_.isUndefined(this.path.parent)){
		this.path.parent.applyMatrix = true;
	}
	this.name = path.name;

	this.paper = paper;
	
	this.material = WirePath.baseMaterial;
	this.init_bounds = path.bounds.clone().expand(10, 10);
	
	this.selection_rectangle = this.initSelectionRectangle(); 
	this.selection_rectangle.applyMatrix = true;
	this.update();
	this.initDOM();
	this.ref_x = false;
	this.ref_y = false;
	// this.addTerminals();
}
WirePath.COIL_LOOP_WIDTH = 2;
WirePath.prototype = {
	addTerminals: function(){
		var b = this.path.bounds;
		// console.log(this.name, b);
		var left = this.paper.Path.Circle({
			fillColor: "red", 
			radius: 5, 
			position: b.leftCenter, 
			name: "terminal"
		});
		var right = this.paper.Path.Circle({
			fillColor: "black", 
			radius: 5, 
			position: b.rightCenter, 
			name: "terminal"
		});
		this.terminals = [left, right];
	}, 
	duplicate: function(){
		var p = this.path.clone();
		var wp = new WirePath(paper, p);
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
	update: function(){
		var style = this.material.getStyle();
		this.path.style = style;
		
		this.paper.view.update();
		return this;
	},
	initDOM: function(){
		this.dom = {
			materials : WirePath.DOM.find(".materials")
		}
	},
	updateDOM: function(){
		var area = this.path.length / this.path.style.strokeWidth;
		var resistor = Fluke.calculateResistanceFromArea(this.material, area);

		dim.set(resistor.resistance, NaN, NaN);
		var mat_idx = materials.find(this.material);
		console.log("MAT ID", mat_idx, this.material.component_type);
		if(mat_idx == -1) mat_idx = 0;
		if(_.isUndefined(this.material.component_type)) this.material.component_type = "trace";
		var m = this.dom.materials
							.filter("[data-component-type='"+ this.material.component_type +"']")
							.val(mat_idx);

		return this;
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
	    selectionRectangle.wire = this;
	    selectionRectangle.ppath.pivot = selectionRectangle.pivot;
	   	selectionRectangle.remove();


		selectionRectangle.position = this.path.bounds.center.clone();
				
        this.init_size = new paper.Point(b.left, b.bottom).subtract(b.center).length;
	    return selectionRectangle;
	}, 
	updateHandles: function(){
		this.selection_rectangle.remove()
		this.selection_rectangle = this.initSelectionRectangle();
	}
}




