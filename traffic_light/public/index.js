'use strict';

var tSVG = null;
var ws, tLeds;
var baseUrl = 'localhost:3000'
function TrafficLightSVG(svg){
	this.svg = svg;
}

function Util() {

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

Util.hex2rgb = function(hex){
   var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
    ] : null;
}

// MAIN
$(document).ready(function() {
  paper.install(window);
  // Setup directly from canvas id:
	paper.setup('myCanvas');
	// Import SVG
  project.importSVG('img/traffic_light.svg', function(item) {
    tSVG = new TrafficLightSVG(item);
    console.log("Importing", item.name, item);

  // tLeds is the global that contains the LED elements
    tLeds = tSVG.match(paper.project, {prefix:['LED']})
  });

	// Open websocket connection
	ws = new WebSocket("ws://localhost:3015");
	ws.onopen = function() {
		console.log("CONNECTED!");
	};
	ws.onclose = function() {};
	ws.onmessage = function(evt) {
			if(evt.data){
				try{
					// console.log(evt.data);
				}
				catch(e){
					console.log("ERROR", e, evt.data);
				}
			}
	}

  // Binding 'Send' buttons to respective LEDs on the canvas
  $('#button-t2-l1').on('click', function() {
    var val = $('#picker-t2-l1').val();
		var valRgb = Util.hex2rgb(val).join(",");
    console.log(val);
    tLeds[0].fillColor = val;
		ws.send('c,0,' + valRgb + '\n');
  })

  $('#button-t2-l2').on('click', function() {
    var val = $('#picker-t2-l2').val();
		var valRgb = Util.hex2rgb(val).join(",");
    console.log(val);
    tLeds[1].fillColor = val;
		ws.send('c,1,' + valRgb + '\n');
  })

  $('#button-t2-l3').on('click', function() {
    var val = $('#picker-t2-l3').val();
		var valRgb = Util.hex2rgb(val).join(",");
    console.log(val);
    tLeds[2].fillColor = val;
		ws.send('c,2,' + valRgb + '\n');
  })
});
