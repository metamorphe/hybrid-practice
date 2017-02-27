 function initTimeSignals(collection){ 
    console.info("Initializing time signals");
    return _.map(collection, function(canvas, i){
      var dom = $(canvas);

      var p =  Utility.paperSetup(dom);
      var data = eval(dom.attr('data'));
      var ts = new TimeSignal(data);
      
      $(canvas).parents('datasignal').data('time-signal-id', ts.id);

      fill = ts.signal_fill({
        fillColor: "#FF9912"
      });

      x = ts.signal({
        strokeWidth: 3, 
        strokeColor: "#333"
      });

      axes = ts.draw_axes({
        strokeWidth: 2, 
        strokeColor: "blue", 
        opacity: 0.5
      });

      paper.view.update();
      ts.paper = p;
      return ts;
    });
  }

  function initActuators(collection){
     console.info("Initializing actuators");
    return _.map(collection, function(canvas, i){
      var dom = $(canvas);
      var p =  Utility.paperSetup(dom);
      var type = dom.attr('type');
      var Act = eval(type + "_Simulator");
      var props = _.extend(eval(type), {paper: p, dom: dom});
      return actuator = new Act(props);
     
      
    //   paper.view.update();
      
      // return paper;
    });
  }