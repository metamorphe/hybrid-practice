const BIAS = 2;
function ButtonExporter(dom, type, preFN, postFN){
    this.type = type;
    this.dom = dom;
    if(_.isNull(preFN) || _.isUndefined(preFN)) preFN = function(){};
    if(_.isNull(postFN) || _.isUndefined(postFN)) postFN = function(){};
    this.preFN = preFN;
    this.postFN = postFN;
    this.init();
  }
  var display;
  ButtonExporter.prototype = {
    init: function(){
      var scope = this;
      if(this.type == "PNG")
        $(this.dom).click(function(){
          paper.project.clear();
          paper.view.update();

          display = new Artwork(getActiveArtwork(), function(artwork){
            result = scope.preFN(artwork);
            // result.remove();
            console.log("FINAL DIMENSIONS", 
              Ruler.pts2mm(result.bounds.width), "mm x", 
              Ruler.pts2mm(result.bounds.height), "mm x", 
              Ruler.pts2mm(result.model_height), "mm"
            );
                      
            var fn = scope.getFilename();
            ButtonExporter.exportPNG(result, fn, scope.dom);
           
          })
        })
      else if(this.type == "SVG")
        $(this.dom).click(function(){
          paper.project.clear();
          paper.view.update();
          
          display = new Artwork(getActiveArtwork(), function(artwork){
            scope.preFN(artwork);
            var fn = scope.getFilename();
            ButtonExporter.exportSVG(fn);
            scope.postFN();
          });
        })
    }, 
    getFilename:  function(){
      var filename = $('#export-filename').val();
      filename = filename == "" ? "Untitled" : filename;
      filename += "_" + $(this.dom).attr('name');
      return filename;
    }
  }

  var resultR = "";
  ButtonExporter.exportPNG = function(result, filename, dom){
      paper.view.zoom = 1;
      console.log("Exporting PNG...", filename);
     
      result.fitBounds(paper.view.bounds.expand(-100));
     
      result.position =  paper.project.view.projectToView(new paper.Point(result.strokeBounds.width/2.0, result.strokeBounds.height/2.0));
      cut =  paper.project.view.projectToView(new paper.Point(result.strokeBounds.width * BIAS, result.strokeBounds.height * BIAS));
      // result.position.x -= 6;
      paper.view.update();
      bufferCanvas = copyCanvasRegionToBuffer($('#myCanvas')[0], 0, 0, cut.x, cut.y );
      dom.attr('href', bufferCanvas.toDataURL("image/png"))
              .attr('download', filename + '.png');
      // dom.attr('href', $('#myCanvas')[0].toDataURL("image/png"))
             // .attr('download', filename + '.png');
  }

  ButtonExporter.exportSVG = function(filename){
    console.log("Exporting SVG...", filename);
    var prev_zoom = paper.view.zoom;
    paper.view.zoom = 1;
    paper.view.update();

    leds = CanvasUtil.queryPrefix("NLED");
    _.each(leds, function(led){
       led.name = "NLED:_" + JSON.stringify(_.pick(led, "colorID", "target", "forceTarget"));
    });

    exp = paper.project.exportSVG({ 
      asString: true,
      precision: 5
    });
    saveAs(new Blob([exp], {type:"application/svg+xml"}), filename + ".svg");

    paper.view.zoom = prev_zoom;
    paper.view.update();
  }

function copyCanvasRegionToBuffer( canvas, x, y, w, h, bufferCanvas ){
  // console.log("CREATING CANVAS", bufferCanvas);
  if (!bufferCanvas) bufferCanvas = document.createElement('canvas');
  bufferCanvas.width  = w;
  bufferCanvas.height = h;
  bufferCanvas.getContext('2d').drawImage( canvas, x, y, w, h, 0, 0, w, h );
  return bufferCanvas;
}