class ProgramSynthesis
  constructor: (ops)->
    edit = ace.edit("editor");
    edit.setTheme("ace/theme/monokai")
    edit.session.setMode("ace/mode/c_cpp")
    edit.resize()
    @edit = edit
    edit.nl = (s)-> 
      s = s or ""
      edit.insert(s+"\n")
    edit.comment = (s)-> edit.nl("// "+s)
    edit.define = (name, val)-> edit.nl("#define "+name+" "+val)
    edit.glib = (s)-> edit.nl("#include <"+s+">")
    edit.func = (rtnval, name, params, content)->
      scope = this
      params = _.map params, (v, k)-> return v+" "+k
      this.nl("\n"+rtnval + " " + name + "(" + params.join(", ") + "){")
      _.each content, (s)->
        scope.nl("\t" + s)
      edit.nl("}")
    @synthesize()
  
  author_stamp: ()->
    scope = this
    options = 
      weekday: 'long'
      year: 'numeric'
      month: 'long'
      day: 'numeric'
      hour: 'numeric'
      minute: 'numeric'
    today = new Date()
    todayStr = today.toLocaleDateString "en-US", options  #Saturday, September 17, 2016
    @edit.nl("/*")
    @edit.nl("* STREAMING SKELETON: "+@config.name)
    @edit.nl("* "+todayStr)
    if @config.authors.length > 0
      @edit.nl("* Authors:")
      _.each @config.authors, (s)->
       scope.edit.nl("* - "+s)
    @edit.nl("*/")
    @edit.nl()
  system_configs: ()->
    scope = this
    @edit.comment("SYSTEM CONFIG")
    _.each @config.system, (v, k)->
      scope.edit.define(k, v)
    @edit.nl()
  libraries: ()->
    scope = this
    @edit.comment("LIBRARIES")
    _.each @config.global_libs, (lib)->
      scope.edit.glib(lib) 
    @edit.nl()
  global_var: ()->
    @edit.comment("GLOBAL VARS")
    @edit.nl("Probe probe(\""+@config.name+"\", Serial, BAUD);")
    @edit.nl()
  setup_struct: ()->
    scope = this
    content = [
      "Serial.begin(BAUD)"
      "// PIN CONFIG"
      _.map @config.pins, (value, name)-> return "pinMode("+name+", "+value+")"
      ""
      "// API REGISTER"
      _.map @config.api, (value, name)-> return "probe.add_api("+name+", "+value+")"
      "probe.begin();"
    ]
    content = _.flatten(content)

    @edit.func "void", "setup", {}, content
  loop_struct: ()->
    scope = this
    content = [
      "delay(100);"
      "probe.enable_api();"
    ]
    @edit.func "void", "loop", {}, content
  extract_config: ()->
    global_libs = _.map paper.project.getItems({data:{actuator: true}}), (act)->
      return eval(act.data.libs)
    obj = paper.project.getItems({})
    # name = if (obj[1].data and obj[1].data and obj[1].data.name) then obj[1].data.name else "API"
    
    @config =
      name: "API"
      authors: ["Cesar Torres"]
      global_libs: _.uniq(_.flatten [["Probe.h"], global_libs])
      system: 
        BAUD: 9600
      pins:
        MOTOR_SIGNAL: "OUTPUT"
      api: 
        a: "set_motor"
        b: "set_light"
  synthesize: ()->
    @extract_config()
    @author_stamp()
    @system_configs()
    @libraries()
    @global_var()
    @setup_struct()
    @loop_struct()



  

