function FabricationGuide(dom){
	this.dom = dom;
	this.hide();
}

FabricationGuide.prototype = {
	show: function() {
		this.dom.show();
	}, 
	hide: function() {
		this.dom.hide();
	}
}