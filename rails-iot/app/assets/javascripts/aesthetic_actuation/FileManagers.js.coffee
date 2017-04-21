DEFAULT_FILE = '/userstudy/examples/map.svg'

class FileManager
  constructor: (@op) ->
    @setKey()
    @open_file = @op.default
    if ws and ws.includes(@key) then @open_file = ws.get(@key)
    if @op.selector then @_setupSelector()
    @load @op.onLoad
    return
  setKey: ->
    @key = 'FILE'
  getName: ->
    @open_file.split('/').pop().split('.')[0]
  _setupSelector: ()->
    console.info 'Init file selector', @op.files.length, 'files found.'
    scope = this
    # DOM SETUP
    options = _.map(@op.files, (file) ->
      dom = $('<option></options>').html(file.title.toUpperCase()).attr('value', file.path + file.name)
      if @open_file == file.path + file.name then dom.attr 'selected', true
      dom
    )
    $(@op.selector).html(options);

    # INTERACTIVITY
    $(@op.selector).on('change', ->
      file = $(this).val()
      scope.open_file = file
      scope.load scope.op.onLoad
      return
    ).val @open_file
    return
  load: (onLoad) ->
    console.warn "TODO: IMPLEMENT LOAD FOR", @constructor.name
class SVGFileManager extends FileManager
  load: (onLoad)->
    window.paper = @op.paper;
    loadingFn = onLoad
    if ws then ws.set @key, @open_file
    
    paper.project.clear()
    paper.view.zoom = 1
    paper.view.update()

    display = new Artwork(@open_file, (artwork) ->
      elds = CanvasUtil.queryPrefix('ELD')
      artwork = if elds.length > 0 then elds[0] else artwork.svg
      CanvasUtil.fitToViewWithZoom artwork, paper.view.bounds.expand(-20), paper.view.center
      # artwork.position.y += 20
      CanvasUtil.call CanvasUtil.queryPrefix('DDS'), 'bringToFront'
      CanvasUtil.call CanvasUtil.queryPrefix('NLED'), 'bringToFront'
      # vm = new ViewManager($('#views'))
      if onLoad then onLoad(artwork)
      # var r = new paper.Path.Rectangle({rectangle: artwork.bounds, selected: true})
      return
      loadingFn()
    )
    paper.view.update()
    if @op.status then @op.status.html @getName().toUpperCase()
    return
class window.StateMachineFileManager extends SVGFileManager
  setKey: ->
    @key = 'SM_FILE'
class window.ProjectFileManager extends SVGFileManager
  setKey: ->
    @key = 'PROJECT_FILE'
  
class window.BenchmarkFileManager extends FileManager
  setKey: ->
    @key = 'B_FILE'
  load: (onLoad)->
    console.log(@open_file)
    loadingFn = onLoad
    if ws then ws.set @key, @open_file
    

    $.ajax({
      url: @open_file, 
      dataType: "text",
      success: (data)-> 
        if(loadingFn) then loadingFn(data)
    })
   
    if @op.status then @op.status.html @getName().toUpperCase()
    return

