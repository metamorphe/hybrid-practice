function ImagePreview(container, url){
	this.container = container;
	this.dom = new Image();
	this.dom.src = url;
	$(this.dom).css({
		position: "absolute", 
		width: 100,
		border: "1px solid #00A8E1", 
		top: 0, 
		left: 0, 
		margin: 5,
		// "margin-top": -100,
		"z-index": 100
	}).appendTo(container);

}
ImagePreview.prototype = {
	swap: function(url){
		this.dom.src = url;
	}
}
