DEFAULT_FILE = '/userstudy/examples/map.svg'

class window.FileManager2
  constructor: (@op) ->
    @open_file = @op.default
    if ws and ws.includes('FILE') then @open_file = ws.get('FILE')
    if @op.selector then @_setupSelector()
    @load @op.onLoad
    return
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
    console.log(@open_file)
    loadingFn = onLoad
    if ws then ws.set 'FILE', @open_file
    
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
      if onLoad then onLoad()
      # var r = new paper.Path.Rectangle({rectangle: artwork.bounds, selected: true})
      return
      loadingFn()
    )
    paper.view.update()
    if @op.status then @op.status.html @getName().toUpperCase()
    return
