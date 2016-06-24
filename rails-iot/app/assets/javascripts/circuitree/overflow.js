	save_events = $.map(storage.keys(), function(el, i){
			flag = el.split('_')[0];
			time = parseInt(el.split('_')[1]);
			if(flag == "saveevent")
				return time;
		});	

	latest_event =  _.max(save_events);
	this.current_save = latest_event;



	redo: function(){
		this.toolbox.clearTool();
		var save_events = $.map(storage.keys(), function(el, i){
			flag = el.split('_')[0];
			time = parseInt(el.split('_')[1]);
			if(flag == "saveevent")
				return time;
		});	
		var scope = this;
		var rel_events = _.filter(save_events, function(t){
			return t > scope.current_save; 
		});
		// console.log(save_events, rel_events, this.current_save);
		
		if(_.isEmpty(rel_events)){ 
			console.log("Can't redo...");
			return;
		}
		this.clear();
		rel_event = _.min(rel_events);
		console.log("redoing", rel_event);
	
		this.loadJSON(storage.get('saveevent_' + rel_event));
		this.current_save = rel_event;
		

	},
	undo: function(){
		this.toolbox.clearTool();
		var save_events = $.map(storage.keys(), function(el, i){
			flag = el.split('_')[0];
			time = parseInt(el.split('_')[1]);
			if(flag == "saveevent")
				return time;
		});	
		var scope = this;
		var rel_events = _.filter(save_events, function(t){
			return t < scope.current_save; 
		});
		
		if(_.isEmpty(rel_events)){ 
			console.log("Can't undo...");
			return;
		}
		this.clear();
		rel_event = _.max(rel_events);

		// console.log("undoing", rel_event);
		
		this.loadJSON(storage.get('saveevent_' + rel_event));
		this.current_save = rel_event;
		

	}, 

	clear_history: function(){
		this.toolbox.clearTool();
		storage.clear();
		this.clear();
		this.save();
	},
	fast_forward: function(){
		this.toolbox.clearTool();
		save_events = $.map(storage.keys(), function(el, i){
			flag = el.split('_')[0];
			time = parseInt(el.split('_')[1]);
			if(flag == "saveevent")
				return time;
		});	

		if(_.isEmpty(save_events)){
			console.log("No save events to revert to...");
			return;
		}

		console.log("save events", save_events);
		last_event =  _.max(save_events);

		this.clear();
		console.log("loading json", last_event);

		this.loadJSON(storage.get('saveevent_' + last_event))
		this.current_save = last_event;
		
	}

	,
	revert: function(){
		this.toolbox.clearTool();
		save_events = $.map(storage.keys(), function(el, i){
			flag = el.split('_')[0];
			time = parseInt(el.split('_')[1]);
			if(flag == "saveevent")
				return time;
		});	

		if(_.isEmpty(save_events)){
			console.log("No save events to revert to...");
			return;
		}

		console.log("save events", save_events);
		last_event =  _.min(save_events);

		this.clear();
		console.log("loading json", last_event);

		this.loadJSON(storage.get('saveevent_' + last_event))
		this.current_save = last_event;
		
	}, 

	,
	importSVG: function(callback){
		var scope = this;
		console.log(scope);
		this.paper.project.importSVG(this.svg, {
	    	onLoad: function(item) { 
		    	scope.svgSym = item;
		    	paper.project.activeLayer.addChild(item);

		    	paper.view.update();
		    	item.position = paper.view.center;

    			scope.toolbox.tools.anchortool.toolholder.setSVG(item);
    			

    			_.each(Utility.unpackChildren(item, []), function(value, key, arr){
    				var w  = new WirePath(scope.paper, value);
    				w.path.name = scope.svg;
    				scope.nodes.add(w.id, w);
    			});

		    	scope.toolbox.tools.anchortool.toolholder.selectAll(false);
		    	// paper.tool = null;
		    	$('#transform-tool').click().focus();
	    }});
	},

	CircuitDesigner.decomposeImport = function(item, position, callback, scope){
	paper.project.activeLayer.addChild(item);
		   
	paper.view.update();
	if(_.isUndefined(position))
    	item.position = paper.view.center;
    else
    	item.position = position;

	scope.toolbox.tools.anchortool.toolholder.setSVG(item);

	_.each(Utility.unpackChildren(item, []), function(value, key, arr){
		var path = value;
		var mat = Material.detectMaterial(path);
		var w  = new WirePath(scope.paper, value);
		scope.nodes.add(w.id, w);
		w.material = mat;
		w.update();
		designer.activePath = w.id;
	});
	CircuitDesigner.defaultTool.click().focus();
}


<div class="btn-group pull-right" role="group">
        <%= button_tag :id=>"revert", :class=>"btn btn-md btn-default" do %>
          <span class="glyphicon glyphicon-refresh"></span>
        <% end %>
         <%= button_tag :id=>"undo", :class=>"btn btn-md btn-default" do %>
          <span class="glyphicon glyphicon-arrow-left"></span>
        <% end %>
         <%= button_tag :id=>"save-progress", :class=>"btn btn-md btn-default" do %>
          <span class="glyphicon glyphicon-floppy-disk"></span>
        <% end %>
         <%= button_tag :id=>"redo", :class=>"btn btn-md btn-default" do %>
          <span class="glyphicon glyphicon-arrow-right"></span>
        <% end %>
         <%= button_tag :id=>"fast-forward", :class=>"btn btn-md btn-default" do %>
          <span class="glyphicon glyphicon-repeat"></span>
        <% end %>
      </div>