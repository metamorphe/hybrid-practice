
var Stepper = {
				render: true,
				parameters: {
					angle: _.extend(_.clone(v180_actuator), {name: "angle", render: false}),
	   			}
			  }
			  
function Stepper_Simulator(op){
	this.name = "Stepper"
	this.op = op;
	this.visuals = [];
	this.parameters = _.mapObject(this.op.parameters, function(actuator){ return new ActuationParam(actuator);});
	this.init();
}

Stepper_Simulator.prototype = {
	init: function(){
		console.info("Making", this.name);
		if(this.op.render) this.makeVisuals();		
	},
	toCommand: function(){
		var v = this.value;
		return "\t" + this.name + ".set("+ v.toFixed(0) + ");\n";
	},
	makeVisuals: function(){
		var base = new paper.Path.Rectangle({
			name: "BASE: emit",
	        position: paper.view.center,
	        size: [16, 32], 
	        fillColor: "#00A8E1", 
	        shadowColor: new Color(0, 0, 0),
		    // Set the shadow blur radius to 12:
		    shadowBlur: 6,
		    // Offset the shadow by { x: 5, y: 5 }
		    shadowOffset: new Point(1, 1)
	    });
	
	    var arm = new paper.Path.Line({
	    	name: "ARM: emit",
	        from: base.position.clone(),
	        to: base.position.clone().add(new paper.Point(0, -20)),
	        strokeWidth: 4, 
	        strokeColor: "#DDDDDD",
	        // Set the shadow color of the circle to RGB black:
		    shadowColor: new Color(0, 0, 0),
		    // Set the shadow blur radius to 12:
		    shadowBlur: 12,
		    // Offset the shadow by { x: 5, y: 5 }
		    shadowOffset: new Point(5, 5)
	    });
	    var decor = new paper.Path.Circle({
	    	name: "DECOR: emit",
	        position: base.position,
	        radius: 3, 
	        fillColor: "#333333"
	    });

	    arm.set({
	    	pivot: arm.firstSegment.point.clone()
	    });
			
		this.visuals.push(decor);
		this.visuals.push(base);
		this.visuals.push(arm);
	},
	get param(){ return this.parameters.angle.param; },
	get value(){ return this.parameters.angle.value; },
	set param(x){ this.parameters.angle.param = x; },	
	set value(x){ 
		if(typeof x == "object"){
			if(x.angle) this.parameters.angle.param = x.angle;
		}
		else{
			this.parameters.angle.value = x; 
		}
		var scope = this;
		var arm = CanvasUtil.queryPrefix("ARM")[0];
		var base = CanvasUtil.queryPrefix("BASE")[0];

			// var theta = arm.rotation;
			// var dTheta = theta - scope.parameters.angle.value;
			// arm.rotate(dTheta, arm.pivot);
			// console.log(arm.rotation, dTheta, scope.parameters.angle.value);
			var theta = new paper.Point(0, -20);
			theta.angle = -(180 - scope.parameters.angle.value);
			arm.remove();
			var arm = new paper.Path.Line({
		    	name: "ARM: emit",
		        from: base.position.clone(),
		        to: base.position.clone().add(theta),
		        strokeWidth: 4, 
		        strokeColor: "#DDDDDD",
		        // Set the shadow color of the circle to RGB black:
			    shadowColor: new Color(0, 0, 0),
			    // Set the shadow blur radius to 12:
			    shadowBlur: 12,
			    // Offset the shadow by { x: 5, y: 5 }
			    shadowOffset: new Point(5, 5)
		    });
	
		paper.view.update();
	}
}