CircuitDesigner.defaultTool = '#transform-tool'

function CircuitDesigner(container){
	this.paper = paper;
	this.container = container;
	this.circuit_layer = new CircuitLayer(paper);
	this.art_layer = new ArtworkLayer(paper);
	this.traces_layer = new TracesLayer(paper);
	console.log($(CircuitDesigner.defaultTool));
	$(CircuitDesigner.defaultTool).click();
	this.init();
	this.animations = [];
	this.update();
	var self = this;
	this.animation_handler = new AnimationHandler(paper);
}

CircuitDesigner.prototype = {
	init: function(){
		// setups paperjs 
		var c = this.container;
		this.canvas = DOM.tag("canvas")
				.prop('resize', true)
				.height(c.height())
				.width(c.width());

		c.append(this.canvas);	

		this.paper = new paper.PaperScope();
		this.paper.setup(this.canvas[0]);
		this.height = this.paper.view.size.height;
		this.width = this.paper.view.size.width;
		this.paper.view.zoom = 1.5;	
		var scope = this; 

		// Setups tools
	    this.toolbox = new Toolbox(this.paper, $("#toolbox"));	
	    this.toolbox.add("anchortool", $('#anchor-tool'), new AnchorPointTool(this.paper));
		// this.toolbox.add("pathtool", $('#path-tool'),  new TracePathTool(this.paper));
		this.toolbox.add("transformtool", $('#transform-tool'),  new TransformTool2(this.paper));
		this.toolbox.add("pantool", $('#pan-tool'),  new PanTool(this.paper));
		this.toolbox.add("canvaspantool", $('#canvas-pan-tool'),  new CanvasPanTool(this.paper));
		this.toolbox.add("teslatool", $('#tesla-tool'),  new TeslaTool(this.paper));
		// this.toolbox.add("runtool", $('#run-tool'),  new RunTool(this.paper));
		// this.toolbox.add("debugtool", $('#debug-tool'),  new DebugTool(this.paper));
		// this.toolbox.add("fabtool", $('#fab-tool'),  new FabTool(this.paper));
		
		// this.toolbox.enable("transformtool");
		return this;
	},
	update: function(){
		if(typeof this.paper == "undefined") return;
		paper.view.update();
	},

	clear: function(){
		this.paper.project.clear();
		this.update();
	},
	addSVG: function(filename, position, callback){
		console.log(filename, position);
		var scope = this;
		var fileType = filename.split('/');
		fileType = fileType[fileType.length - 1];
		fileType = fileType.split('_');
		fileType = fileType[0].toLowerCase();
		console.log("filename", fileType, filename);
		this.paper.project.importSVG(filename, {
	    	onLoad: function(item) { 
	    		console.log(fileType)
	    		if(fileType == "artwork" || fileType == "iot" || fileType == "floorplan"){
	    			console.log(item);
	    			scope.art_layer.add(item);
			    	CircuitDesigner.retainGroup(item, position, callback, scope);
			    	item.sendToBack();
	    		}
	    	}
		});
	},
	loadJSON: function(json, callback){
		var scope = this;

		var item = this.paper.project.importJSON(json); 
		var layer = item[0].children[0];	
		console.log("Loading json", layer);
		// if valid JSON
		if(!_.isUndefined(layer) && !_.isUndefined(layer.children)){  
	    	CircuitDesigner.decomposeImport(layer, paper.view.center, callback, scope);
		} else{
			console.log('No layer detected!');
		}

   		scope.update();
	},
	
	save: function(){
		this.toolbox.clearTool();
		var s = Math.floor(Date.now() / 1000);
		var timestamp_key = "saveevent_" + s;
		console.log("Timestamp", timestamp_key);
		storage.set(timestamp_key, JigExporter.export(this.paper, this.canvas, JigExporter.JSON, false));
		this.current_save = s;
	}
	
}
                 


CircuitDesigner.retainGroup = function(item, position, callback, scope){
	console.log("Retaining group", item.className);
	item.position = position;
	$(CircuitDesigner.defaultTool).click().focus();
}


CircuitDesigner.decomposeImport = function(item, position, callback, scope){
	
	if(_.isUndefined(position)) item.position = paper.view.center;
    else item.position = position;


	_.each(Utility.unpackChildren(item, []), function(value, key, arr){
		var path = value;
		// console.log(path.name);
		if(path.name == "trace"){ path.remove(); return; }
		else if(path.name == "sticker_led"){ 
			scope.circuit_layer.add(path, ['n', 's']);
		}
		else if(path.name == "battery"){ 
			scope.circuit_layer.add(path, ['e', 'w']);
		}
		else scope.circuit_layer.add(path);
	});

	$(CircuitDesigner.defaultTool).click().focus();
}



                                                              

