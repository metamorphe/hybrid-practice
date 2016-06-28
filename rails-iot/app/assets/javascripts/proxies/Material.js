function Materials(dom){

	this.dom = dom;

	this.collection = {};
	var scope = this;
	_.each(this.dom, function(el, i, arr){
		var componentType = $(el).data("component-type");
		scope.collection[componentType] = _.map($(el).children(), function(component, key, arr){
			var properties = {};
			var data_properties = _.filter(component.attributes, function(e, j, arr2){
				return e.name.indexOf("data") == 0;
			});	
			var data_properties = _.each(data_properties, function(e, j, arr2){
				var s = e.name.split('-');
				s = s.splice(1)
				var key = s[0];
				var secondary_key = s.slice(1).join("_").replace("-", "_");
				
				if(secondary_key == "") properties[key] = e.value;
				else{
					if(!(key in properties)) properties[key] = {};
					properties[key][secondary_key] = e.value;
					properties["component_type"] = componentType;
				}
			});
			return new Material(properties);
		});
	});
}


Materials.prototype = {
	at: function(type, i){
		return this.collection[type][i];
	}, 
	find: function(other){
		for(var type in this.collection){
			for(var i in this.collection[type]){
				if(this.collection[type][i].equals(other))
					return i;
			}
			return -1;
		}
	}
}

function Material(properties){
	for(key in properties)
		this[key] = properties[key];
}
Material.prototype = {
	getStyle: function(){
		return {
			strokeColor: this.style.strokecolor,
			strokeWidth: 2, 
			shadowColor: new paper.Color(0.2, 0.2, 0.2), 
			shadowBlur:  2, 
			shadowOffset: new paper.Point(1, 1), 
			strokeCap: 'round', 
			dashArray: eval(this.style.dasharray)
		};
	}, 
	equals: function(m){
		return m.id == this.id;
	}
}

Material.detectMaterial =  function(path){
	var s = path.style;
	var properties = {style: {}};
	properties.style.strokecolor = s.strokeColor;
	return new Material(properties);
}