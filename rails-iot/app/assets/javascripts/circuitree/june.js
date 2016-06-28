function JunePlayground(container){
  this.paper = paper;
  this.container = container;
  this.init();
  this.update();

}

JunePlayground.prototype = {
  init: function(){
    // setups paperjs 
    var c = this.container;
    this.canvas = DOM.tag("canvas")
        .prop('resize', true)
        .height(c.height())
        .width(c.width());

    c.append(this.canvas);  

    this.paper = new paper.PaperScope();
    this.paper.setup(this.canvas[0]);
    this.height = this.paper.view.size.height;
    this.width = this.paper.view.size.width;
    this.paper.view.zoom = 1.5; 
    var scope = this; 

    // this.toolbox = new Toolbox(this.paper, $("#toolbox"));  
    // this.toolbox.add("junetool", $('#june-tool'),  new JuneTool(this.paper));
        
    return this;
  },
  update: function(){
    if(typeof this.paper == "undefined") return;
    paper.view.update();
  },

  clear: function(){
    this.paper.project.clear();
    this.update();
  },
  addSVG: function(filename, position, callback){
    
    var scope = this;
    var fileType = filename.split('/');
    fileType = fileType[fileType.length - 1];
    fileType = fileType.split('_');
    fileType = fileType[0].toLowerCase();
    console.log("filename", fileType, filename);
    this.paper.project.importSVG(filename, {
        onLoad: function(item) { 
          if(fileType == "artwork"){
            scope.art_layer.add(item);
            CircuitDesigner.retainGroup(item, position, callback, scope);
            item.sendToBack();
          }
        }
    });
  },
  loadJSON: function(json, callback){
    var scope = this;

    var item = this.paper.project.importJSON(json); 
    var layer = item[0].children[0];  
    console.log("Loading json", layer);
    // if valid JSON
    if(!_.isUndefined(layer) && !_.isUndefined(layer.children)){  
        CircuitDesigner.decomposeImport(layer, paper.view.center, callback, scope);
    } else{
      console.log('No layer detected!');
    }

      scope.update();
  },
  
  save: function(){
    var s = Math.floor(Date.now() / 1000);
    var timestamp_key = "saveevent_" + s;
    console.log("Timestamp", timestamp_key);
    storage.set(timestamp_key, JigExporter.export(this.paper, this.canvas, JigExporter.JSON, false));
    this.current_save = s;
  }
  
}