app = 
  name: "Annotator App"
  # file: "/LaunchControl.svg"
  # file: "/userstudy/examples/neopixel-24xring.svg"
  file: "/userstudy/examples/hungry_hippo_visualmanifest.svg"
  # file: "/actuation/devices/chevrons.svg"
  # file: "/actuation/aquarium_pumps.svg"
  filename: ()-> 
    x = @file.split('.')
    x = x[0].split('/')
    return x[x.length-1]
  defaultFillColor: ()->
    c = new paper.Color(245, 244, 240)
    c.brightness = 0.7
    c.alpha = 0.5
    return c
  initialize: ()->
    console.log "Initializing", @name
    @bindEvents()

   
  bindEvents: ()->
    scope = this
    $ -> 
      $('#metadata-panel').dialog
        autoOpen: false
      $('#metadata-panel-opener').click (e)->
        $('#metadata-panel').dialog("open")
      $('.actuator button').click (e)->
        file = $(this).parent('.actuator').attr('name').split(".")[0] + ".svg"
        paper.project.importSVG file, (svg)->
          console.log "Loading", svg
          svg.position = paper.view.center
      scope.onDocumentReady()
      $("#clear").click (e)-> 
        ws.remove(scope.filename())
        paper.project.clear()
      $("#save").click (e)-> scope.save(scope.filename(), "webstorage")
      $("#download").click (e)-> scope.save(scope.filename(), "disk")
      $('#shade').fadeOut()
      $("#quick-annotations button").click (e)->
        $(this).toggleClass('active')
      $('.note').click (e)->
        $(this).toggleClass('active')

      $('#tabs button').click (e)->
        goto = $(this).attr('goto')
        panels = $(this).parents('.dragpanel').find('.tab-content').hide().removeClass(".active")
        console.log panels.length
        $(goto).show().addClass('active')
        $('#tabs button.selected').removeClass('selected')
        $(this).addClass('selected')
      $('#tabs button.start').click()
      $('#zoom-in').click ()->
        paper.view.zoom += 0.1
      $('#zoom-out').click ()->
        paper.view.zoom -= 0.1
      
  onDocumentReady: ()->
    window.ws = new WebStorage()
    @jsonEditorInitialize()
    @paperLoad()
    $('#system-message.error').on 'mouseenter', (e)->
      $('li.error').addClass('mouseover')
    .on 'mouseleave', (e)->
      $('.mouseover').not('active').removeClass('mouseover')
    $('.dragpanel').draggable
      containment: "parent"
      handle: ".draghandle"
    .resizable
      handles: "n, e, s, w"
  paperLoad: ()->
    paper = window.Utility.paperSetup("annotator")
    paper.settings.handleSize = 8

    scope = this
    
    onsvgload = (svg)->
      console.log "IMPORTING", svg
      scope.svg = svg
      paper.view.update()
      tree = scope.extract_tree(svg, $("<ul>"))
      $('#svg-tree').append(tree)
      scope.validate(svg)
      svg.set
        position: paper.view.center
      svg.fitBounds(paper.view.bounds)
      svg.position = paper.view.center
      paper.tool = createSelectionTool()
    
    if ws.includes(@filename())
      console.log "Loading imported..."
      cache = ws.get(@filename())
      svg = paper.project.importJSON JSON.parse cache
      onsvgload(svg[0].children[0])
    else 
      console.log "Loading svg..."
      paper.project.importSVG @file, onsvgload
    scope.program = new ProgramSynthesis()
  
  validate: (svg)->
    $('#system-message').removeClass('error').removeClass("success")
    @json_validate(svg)
    errors = $(".error").length
    if errors > 0
      $('.success-alert').hide()
      $('.error-alert').show()
      $('#error-count').html(errors)
      $('#system-message').addClass('error')
    else
      $('.error-alert').hide()
      $('.success-alert').show()
      $('#system-message').addClass('success')


  json_validate: (svg)->
    scope = this
    try
      JSON.parse(svg.data)
      if svg.dom then svg.dom.removeClass("error")
    catch error
      if error instanceof SyntaxError and svg
        if not svg.errors then svg.errors = []
        svg.errors.push error
        if svg.dom then svg.dom.addClass("error")
    if svg.children
      _.each svg.children, (child)-> scope.validate(child)

  onJSONClick: (e)->
    if window.editor
      try
        json = JSON.parse($(this).html())
        window.editor.set json

        $('button.active').removeClass('active')
          
        _.each json, (v, k)->
          console.log '.attr-variable[name="'+k+'"]'
          $('.attr-variable[name="'+k+'"]').addClass('active')
          $('.' + k + "-value").val(v)
        if json["class"]
          classes = json["class"].split(' ')
          console.log "CLASSES", classes
          _.each classes, (c)->
            c = ".class-variable[name='" + c.trim() + "']"
            $(c).addClass('active')

      catch
        window.editor.set {class: ""}

    $(this).parent().toggleClass('active')
    if $(this).parent().hasClass('active') then $(this).parent().removeClass('mouseover')
    
    hit = paper.project.getItem({id: $(this).parent().data('paper-id')})
    hit.active = $(this).parent().hasClass('active')
    paper.tool.update()
    e.stopPropagation()
  processName: (item)->
    name = item.name
    if _.isUndefined(name) or _.isNull(name) then return JSON.stringify({})
    name = name.trim()
    name = name.replaceAll("_x5F_", "_")
    name = name.replaceAll("_x23_", "#")
    name = name.replaceAll("_x27_", "")
    name = name.replaceAll("_x22_", '"')
    name = name.replaceAll("_x7B_", '{')
    name = name.replaceAll("_x7D_", '}')
    name = name.replaceAll("_x5B_", '[')
    name = name.replaceAll("_x5D_", ']')
    name = name.replaceAll("_x2C_", ',')
    name = name.replaceAll("_", ' ')
    lastBracketIdx = name.lastIndexOf("}")
    if lastBracketIdx > -1 then name = name.slice(0, lastBracketIdx + 1)

  extract_tree: (svg, root)->
    scope = this
    @processName(svg)
   
    if svg and svg.className == "Shape" then svg = svg.replaceWith(svg.toPath())
    if svg and svg.className == "Path" and not svg.fillColor then svg.fillColor = @defaultFillColor()

    svg.set
      name: @processName(svg)
      active: false
    
    type = $('<b>').html(svg.className)
    data = $('<span>').addClass('json').html(JSON.stringify(svg.data)).click scope.onJSONClick
    svg.dom = $('<li>').append([type, data]).data('paper-id', svg.id)
      .addClass('uncollapsed')
      .click (e)->
        $(this).toggleClass('collapsed').toggleClass('uncollapsed').children("ul").toggle()
        e.stopPropagation()
      .on 'mouseenter', (e)->
        if $(this).hasClass('active') then return
        hit = paper.project.getItem({id: $(this).data('paper-id')})
        hit.selected = true
        e.stopPropagation()
        $(this).addClass('mouseover')
      .on 'mouseleave', (e)->
        $('.mouseover').not('active').removeClass('mouseover')
        items = paper.project.getItems({selected: true})
        _.each items, (item)->
          item.selected = false

    root.append(svg.dom)
    
    # if svg.errors then svg.dom.addClass("error")
    if not svg.children or svg.children.length == 0 then svg.dom.addClass('leaf') 
    else
      _.map svg.children, (child)->
        list = $("<ul>")
        svg.dom.append(list)
        scope.extract_tree(child, list)
    return root
  jsonEditorInitialize: ()->
    scope = this
    container = document.getElementById('jsoneditor')
    options = {}
    window.editor = new JSONEditor(container, options)
    json = 
      class: "boundary"
      id: 1
    editor.set json
    $("#savemetadata").click (e)->
      json = editor.get()

      # quick annotation
      # attributes = _.map $('.tab-content.active .attr-variable.active'), (attrVar)->
      #   return [$(attrVar).attr('name'), $(attrVar).parents('.input-group').find('input').val()]
      # classes = _.map $('.tab-content.active .class-variable.active'), (classVar)->
      #   return $(classVar).attr('name')
      # json = _.extend json, 
      #   class: classes.join(" ")
      # json = _.extend json, _.object attributes


      $('.active').children('.json').html(JSON.stringify(json))
      actives = $('.active').children('.json')
      _.each actives, (el)->
        id = $(el).parent().data('paper-id')
        svg = paper.project.getItem({id: id})
        svg.data = json
        svg.name = ""
        
      $('.active').children('.json').html(JSON.stringify(json))
      scope.validate(scope.svg)
  save: (filename="artwork", storage='webstorage')->
    prev_zoom = paper.view.zoom
    paper.view.zoom = 1

    items = paper.project.getItems({activestyle: true})
    console.log "Removed", items.length
    items =_.map items, (item)->
        item.remove()
    paper.view.update()

    switch storage
      when "webstorage"
        exp = paper.project.exportJSON
          asString: true
          precision: 5

        ws.set(filename, exp)
      when "disk"
        exp = paper.project.exportSVG
          asString: true
          precision: 5

        saveAs(new Blob([exp], {type:"application/svg+xml"}), filename + ".svg");
    
    paper.tool.init()
    paper.view.zoom = prev_zoom
    paper.view.update()    

  
