// Allows for querying scene graph elements using prefix annotation
//    LEDS --> obj.query({prefix:['NLED']});
//    Interactive LEDS --> obj.query({prefix:['ILED']});
//    Breakout --> obj.query({prefix:['BO']});
//    Breakin --> obj.query({prefix:['BI']});
//    Breakin --> obj.queryPrefix("BI");

function Artwork(svgPath, loadFN, isComponent){
	this.svgPath = svgPath;
	this.svg = null;
	this.isComponent = _.isUndefined(isComponent);
	if(loadFN != "")
		this.import(loadFN);
}

Artwork.prototype = {
	/**
	 * Returns an arrays of strings, where each string is the name
	 * of a queryable object, prefix included.
	 */
	remove: function(){
		this.svg.remove();
	},
	clone: function(){
		art = new Artwork(this.svgPath, "", this.isComponent);
		art.svg = this.svg.clone();
		art.svg.self = this;
		return art;
	},
	queryable: function(){
		return _.map(this.query({}), function(el){
			return el.name;
		});
	},
	import:  function(loadFN) {
			var scope = this;
			console.log("Importing", this.svgPath, paper)
		 	paper.project.importSVG(this.svgPath, function(item) {
	 		scope.svg = item;
	 		scope.svg.position = paper.view.center;
	 		var name = scope.svg.name;
		    console.log("Importing", name);
		    scope.self = scope;
		    // if(scope.isComponent){
				// var ledLists = scope.orderLeds();
				// scope.allLeds = ledLists[0];
				// scope.iLeds = ledLists[1];
			// }
		    loadFN(scope);
		});
	},
	query: function(selector){
		// Prefix extension
		if("prefix" in selector){
			var prefixes = selector["prefix"];

			selector["name"] = function(item){
				var p = Artwork.getPrefixItem(item);
				return prefixes.indexOf(p) != -1;
			}
			delete selector["prefix"];
		}
		return this.svg.getItems(selector);
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
		console.log("Ordering!");
		var nLeds = this.queryPrefix('NLED');
		var iLeds = this.queryPrefix('ILED');
		var cp = this.queryPrefix('CP')[0];
		var allLeds = nLeds.concat(iLeds);

		// Determine the 'polarity' of the path, i.e. ensure
		// that if the start of the path begins near the breakout
		// (prefix: 'bo'), then we account for it in the offsetting
		var bo = this.queryPrefix('BO');
		var bi = this.queryPrefix('BI');

		if (bi.length == 0) {
			throw Error('No breakin in artwork');
		}
		if (bo.length == 0) {
			polarity = 1;
		}
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
	}
}
Artwork.getPrefix = function(item){
	if(_.isUndefined(item.name)) return "";
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
