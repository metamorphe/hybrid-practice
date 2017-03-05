function BurstSelectTool(){
	var tool = new paper.Tool();

	tool.name = "BurstSelectTool";
	tool.short_name = "BURST-SELECT";
	tool.instructions = "Pick an epicenter, drag out to define the range of burst. Elements will be selected by how close they are to the epicenter. Decide on a name below and save your selection.";
	tool.fields = `<div class="input-group"> 
       <input id="block-name" type="text" class="form-control" placeholder="selector name"/>
       <span class="input-group-btn">
        <button class="btn btn-primary" type="button" id="make-block">SAVE</button>
      </span>
    </div>`;
  tool.visuals = [];
  tool.path = null;

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
  	CanvasUtil.call(tool.visuals, 'remove');
  	tool.visuals = [];
	  tool.path = null;
    $('#make-block').unbind('click');
  }

  tool.onMouseDown = function(event){  
		CanvasUtil.call(_.compact(tool.visuals), 'remove');
		tool.visuals = [];
		tool.path = null;
       
     tool.path = new paper.Path.Line({
      strokeColor: "yellow", 
      strokeWidth: 3, 
      from: event.point,
      to: event.point,
    });
    tool.epicenter = new paper.Path.Circle({
      fillColor: "red", 
      position: event.point, 
      radius: 5
    });
    tool.blast = new paper.Path({
      opacity: 0.5,
      fillColor: "#00A8E1", 
      closed: true,
      segments: [event.point], 
    });
    tool.end = new paper.Path.Circle({
      fillColor: "blue", 
      position: event.point, 
      radius: 5
    });

    tool.visuals.push(tool.epicenter);
    tool.visuals.push(tool.path);
    tool.visuals.push(tool.blast);
    tool.visuals.push(tool.end);
  }
  tool.onMouseDrag = function(event){
     // tool.blast.remove();
     tool.blast.addSegment(event.point);
     tool.end.position = event.point;
     
     
     tool.path.lastSegment.remove();
     tool.path.addSegment(event.point);
     // tool.visuals.push(tool.blast);

     tool.path.bringToFront();
     tool.epicenter.bringToFront();
     tool.end.bringToFront();
  }
  tool.onMouseUp = function(event){
    tool.path.addSegment(event.point);
    tool.blast.closePath();
  }

  return tool;
}

