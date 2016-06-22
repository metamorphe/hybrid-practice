'use strict';

/**
 * TODO: add description
 */
var tSvgs = [];

var ws;
var selectedItem;
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
	},
  getIthComponent: function(prefix, ith){
    return this.match(this.svg, {prefix: prefix})[ith];
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
    var topName = item.name.slice(4);
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

Util.queryElements = function(svgNum, prefix) {
  var svg, elements;
	svg = tSvgs[svgNum];
	// elements = svg.tNonLeds;
	elements = svg.match(paper.project, {prefix:[prefix]});
	return elements;
}

/**
 * Given an SVG with SVG_NUM which contains exactly one bus (prefix: 'CP')
 * containing all the LEDs, ORDER_LEDS returns an array of two arrays, i.e.:
 * >>> [allLedsSorted, interactiveLedsSorted]
 * where allLedsSorted contains an ordered list of all leds, interactive
 * and non-interactive leds, on the bus, which have been assigned a
 * LID fields based on their ordering. interactiveLedsSorted contains
 * a list of interactiveLeds only, with CID fields based on their ordering.
 * Thus, the fields are as follows:
 * cid: capacitative id (only interactive leds), undefined for nLeds.
 * lid: light id (all leds)
 *
 * Returns: an array containing two arrays, of the form:
 * >>> [allLedsSorted, interactiveLedsSorted]
 */
Util.orderLeds = function(svgNum) {
	var nLeds = Util.queryElements(svgNum, 'NLED');
	var iLeds = Util.queryElements(svgNum, 'ILED');
	var cp = Util.queryElements(svgNum, 'CP')[0];
	var allLeds = nLeds.concat(iLeds);

	// Determine the 'polarity' of the path, i.e. ensure
	// that if the start of the path begins near the breakout
	// (prefix: 'bo'), then we account for it in the offsetting
	var bo = Util.queryElements(svgNum, 'BO')[0];
	var bi = Util.queryElements(svgNum, 'BI')[0];
	var cpStartPoint = cp.segments[0].point;
	var polarity = cpStartPoint.getDistance(bi.position)
									< cpStartPoint.getDistance(bo.position)
									? 1 : -1;

	// Note that we cannot guarantee that an LED will lie exactly
	// on the medial axis of the bus/copper path, so we find the
	// nearest point on the bus to calculate the bus offset
	var nearestCpPoint;
	$.each(allLeds, function(idx, obj) {
		nearestCpPoint = cp.getNearestPoint(obj.position);
		obj.lOffset = polarity *  cp.getOffsetOf(nearestCpPoint);
	});
	allLeds = _.sortBy(allLeds, 'lOffset');
	$.each(allLeds, function (idx, obj) {
		obj.lid = idx;
	});

	$.each(iLeds, function(idx, obj) {
		nearestCpPoint = cp.getNearestPoint(obj.position);
		obj.cOffset = polarity * cp.getOffsetOf(nearestCpPoint);
	});
	iLeds = _.sortBy(iLeds, 'cOffset');
	$.each(iLeds, function (idx, obj) {
		obj.cid = idx;
	});
	return [allLeds, iLeds];
}

// MAIN
$(document).ready(function() {
	$('#myCanvas').attr('width', $('#myCanvas').parent().width());
	$('#myCanvas').attr('height', $('#myCanvas').parent().height());
  paper.install(window);
  // Setup directly from canvas id:
	paper.setup('myCanvas');
	// // Import SVG
  Util.importSVG('img/nine-segment.svg');

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
    var val = $('.color-picker').val();
		var valRgb = Util.hex2rgb(val).join(",");
    console.log(val);
		//TODO: deal with having multiple LEDs
		var id = selectedItem.name.slice(5)
    tSvgs[0].tIntLeds[id].fillColor = val;
		ws.send('c,' + id + ',' + valRgb + '\n');
  })

  /* Paper overhead */
  var hitOptions = {
      segments: true,
      stroke: true,
      fill: true,
      tolerance: 0
  };

  var colorTool = new Tool();
	colorTool.updateColor = function(event) {
		var hitResult = project.hitTest(event.point, hitOptions);
		if (!hitResult) {
			return;
		}
		var item = hitResult.item;
		var prefix = TrafficLightSVG.getPrefix(item);
		if (prefix == 'ILED' || prefix == 'NLED') {
			hitResult.item.fillColor = $('.color-picker').val();
			selectedItem = hitResult.item;
		}
	}
	colorTool.onMouseUp = function(event) {
		colorTool.updateColor(event);
	}
  colorTool.onMouseDrag = function(event) {
		colorTool.updateColor(event);
  }

	var panTool = new Tool();
	panTool.onMouseDrag = function(event) {
  	_.each(paper.project.layers, function(el, i, arr){
    	el.position.x += event.delta.x;
      el.position.y += event.delta.y;
      paper.view.update();
    });
  }

	$('.dcc-btn').on('click', function() {
		colorTool.activate();
	});
	$('.pan-btn').on('click', function() {
		panTool.activate();
	});

	$('.plus-zoom-btn').on('click', function() {
		paper.view.zoom += 0.3;
	});

	$('.minus-zoom-btn').on('click', function() {
		paper.view.zoom -= 0.3;
	});
});
