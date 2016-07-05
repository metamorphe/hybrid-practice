function ButtonExporter(dom, type, preFN, postFN){
    this.type = type;
    this.dom = dom;
    if(_.isNull(preFN) || _.isUndefined(preFN)) preFN = function(){};
    if(_.isNull(postFN) || _.isUndefined(postFN)) postFN = function(){};
    this.preFN = preFN;
    this.postFN = postFN;
    this.init();
  }
  ButtonExporter.prototype = {
    init: function(){
      var scope = this;
      if(this.type == "PNG")
        $(this.dom).click(function(){
          scope.preFN();
          var fn = scope.getFilename();
          ButtonExporter.exportPNG(fn, scope.dom);
          scope.postFN();
        })
      else if(this.type == "SVG")
        $(this.dom).click(function(){
          scope.preFN();
          var fn = scope.getFilename();
          ButtonExporter.exportSVG(fn);
          scope.postFN();
        })
    }, 
    getFilename:  function(){
      var filename = $('#export-filename').val();
      filename = filename == "" ? "Untitled" : filename;
      filename += "_" + $(this.dom).attr('name');
      return filename;
    }
  }


  ButtonExporter.exportPNG = function(filename, dom){
      console.log("Exporting PNG...", filename);
      dom.attr('href', $('#myCanvas')[0].toDataURL("image/png"))
             .attr('download', filename + '.png');
  }

  ButtonExporter.exportSVG = function(filename){
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