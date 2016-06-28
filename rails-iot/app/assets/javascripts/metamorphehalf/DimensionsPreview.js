function DimensionsPreview(container){
	this.container = container;
	this.dom = $("<ul></ul>");
	this.h = DimensionsPreview.list_dom("res:");
	this.w = DimensionsPreview.list_dom("amps:");
	this.d = DimensionsPreview.list_dom("volt:");
	this.dom.append([this.h, this.w, this.d]);

	$(this.dom).css({
		position: "absolute", 
		// border: "1px solid #00A8E1", 
		top: 0, 
		left: 0, 
		margin: 5,
		padding: 0,
		"z-index": 100, 
		cursor: "default"
	}).appendTo(container);
}
DimensionsPreview.list_dom = function(label){
	var label = DimensionsPreview.format(label, -8)
	var list_elem = $('<li class="list-group-item"><span name="label">'+ label +'</span><span name="value"></span></li>');
	list_elem.css({
		padding: "2px 3px",
		"font-size": "0.8em",
		"font-family": "monospace"
	});
	return list_elem
};

DimensionsPreview.prototype = {
	set: function(h, w, d){
		this.h.find("span[name='value']").html(DimensionsPreview.format(h.toFixed(2)+" ohm", -15));
		this.w.find("span[name='value']").html(DimensionsPreview.format(w.toFixed(2)+" amp", -15));
		this.d.find("span[name='value']").html(DimensionsPreview.format(d.toFixed(2)+" vol", -15));
	}
}

DimensionsPreview.format = function(val, length){
	var whitespace = Array(256).join(' ');
	var string = (whitespace + val).slice(length); 
	return string.replace(/ /g, "&nbsp;");
}