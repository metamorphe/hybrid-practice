// Allows for querying scene graph elements using prefix annotation
//    LEDS --> obj.query({prefix:['NLED']});
//    Interactive LEDS --> obj.query({prefix:['ILED']});
//    Breakout --> obj.query({prefix:['BO']});
//    Breakin --> obj.query({prefix:['BI']});

function Artwork(svgPath){
	this.svgPath = svgPath;
	this.svg = null;
	this.import(this.svgPath);
}

Artwork.prototype = {
	queryable: function(){
		return _.map(this.query({}), function(el){
			return el.name;
		});
	},
	import:  function() {
			var scope = this;
			console.log("Importing", this.svgPath, paper)
		 	paper.project.importSVG(this.svgPath, function(item) {
	 		scope.svg = item;
	 		scope.svg.position = paper.view.center;
	 		var name = scope.svg.name;
		    console.log("Importing", name);
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
	}
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