app.initialize()
window.createSelectionTool = ()->
  t = new paper.Tool
    name: "selectionTool"
    minDistance: 10
    hitOptions: 
      segments: false
      stroke: true 
      fill: true
      tolerance: 10   
    init: ()->
      items = paper.project.getItems
        className: /^(?!Layer).*$/
      _.each items, (item)-> 
        item.saveable = true
        if item.className == "Shape"
          item.activeStyle = new paper.Path
            saveable: false
            visible: false
            activestyle: true
        else
          item.activeStyle = item.clone().set
            saveable: false
            activestyle: true
            fillColor: "blue"
            strokeColor: "yellow"
            strokeWidth: 5
            opacity: 0.3
            visible: false
    update: ()->
      items = paper.project.getItems
        saveable: true
        className: /^(?!Layer).*$/

      _.each items, (item)-> 
        item.activeStyle.visible = item.active
    onMouseDrag: (e)->
      paper.project.activeLayer.position = paper.project.activeLayer.position.add(e.delta);
    onMouseDown: (e)->
      selected = paper.project.selectedItems
      
      _.each selected, (item)-> 
        item.active = not item.active
        if item.dom
          item.dom.toggleClass("active")

      if selected.length == 0
        items = paper.project.getItems
          saveable: true
          className: /^(?!Layer).*$/
        _.each items, (item)-> 
          item.active = false
          item.dom.removeClass("active")

      this.update()  
    
    onMouseMove: (e)->
      hitResult = paper.project.hitTest e.point, t.hitOptions
      items = paper.project.selectedItems
      items = _.filter items, (item)-> item.saveable

      _.each items, (item)-> 
        item.selected = false
        if item.dom
         item.dom.removeClass("mouseover")
      
      if hitResult and hitResult.item.saveable
        if hitResult.item.selected then return
        hitResult.item.selected = true
        if hitResult.item.dom
          hitResult.item.dom.addClass("mouseover")
  t.init()
  return t;