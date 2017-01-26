function ComponentSelectTool(){
	var tool = new paper.Tool();

	tool.name = "ComponentSelectTool";
	tool.short_name = "COMPONENT-SELECT";
	tool.instructions = "Select individual elements on the canvas. Decide on a name below and save your selection.";
	tool.fields = '<div class="input-group"> \
       <input type="text" class="form-control" placeholder="selector name"/>\
       <span class="input-group-btn">\
        <button class="btn btn-primary" type="button">SAVE</button>\
      </span>\
    </div>';

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

