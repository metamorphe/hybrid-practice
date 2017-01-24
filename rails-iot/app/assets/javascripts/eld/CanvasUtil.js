// Allows for querying scene graph elements using prefix annotation
//    LEDS --> obj.query({prefix:['NLED']});
//    Interactive LEDS --> obj.query({prefix:['ILED']});
//    Breakout --> obj.query({prefix:['BO']});
//    Breakin --> obj.query({prefix:['BI']});
//    Breakin --> obj.queryPrefix("BI");

function CanvasUtil() {}
CanvasUtil.import = function(filename, options){
	var extension = filename.split('.');
	extension = extension[extension.length - 1];

	if(extension == "svg"){
	 	paper.project.importSVG(filename, function(item) {
	 		item.set(options);
		});
	}
 	else{
		console.log("IMPLEMENTATION JSON IMPORT");
	}
}
CanvasUtil.getDiffusers = function(led){
    var diffs = CanvasUtil.queryPrefix('DDS');
    diffs = _.filter(diffs, function(diff){
      return diff.contains(led.position);
    });
    return diffs;
}
CanvasUtil.getMediums =  function(){
	var reflectors = CanvasUtil.queryPrefix("REF");
    var lenses = CanvasUtil.queryPrefix("LENS");
    var diffusers = CanvasUtil.queryPrefix("DIFF");
    
    _.each(diffusers, function(el){
    	el.optic_type = "diffuser" 
    	el.reflectance = 0.3;
    	el.refraction = 0.8;
    	// el.probability = 0.5;
    	name = Artwork.getName(el).split("_")[1];
        name = name.split("_")[0];
        el.n = parseFloat(name);
    });
    _.each(reflectors, function(el){ 
    	el.optic_type = "reflector" 
    	el.reflectance = 0.9;
    });
    _.each(lenses, function(el){
    	el.optic_type = "lens" 
        el.refraction = 0.80;
        name = Artwork.getName(el).split("_")[1];
        name = name.split("_")[0];
        el.n = parseFloat(name);
    });
 	return  _.flatten([lenses,reflectors,diffusers]);
 }
CanvasUtil.export = function(filename){
	console.log("Exporting SVG...", filename);
    var prev_zoom = paper.view.zoom;
    paper.view.zoom = 1;
    paper.view.update();

    exp = paper.project.exportSVG({ 
      asString: true,
      precision: 5
    });
    saveAs(new Blob([exp], {type:"application/svg+xml"}), filename + ".svg");

    paper.view.zoom = prev_zoom;
    paper.view.update();
}

CanvasUtil.fitToViewWithZoom = function(element, bounds, position){
	position = position || paper.view.center;
	var scaleX = element.bounds.width / bounds.width;
	var scaleY = element.bounds.height / bounds.height;
	var scale = _.max([scaleX, scaleY]);
	console.log("SET ZOOM TO", scale);
	paper.view.zoom = 1.0/scale;
	paper.view.center = position;
}

CanvasUtil.getIDs = function(arr){
	return _.chain(arr).map(function(el){
		return CanvasUtil.query(paper.project, {id: el});
	}).flatten().compact().value();
}
CanvasUtil.getIntersections = function(el, collection){
	var hits = _.map(collection, function(c){
		return c.getIntersections(el);
	});
	hits = _.compact(hits);
	hits = _.flatten(hits);
	return hits;
}



CanvasUtil.query = function(container, selector){
	// Prefix extension
	if ("prefix" in selector){
		var prefixes = selector["prefix"];

		selector["name"] = function(item){
			var p = CanvasUtil.getPrefixItem(item);
			return prefixes.indexOf(p) != -1;
		}
		delete selector["prefix"];
	}
	else if ("pname" in selector){
		var prefixes = selector["pname"];

		selector["name"] = function(item){
			var p = CanvasUtil.getNameItem(item);
			return prefixes.indexOf(p) != -1;
		}
		delete selector["pname"];
	}


	var elements = container.getItems(selector);
	elements = _.map(elements, function(el, i, arr){
		if(el.className == "Shape"){
			nel = el.toPath(true);
			el.remove();
			return nel;
		}
			
		else return el;
	});
	return elements;
}

CanvasUtil.queryName = function(selector){
   return CanvasUtil.query(paper.project, {pname: [selector]});
}

CanvasUtil.queryPrefix = function(selector) {
	return CanvasUtil.query(paper.project, {prefix: [selector]});
}

CanvasUtil.queryIDs = function(selector) {
	return _.map(selector, function(id){
		return CanvasUtil.queryID(id);
	})
}

CanvasUtil.queryID = function(selector) {
	var result = CanvasUtil.query(paper.project, {id: selector})
	return result.length == 0 ? null : result[0];
}

CanvasUtil.queryPrefixWithId = function(selector, id) {
	return _.where(CanvasUtil.queryPrefix(selector),
					{lid: id});
}

CanvasUtil.set = function(arr, property, value){
	if(typeof(property) == "object"){
		_.each(arr, function(el){
			for(k in property){
				value = property[k];
				el[k] = value;
			}
		});
	}
	else
	_.each(arr, function(el){
	  el[property] = value;
	});
}


CanvasUtil.call = function(collection, calling){
	_.each(collection, function(rt){
	  rt[calling]();
	});
}
        



CanvasUtil.getPrefix = function(item){
	if(_.isUndefined(item)) return "";
	if(_.isUndefined(item.name)) return "";
	// if(item.name.split(":").length < 2) return "";
	if(item.name.split(":").length < 2) return "";
	return item.name.split(":")[0].trim();
}

CanvasUtil.getPrefixItem = function(item){
	if(_.isUndefined(item)) return "";
	if(_.isNull(item)) return "";
	if(item.split(":").length < 2) return "";
	return item.split(":")[0].trim();
}


CanvasUtil.getName = function(item){
	if(_.isUndefined(item)) return "";
	if(_.isUndefined(item.name)) return "";
	if(item.name.split(":").length < 2) return "";
  	return item.name.split(":")[1].trim();
}

CanvasUtil.getNameItem = function(item){
	if(_.isUndefined(item)) return "";
	if(item.split(":").length < 2) return "";
  	return item.split(":")[1].trim();
}