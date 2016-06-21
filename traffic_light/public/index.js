'use strict';

/**
 * TODO: add description
 */
var tSvgs = [];

var ws;
const baseUrl = 'localhost:3000'
const componentTreeDom = '.component-tree'
function TrafficLightSVG(svg){
	this.svg = svg;
}

function Util() {

}

TrafficLightSVG.prototype = {
  /* Fields */
  topName: null,
  tNonLeds: [],
  tIntLeds: [],
  tPlanes: [],
  tLayers: [],

  /* 'Public' Methods */
  /**
   * Given a jQuery selector for a single element,
   * prints linked elements this SVG to the element.
   */
  makeComponentTree: function(classString) {
    var topHtml, layersHtml, intLedsHtml, nonLedsHtml, planesHtml;
    topHtml = '<h4>' + this.topName + '</h4>'
    $(classString).append('<h4>' + this.topName + '</h4>');
    $(classString).append('<h5>Interactive LEDs</h5>');
    $.each(this.tIntLeds, function(idx, obj) {
      $(classString).append('<li>' + obj.name.slice(5) + '</li>')
    });
    $(classString).append('<h5>Non-Interactive LEDs</h5>');
    $.each(this.tNonLeds, function(idx, obj) {
      $(classString).append('<li>' + obj.name.slice(5) + '</li>')
    });
    $(classString).append('<h5>Planes</h5>');
    $.each(this.tPlanes, function(idx, obj) {
      $(classString).append('<li>' + obj.name.slice(5) + '</li>')
    });
    $(classString).append('<h5>Layers</h5>');
    $.each(this.tLayers, function(idx, obj) {
      $(classString).append('<li>' + obj.name.slice(5) + '</li>')
    });
  },

  /* 'Private' Methods */
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

/**
 * Imports the SVG and breaks it down by components and
 * places the components in a tSVG object.
 * The
 * Wraps Paper.js's import function.
 */
Util.importSVG = function(svgPath) {
  project.importSVG(svgPath, function(item) {
    // tSVG = new TrafficLightSVG(item);
    var newTSvg = new TrafficLightSVG(item);
    tSvgs.push(newTSvg);

    // Remove the LAYE: tag by slicing
    var topName = item.name.slice(5);
    newTSvg.topName = topName;
    console.log("Importing", topName);
    $('.svg-title').text(topName);

    var tNonLeds, tIntLeds, tPlanes, tLayers;
    tNonLeds = newTSvg.match(paper.project, {prefix:['NLED']});
    tIntLeds = newTSvg.match(paper.project, {prefix:['ILED']});
    tPlanes = newTSvg.match(paper.project, {prefix:['PLAN']});
    tLayers = newTSvg.match(paper.project, {prefix:['LAYE']});
    newTSvg.tNonLeds = tNonLeds;
    newTSvg.tIntLeds = tIntLeds;
    newTSvg.tPlanes = tPlanes;
    newTSvg.tLayers = tLayers;

    // Write the component tree to the DOM
    newTSvg.makeComponentTree(componentTreeDom);
  });
}

Util.queryElements = function(svgNum, type) {
  var svg, elements;
  switch(type) {
    case 'nonLed':
      svg = tSvgs[svgNum];
      elements = svg.tNonLeds;
      $.each(elements, function(idx, obj) {
        obj.strokeColor = 'red';
      });
      break;
    case 'intLed':
      svg = tSvgs[svgNum];
      elements = svg.tIntLeds;
      $.each(elements, function(idx, obj) {
        obj.strokeColor = 'red';
      });
      break;
    case 'plane':
      svg = tSvgs[svgNum];
      elements = svg.tPlanes;
      $.each(elements, function(idx, obj) {
        obj.strokeColor = 'red';
      });
      break;
    case 'layer':
      svg = tSvgs[svgNum];
      elements = svg.tLayers;
      $.each(elements, function(idx, obj) {
        obj.strokeColor = 'red';
      });
      break;
    default:
      console.log('Unrecognized type. Must be "nonLed", \
                    "intLed", "plane", or "layer".')
      elements = null;
      break;
  }
  return elements;
}

// MAIN
$(document).ready(function() {
  paper.install(window);
  // Setup directly from canvas id:
	paper.setup('myCanvas');
	// // Import SVG
  // Util.importSVG('img/traffic_light.svg');

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

  // Giving functionality to the SVG Uploader
  $('.svg-upload-btn').on('click', function() {
    var val = $('.svg-upload').val();
    if (val) {
      // Split the fake path and grab just the filename
      var pathArr = val.split('\\');
      Util.importSVG('img/' + pathArr[pathArr.length - 1]);
    }
  });

  // Binding 'Send' buttons to respective LEDs on the canvas
  $('#button-t2-l1').on('click', function() {
    var val = $('#picker-t2-l1').val();
		var valRgb = Util.hex2rgb(val).join(",");
    console.log(val);
    tSvgs[0].tIntLeds[0].fillColor = val;
		ws.send('c,0,' + valRgb + '\n');
  })

  $('#button-t2-l2').on('click', function() {
    var val = $('#picker-t2-l2').val();
		var valRgb = Util.hex2rgb(val).join(",");
    console.log(val);
    tSvgs[0].tIntLeds[1].fillColor = val;
		ws.send('c,1,' + valRgb + '\n');
  })

  $('#button-t2-l3').on('click', function() {
    var val = $('#picker-t2-l3').val();
		var valRgb = Util.hex2rgb(val).join(",");
    console.log(val);
    tSvgs[0].tIntLeds[2].fillColor = val;
		ws.send('c,2,' + valRgb + '\n');
  })
});
