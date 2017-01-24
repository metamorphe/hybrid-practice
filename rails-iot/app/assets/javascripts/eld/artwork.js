function Artwork(svgPath, loadFN, cloned){
	this.svgPath = svgPath;
	this.svg = null;

	if(_.isUndefined(cloned))
		this.import(loadFN);
}

Artwork.prototype = {
	/**
	 * Returns an arrays of strings, where each string is the name
	 * of a queryable object, prefix included.
	 */
	clone: function(){
		cl = new Artwork(this.svgPath, this.loadFN, true);
		cl.svg = this.svg.clone();
		return cl;
	},
	remove: function(){
		this.svg.remove();
	},
	queryable: function(){
		return _.map(this.query({}), function(el){
			return el.name;
		});
	},
	import:  function(loadFN) {
		var scope = this;
	 	paper.project.importSVG(this.svgPath, function(item) {
	 		 // console.log("Processing", item.name);
	 	
	 		scope.svg = item;
	 		scope.svg.position = paper.view.center;
 			// CanvasUtil.fitToViewWithZoom(scope.svg, paper.view.bounds.expand(-100))
        	// scope.svg.position.y -= 80;
        	// scope.svg.position.x += 100;
 			// metadata import
 			leds = scope.queryPrefix("NLED");
 			_.each(leds, function(led){
 				// console.log(led.name);
 				// if(led.name.indexOf("{") != -1){
 					// data = JSON.parse(led.name.split("_")[1]);
 					// led.target = 7;//data.target;
 					// if(data.forceTarget) led.forceTarget = 7;//data.forceTarget;
 					// led.colorID = new paper.Color(data.colorID[0], data.colorID[1], data.colorID[2]);
 					// led.fillColor = new paper.Color(data.colorID[0], data.colorID[1], data.colorID[2]);
 					// // led = _.extend(led, data);
 					// console.log("EXTEND", JSON.parse(led.name.split("_")[1]));
 					if(!paper.tool || !paper.tool.holder) return;
 					paper.tool.holder.makeLED(led.position, CanvasUtil.queryPrefix("DIF"));
 					// var nled =  new paper.Path.Rectangle({
	     //              name: "NLED: APA102C", 
	     //              size: new paper.Size(Ruler.mm2pts(LED_WIDTH), Ruler.mm2pts(LED_WIDTH)),
	     //              strokeColor: "black",
	     //              strokeWidth: 1, 
	     //              opacity: 1.0,
	     //              parent: CanvasUtil.queryPrefix("ELD")[0], 
	     //              position: led.position
	     //            });

	                led.remove();
	                // nled.fillColor = new paper.Color(data.colorID)
	                // nled.colorID = new paper.Color(data.colorID)
	                // nled.position = new paper.Point(data.position)
	                // nled.target = data.target;
	                // if(data.forceTarget) led.forceTarget = data.forceTarget;
	                // paper.tool.holder.addRays(diffs, led);

 				// }
 			});
			if(vm)
			vm.update();

	 		var ledLists = scope.orderLeds();
				// if(!_.isNull(ledLists)){
				// 	scope.allLeds = ledLists[0];
				// 	scope.iLeds = ledLists[1];
				// }
				// scope.setLedsOff();
		    loadFN(scope);
		});
	},
	query: function(selector){
		return CanvasUtil.query(this.svg, selector);
	},
	queryPrefix: function(selector){
		return this.query({prefix: [selector]});
	},
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
	orderLeds: function() {
		var nLeds = this.queryPrefix('NLED');
		var iLeds = this.queryPrefix('ILED');
		var cp = this.queryPrefix('CP');
		var allLeds = _.flatten([nLeds, iLeds]);

		// Determine the 'polarity' of the path, i.e. ensure
		// that if the start of the path begins near the breakout
		// (prefix: 'bo'), then we account for it in the offsetting
		
		if(_.isEmpty(cp)) return null;

		var bo = this.queryPrefix('BO');
		var bi = this.queryPrefix('BI');
		cp = cp[0];


		if (bi.length == 0) {console.log('No breakin in artwork');  return;}
		if (bo.length == 0) {polarity = 1;}
		else {
			bo = bo[0];
			bi = bi[0];
			var cpStartPoint = cp.segments[0].point;
			var polarity = cpStartPoint.getDistance(bi.position)
											< cpStartPoint.getDistance(bo.position)
											? 1 : -1;
		}


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
	},
	// setLedsOff: function() {
	// 	var leds = this.queryPrefix('NLED');
	// 	$.each(leds, function (idx, obj) {
	// 		obj.status = '↓';
	// 	});
	// },
	findLedWithId: function(id) {
		return _.findWhere(this.queryPrefix('NLED'),
						{lid: id});
	}
}

Artwork.getPrefix = function(item){
	if(_.isUndefined(item)) return "";
	if(_.isUndefined(item.name)) return "";
	// if(item.name.split(":").length < 2) return "";
	if(item.name.split(":").length < 2) return "";
	return item.name.split(":")[0].trim();
}


Artwork.getPrefixItem = function(item){
	if(_.isUndefined(item)) return "";
	if(item.split(":").length < 2) return "";
	return item.split(":")[0].trim();
}


Artwork.getName = function(item){
	if(_.isUndefined(item)) return "";
	if(_.isUndefined(item.name)) return "";
	if(item.name.split(":").length < 2) return "";
  return item.name.split(":")[1].trim();
}
