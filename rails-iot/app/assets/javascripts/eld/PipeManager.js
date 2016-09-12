

function PipeManager(container){
  this.container = container;
  this.state = true;
  this.init();
  this.view = "GLOBAL";
}

PipeManager.prototype = {
   init: function(){
    var scope = this;
    $('#view-icon').click(function(){
      if(scope.state) scope.hide();
      else scope.show();
    });
    $('#view-list ul li').click(function(){
      $('#view-icon').html($(this).children('button').html());
      $('#view-list ul li').removeClass('active');
      $(this).addClass('active');
      $('#view-icon').attr('class', $(this).children('button').attr('class')).removeClass('view').removeClass("btn-sm").addClass('pull-right');
      scope.view = $(this).children('button').attr('name');
      scope.update();
    });
    // populate SELECT
    var els = _.map(files, function(el, i, arr){
      var dom =  $('<option></options>').html(el.title.toUpperCase())
      .attr('value', el.path + el.filename);
      if(el.filename == DEFAULT_PIPE_FILE) dom.attr('selected', true);
      return dom;
    });
    $('#file-select').html(els);
  },
  getCurrentView: function(){
    return this.view.toLowerCase();
  },
  update: function(){
    var view = this.getCurrentView();  
    paper.project.clear();
    paper.view.zoom = 1;
    paper.view.update();

    console.log('RUNNING SCRIPT', view)  
    display = new Artwork($('#file-select').val(), function(artwork){
      var e = Pipeline.getElements(artwork);
      Pipeline.script[view](artwork, e);
    });

    paper.view.update();
  },
  show: function(now){
    if(this.state) return;
    this.state = true;
    if(now){$("#view-list").show(); return;}
    $("#view-list").toggle("slide", { direction: "up" }, 300);
  },
  hide: function(now){
    if(!this.state) return;
    this.state = false;
    if(now){$("#view-list").hide(); return;}
    $("#view-list").toggle("slide", { direction: "up" }, 300);
  }
}