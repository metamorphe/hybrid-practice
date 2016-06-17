var test;

var tSVG = null;
function TrafficLightSVG(svg){
	this.svg = svg;
}

TrafficLightSVG.prototype = {
	match: function(collection, match){
		// Prefix extension
		if("prefix" in match){
			var prefixes = match["prefix"];

			match["name"] = function(item){
				var p = TrafficLightSVG.getPrefixItem(item);
				return prefixes.indexOf(p) != -1;
			}
			delete match["prefix"];
		}
		return collection.getItems(match);
	},
	select: function(match){
		return this.match(this.svg, match);
	}
}

TrafficLightSVG.get = function(match){
	return TrafficLightSVG.match(paper.project, match);
}
TrafficLightSVG.match = function(collection, match){
	if("prefix" in match){
		var prefixes = match["prefix"];

		match["name"] = function(item){
			var p = TrafficLightSVG.getPrefixItem(item);
			return prefixes.indexOf(p) != -1;
		}
		delete match["prefix"];
	}
	return collection.getItems(match);
}

TrafficLightSVG.getPrefixItem = function(item){
	if(_.isUndefined(item)) return "";
	if(item.split(":").length < 2) return "";
	return item.split(":")[0].trim();
}

TrafficLightSVG.getPrefix = function(item){
	if(_.isUndefined(item)) return "";
	if(_.isUndefined(item.name)) return "";
	if(item.name.split(":").length < 2) return "";
	return item.name.split(":")[0].trim();
}

TrafficLightSVG.getName = function(item){
	if(_.isUndefined(item)) return "";
	if(_.isUndefined(item.name)) return "";
	if(item.name.split(":").length < 2) return "";
  return item.name.split(":")[1].trim();
}

// MAIN
$(document).ready(function() {
  paper.install(window);
  // Setup directly from canvas id:
	paper.setup('myCanvas');
	// var path = new Path();
	// path.strokeColor = 'black';
	// var start = new Point(100, 100);
	// path.moveTo(start);
	// path.lineTo(start.add([ 200, -50 ]));
	// view.draw();
  project.importSVG('img/traffic_light.svg', function(item) {
    tSVG = new TrafficLightSVG(item);
    console.log("Importing", item.name, item);

    // tLeds is the global that contains the LED elements
    tLeds = tSVG.match(paper.project, {prefix:['LED']})
  });

  // Binding 'Send' buttons to respective LEDs on the canvas
  $('#button-t2-l1').on('click', function() {
    var val = $('#picker-t2-l1').val();
    console.log(val);
    tLeds[0].fillColor = val;
  })

  $('#button-t2-l2').on('click', function() {
    var val = $('#picker-t2-l2').val();
    console.log(val);
    tLeds[1].fillColor = val;
  })

  $('#button-t2-l3').on('click', function() {
    var val = $('#picker-t2-l3').val();
    console.log(val);
    tLeds[2].fillColor = val;
  })
});
