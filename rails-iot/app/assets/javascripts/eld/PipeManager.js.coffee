class window.PipeManager
  constructor: (container) ->
    @container = container
    @state = true
    @init()
    @view = 'GLOBAL'
    return

PipeManager.prototype =
  init: ->
    scope = this
    $('#view-icon').click ->
      if scope.state then scope.hide() else scope.show()
      return
    $('#view-list ul li').click ->
      $('#view-icon').html $(this).children('button').html()
      $('#view-list ul li').removeClass 'active'
      $(this).addClass 'active'
      $('#view-icon').attr('class', $(this).children('button').attr('class')).removeClass('view').removeClass('btn-sm').addClass 'pull-right'
      scope.view = $(this).children('button').attr('name')
      scope.update()
      return
    return
  getCurrentView: ->
    @view.toLowerCase()
  update: ->
    view = @getCurrentView()
    paper.project.clear()
    paper.view.zoom = 1
    paper.view.update()
    console.log 'RUNNING SCRIPT', view
    fs.load (artwork)->
      console.log "LOADING ARTWORK"
      e = Pipeline.getElements(artwork)
      Pipeline.script[view] artwork, e
  
    # display = new Artwork($('#file-select').val(), (artwork) ->
    #   e = Pipeline.getElements(artwork)
    #   Pipeline.script[view] artwork, e
    #   return
    # )
    paper.view.update()
    return
  show: (now) ->
    if @state then return
    @state = true
    if now
      $('#view-list').show()
      return
    $('#view-list').toggle 'slide', { direction: 'up' }, 300
    return
  hide: (now) ->
    if !@state then return
    @state = false
    if now
      $('#view-list').hide()
      return
    $('#view-list').toggle 'slide', { direction: 'up' }, 300
    return
