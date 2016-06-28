// StatsController

StatsController.mm2_per_hr = 3922;
StatsController.wall_buffer_mm = 12;
StatsController.paths_per_hr = 40;

function StatsController(design){
	this.design = design;
   console.log(design);
	this.print_time = "5hr 30min";
	this.make_time = "15min";
	this.bom = {};
	this.bom_length = "2.5m";
	this.initDOM();
}

StatsController.prototype = {
   initDOM: function(){
   	   this.dom = {
   	   	 make_time: StatsController.DOM.find("#make-time"),
   	   	 print_time: StatsController.DOM.find("#print-time"),
   	   	 bom_length: StatsController.DOM.find("#bom-length"),
   	   	 calculate: StatsController.DOM.find("#calculate-stats")
   	   }
   	   var scope = this;
   	   this.dom.calculate.click(function(){
   	   	  scope.calculate().updateDOM();
   	   });
   	   this.updateDOM();
   	   return this;
   },
   updateDOM: function(){
   		this.dom.make_time.html(this.make_time);
   		this.dom.print_time.html(this.print_time);
   		this.dom.bom_length.html(this.bom_length);
   		return this;
   }, 
   calculate: function(){
      var b = designer.nodes.bounds().bounds;
		this.bom_length = Ruler.pts2mm(this.design.nodes.totalLength()).toFixed(2) + " mm";
   		var print_time = (
   							(Ruler.pts2mm(b.height) + StatsController.wall_buffer_mm) * 
   						  	(Ruler.pts2mm(b.width)  + StatsController.wall_buffer_mm) /
	   						StatsController.mm2_per_hr
	   					 );
   		this.print_time = StatsController.prettyTime(print_time);
   		this.make_time = StatsController.prettyTime(this.design.nodes.length() / StatsController.paths_per_hr)
   		return this;
   }
}

StatsController.prettyTime = function(v){
	console.log(v);
	return parseInt(v) + " hr " + ((v - parseInt(v))* 60).toFixed(0) + " min";
}