 function initTimeSignals(collection){ 
    console.info("Initializing time signals");
    return _.map(collection, function(canvas, i){
      var dom = $(canvas);
      var p =  Utility.paperSetup(dom);
      var data = eval(dom.attr('data'));
      var ts = new TimeSignal(data);
     
      fill = ts.signal_fill({
        fillColor: "#FF9912"
      });

      p = ts.signal({
        strokeWidth: 3, 
        strokeColor: "#333"
      });

      axes = ts.draw_axes({
        strokeWidth: 2, 
        strokeColor: "blue", 
        opacity: 0.5
      });

      paper.view.update();
      
      return paper;
    });
  }

  function initActuators(collection){
     console.info("Initializing actuators");
    return _.map(collection, function(canvas, i){
      var dom = $(canvas);
      var p =  Utility.paperSetup(dom);

      var Act = eval(dom.attr('type'));
      console.log(Act);
      var props = _.extend(RGB_LED, {paper: p, dom: dom});
      return actuator = new Act(props);
     
      
    //   paper.view.update();
      
      // return paper;
    });
  }