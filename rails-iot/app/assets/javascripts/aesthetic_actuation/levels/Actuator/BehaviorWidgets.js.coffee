
class window.ChoreographyWidget extends Widget
  @SESSION_COUNTER: 0
  @ACTUATORS: ()-> Artwork.ACTUATORS()
  @NORMAL_SELECT = (path)->
    name = CanvasUtil.getPrefix path
    path.set
      strokeColor: "yellow"
      strokeWidth: 1
      shadowColor: "#00A8E1"
      shadowBlur: 5
 
  @STYLE_PARAMS = (path)->
    # styles = ["fillColor", "strokeWidth", "strokeColor", "shadowColor", "shadowOffset", "shadowBlur"]
    # return _.object(_.map styles, (s)-> [s, path[s]])
    style = 
      strokeColor: "black"
      strokeWidth: 1
      shadowColor: "#00A8E1"
      shadowBlur: 0
    return style
  constructor: (op)->
    scope = this
    _.extend this, op
    @ps = new PerceptualScheduler(@paper)
    @dark = false
    @mode = "selection"
    @prev_selected = {id: -1}
    @prev_mode = "choreography"
    @chor_trigger = $('#add-arrows')
    @chor_clear = $('#remove-arrows')
    # @selection_trigger = $('#selection-tool')

    $('#view-order').click ()->
      s = Choreography.selected()
      if s
        s.view_order()

    # @selection_trigger.click ()->
      # scope.mode = "selection"
      # scope.update()
    # @chor_trigger.click ()->
    #   scope.mode = "choreography"
    #   scope.update()
    @chor_clear.click ()->
      if scope.mode != "choreography"
        Alerter.warn
          strong: "WHOOPS!"
          msg: "We aren't in choreography mode. Hit the arrow button above to begin."
          delay: 2000
          color: 'alert-danger'
        return
      # scope.paper.tool.clearSession()
      CanvasUtil.setStyle ChoreographyWidget.ACTUATORS(), 
        color: "white"


    
    @buffer = {}
    @canvas = @dom.find('canvas')
    window.paper = @paper
    @toggleLights()
   
    @canvas.hover ()-> 
      window.paper = scope.paper
    @update()
    
  update: ()->
    # if @mode == "choreography"
# 
      # @paper.tool = @tools.choreography

    #   s = Choreography.selected()
    #   console.log "CHOREO MODE", s.id, @prev_selected.id
    #   if s and @prev_selected.id != s.id
    #     # NEW CHOREO
    #     # @prev_selected.form = {ids: @paper.tool.clearSession()}
    #     @prev_selected = s
    #     # @paper.tool.loadSession(s.form.ids)
    #     s.view_order()
    #   else
    #     # @paper.tool.loadSession(s.form.ids)
    #   $('button.choreo').addClass('btn-success')
    #   # @selection_trigger.removeClass('btn-success')
    #   $('#remove-arrows').prop('disabled', false)
    # if @mode == "selection"
    #   s = Choreography.selected()
    #   # if s and @paper.tool.clearSession
    #     # s.form = {ids: @paper.tool.clearSession()}
    #   # BUTTON UPDATES

    #   $('.popover.choreography').popover('hide')
    #   $('choreography').removeClass('selected')
    #   $('#remove-arrows').prop('disabled', true)
    #   $('button.choreo').removeClass('btn-success')
     
      # @paper.tool = @tools.selection

      # @chor_trigger.removeClass('btn-success')
      # @selection_trigger.addClass('btn-success')
      # @last_session = if @paper.tool.clearSession then @paper.tool.clearSession()
      # console.log "SAVING CHOREO TO ", @active
      # if @active then @active.data('ids', @last_session)
     

  deselect_all: ->
    scope = this
    flagged = CanvasUtil.query(paper.project, {flag: true})
     #DESELECT ALL
    _.each flagged, (el)->
      el.set scope.buffer[el.id]
      el.flag = false
       
  select: (ids)->
    # scope = this
    # window.paper = @paper
    # elements = CanvasUtil.getIDs(ids)
    # flagged = CanvasUtil.query(paper.project, {flag: true})

    # @deselect_all()
    # _.each elements, (el)->
    #   if not el.flag
    #     style = ChoreographyWidget.STYLE_PARAMS(el)
    #     scope.buffer[el.id] = style
    #     ChoreographyWidget.NORMAL_SELECT(el)
    #     el.flag = true
  setBGColor: (bg)->
    @canvas.css('background-color', bg)
    c = new paper.Color(bg)
    if c.brightness < 0.5 #dark bg
      $('#project-view-settings').addClass('light').removeClass('dark')
      $('#projectviewer').addClass('light').removeClass('dark')
    else
      $('#project-view-settings').removeClass('light').addClass('dark')
      $('#projectviewer').removeClass('light').addClass('dark')
  getBGColor: ()->
    return @canvas.css('background-color')
  toggleLights: ()->   
    @dark = not @dark
    if @dark
      @canvas.css('background', "#111111")
    else
      @canvas.css('background', "#f5f4f0")
    
    diffs = CanvasUtil.queryPrefix('DIF')
    CanvasUtil.set diffs, 'opacity', 0
  
  extractDistanceMetric: ()->
    return @extractDistanceMetricTheta()
    # return @extractDistanceMetricFromCenter()
  extractDistanceMetricTheta: ()->
    window.paper = @paper 
    c = new paper.Path.Circle
      fillColor: "red"
      radius: 5
      position: paper.view.center
    actuators = ChoreographyWidget.ACTUATORS()
    dist = _.map actuators, (actuator)->
      hid: actuator.lid
      distance: actuator.position.clone().subtract(c.position).angle
    return @normalize(dist)

  extractDistanceMetricFromCenter: ()->
    window.paper = @paper 
    c = new paper.Path.Circle
      fillColor: "red"
      radius: 5
      position: paper.view.center
    actuators = ChoreographyWidget.ACTUATORS()
    dist = _.map actuators, (actuator)->
      hid: actuator.lid
      distance: c.position.getDistance(actuator.position)
    return @normalize(dist)
  normalize: (dist)->
    min = (_.min dist, (d)-> d.distance).distance
    max = (_.max dist, (d)-> d.distance).distance
    range = max - min
    dist = _.each dist, (d)-> 
      d.distance = (d.distance - min)/range
    dist = _.map dist, (d)-> [d.hid, d.distance]
    dist = _.object(dist)
    return dist
  @ARROW_COLOR: new paper.Color("#00A8E1")
