function LinkBrush(paper) {
  this.paper = paper;
  this.name = "LinkBrush";
}

LinkBrush.prototype = {
	enable: function(){
	   var scope = this;
	},
	disable: function(){
	   var scope  = this;
	},
	update: function(){
		paper.view.update();
	},
	clear: function(){

	}
}
