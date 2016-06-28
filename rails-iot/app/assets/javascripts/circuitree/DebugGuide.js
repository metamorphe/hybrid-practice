function DebugGuide(dom){
	this.dom = dom;
	this.hide();
}

DebugGuide.prototype = {
	show: function() {
		this.dom.show();
	}, 
	hide: function() {
		this.dom.hide();
	}
}