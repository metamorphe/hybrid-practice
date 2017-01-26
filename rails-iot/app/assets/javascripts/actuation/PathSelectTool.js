function PathSelectTool(){
	var tool = new paper.Tool();

	tool.name = "PathSelectTool";
	tool.short_name = "PATH-SELECT";
	tool.instructions = "Draw a line on the canvas. Elements will be selected by how close they are to the line, in the order the line was drawn. Decide on a name below and save your selection.";
	tool.fields = '<div class="input-group"> \
       <input type="text" class="form-control" placeholder="selector name"/>\
       <span class="input-group-btn">\
        <button class="btn btn-primary" type="button">SAVE</button>\
      </span>\
    </div>';
    tool.visuals = [];
    tool.path = null;

    tool.cleanup = function(){
    	CanvasUtil.call(tool.visuals, 'remove');
    	tool.visuals = [];
		tool.path = null;
    }
    tool.onMouseDown = function(event){  
		CanvasUtil.call(tool.visuals, 'remove');
		tool.visuals = [];
		tool.path = null;
       
       tool.path = new paper.Path.Line({
        strokeColor: "yellow", 
        strokeWidth: 3, 
        from: event.point,
        to: event.point,
      });
      var c = new paper.Path.Circle({
        fillColor: "red", 
        position: event.point, 
        radius: 5
      });
      tool.visuals.push(tool.path);
      tool.visuals.push(c);
    }
    tool.onMouseDrag = function(event){
       tool.path.lastSegment.remove();
       tool.path.addSegment(event.point);
    }
    tool.onMouseUp = function(event){
      var c = new paper.Path.Circle({
        fillColor: "blue", 
        position: event.point, 
        radius: 5
      });
      tool.visuals.push(c);
      tool.path.addSegment(event.point);
    }

   return tool;
}

