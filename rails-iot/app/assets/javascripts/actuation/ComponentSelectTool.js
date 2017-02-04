function ComponentSelectTool(){
	var tool = new paper.Tool();

	tool.name = "ComponentSelectTool";
	tool.short_name = "COMPONENT-SELECT";
	tool.instructions = "Select individual elements on the canvas. Decide on a name below and save your selection.";
	
	tool.fields = `<div class="input-group"> 
       <input id="block-name" type="text" class="form-control" placeholder="selector name"/>
       <span class="input-group-btn">
        <button class="btn btn-primary" type="button" id="make-block">SAVE</button>
      </span>
    </div>`;
   // field logic
  	tool.bindings = function(){
	    console.log("BINDINGS", tool.short_name);
	    $('#make-block').click(function(){
	      var block_name = $('#block-name').val().replace(' ', '_');
	      block_name = block_name == "" ? 'untitled' : block_name;
	    
	      sm.makeBlock({
	        name: block_name, 
	        file: fm.getName(), 
	        type: "selector"
	      });
	    })
  	}

   tool.cleanup = function(){
    	sm.clear();
    	sm.update();
   }

	tool.onMouseDown = function(event){
		var leds = CanvasUtil.queryPrefix("NLED");
		var leds = _.filter(leds, function(led){
			return led.contains(event.point);
		});
		_.each(leds, function(led){
		  sm.ledAdd(led);
		});

		sm.update();
	}

   return tool;
}

