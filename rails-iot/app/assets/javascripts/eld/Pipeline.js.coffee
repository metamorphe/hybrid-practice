window.GRAY_ON = true
window.SWATCH_ON = false
window.MC_MOVE = false

# 
window.WING_HEIGHT = Ruler.mm2pts(1.5)
window.WING_OFFSET = Ruler.mm2pts(2)
# #4-40 X 0.75in
window.NUT_HEIGHT = 2.46 #mm
window.HEAD_HEIGHT = 2.76 #mm
window.BOLT_HEIGHT = 21.17 #mm
window.THREAD_HEIGHT = BOLT_HEIGHT - NUT_HEIGHT - HEAD_HEIGHT #mm
window.HEAD_RADIUS = 5.58 * 1.1 / 2.0 #mm
window.PEG_RADIUS = 3.0 * 1.3 / 2.0 #mm
window.HEX_RADIUS = 7.6 / 2.0 #mm
window.END_GAP = 1.4125 #mm

# NAMESPACE FOR ELD PIPEPLINE
window.DIFUSSER_HEIGHT = END_GAP + HEAD_HEIGHT #mm
window.DIFFUSER_MOLD_HEIGHT = 3.00
window.REFLECTOR_HEIGHT = 10 #mm
# NEOPIXEL
window.SPACER_HEIGHT = 6
# window.SPACER_HEIGHT = 3.1
window.BASE_HEIGHT = END_GAP + NUT_HEIGHT
window.OVERALL_HEIGHT = DIFUSSER_HEIGHT + REFLECTOR_HEIGHT + SPACER_HEIGHT + BASE_HEIGHT
# BASE
# SPACER + REFLECTOR
window.WALL_WIDTH = 3 #mm
window.PEG_PADDING = WALL_WIDTH * 1.2
# + (PEG_RADIUS / 2.0); //mm
# REFLECTOR
window.DIFUSSER_BASE_HEIGHT = 0.641
window.BASE_EXPANSION = -WALL_WIDTH #mm
window.RIM_HEIGHT = 0.128
window.RIM_WIDTH = 1.5 #mm
# SPACER 
window.WALL_EXPANISION = BASE_EXPANSION #mm
# window.PCB_HEIGHT = 1.7

window.PCB_HEIGHT = 1
# relative 1.7 (base) /3.1 (wall) mm
window.CHANGE_IN_X_DIR = 8 #pts
window.CHANGE_IN_Y_DIR = 8 #pts
window.LED_TOLERANCE = 4.5 #mm
# MOLDS
window.MOLD_WALL = 5 # mm
window.MOLD_WALL_SPECIAL = 5#3.5 # mm
# PCB
window.POINT_OFFSET = 5 #pts
window.POINT_INNER_OFFSET = 5 #pts
window.THETA_STEP = 45 #ptsOPT_MAX_ITERS
window.THETA_OFFSET = 0.5 #pts
window.OPT_MAX_ITERS = 30
window.EPSILON = 10
window.LED_WIDTH = 5
window.LED_HEIGHT = 1.4

# EVAL
window.MODEL_TO_GENERATE = 'Reflector'

class window.Pipeline
    constructor: ->
    @getElements:  ->
      {
        art: CanvasUtil.queryPrefix('ART')
        diff: CanvasUtil.queryPrefix('DIF')
        leds: CanvasUtil.queryPrefix('NLED')
        bo: CanvasUtil.queryPrefix('BO')
        bi: CanvasUtil.queryPrefix('BI')
        cp: CanvasUtil.queryPrefix('CP')
        dds: CanvasUtil.queryPrefix('DDS')
        mc: CanvasUtil.queryPrefix('MC')
        base: CanvasUtil.queryPrefix('BASE')
        wires: CanvasUtil.queryPrefix('WIRE')
        rays: CanvasUtil.queryPrefix('RAY')
        nuts: CanvasUtil.queryPrefix('NUT')
        gray: CanvasUtil.queryPrefix('DDS')
      }

    @script: 
      mold: (display, e) ->
        @adjustLEDs display, e
        result = new (paper.Group)(name: 'RESULT: MOLD')
        _.each e.diff, (diffuser) ->
          expanded = diffuser.expand(
            strokeAlignment: 'exterior'
            strokeWidth: 1
            strokeOffset: Ruler.mm2pts(MOLD_WALL_SPECIAL)
            strokeColor: 'black'
            fillColor: 'white'
            joinType: 'miter'
            parent: result)
          diffuser.set
            visible: true
            fillColor: 'black'
            strokeWidth: 0
            strokeColor: 'white'
            parent: result
          return
        if GRAY_ON
          console.log 'GRAY DETECTED', e.gray.length
          _.each e.diff, (diffuser) ->
            inverse = diffuser.fillColor.clone()
            inverse.brightness = 0.5
            diffuser.set
              visible: true
              fillColor: new paper.Color(0)
              strokeWidth: Ruler.mm2pts(2)
              opacity:1
              strokeColor: 'white'
              parent: result
            diffuser.bringToFront()
            return
          _.each e.gray, (diffuser) ->
            inverse = diffuser.fillColor.clone()
            inverse.brightness = 0#1 - (inverse.brightness) - 0.1
            diffuser.set
              visible: true
              fillColor: new paper.Color(0.3)
              strokeWidth: 0
              opacity:1
              strokeColor: 'white'
              parent: result
            diffuser.bringToFront()
            return
        #Make non-molding objects invisible
        invisible = _.compact(_.flatten([
          e.nuts
          e.art
          e.leds
          e.cp
          e.bi
          e.bo
          e.base
          e.mc
          e.wires
        ]))
        Pipeline.set_visibility invisible, false
        result.scaling = new (paper.Size)(-1, 1)
        result.name = 'RESULT: DIFFUSER'
        result.model_height = DIFFUSER_MOLD_HEIGHT
        return
      diffuser: (display, e) ->
        @adjustLEDs display, e
        all = _.flatten([
          e.leds
          e.diff
          e.mc
          e.base
        ])
        result = new (paper.Group)(all)
        _.each e.diff, (diffuser) ->
          expanded = diffuser.expand(
            strokeAlignment: 'exterior'
            strokeWidth: 0
            strokeOffset: Ruler.mm2pts(MOLD_WALL_SPECIAL)
            strokeColor: 'black'
            fillColor: 'white'
            joinType: 'miter'
            parent: result)
          diffuser.set
            visible: true
            fillColor: new (paper.Color)(0.2)
            strokeWidth: 0
            strokeColor: 'white'
            parent: result
          return
        # SKINS
        _.each e.diff, (diffuser) ->
          expanded = diffuser.expand(
            strokeAlignment: 'interior'
            strokeWidth: 0
            strokeOffset: Ruler.mm2pts(MOLD_WALL_SPECIAL)
            strokeColor: null
            fillColor: 'black'
            joinType: 'miter'
            parent: result)
          # diffuser.set({
          #     visible: true,
          #     fillColor: "#DDD",
          #     strokeWidth: 0,
          #     strokeColor: "white",
          #     parent: result
          # });
          # diffuser.sendToBack();
          return
        _.each e.base, (base) ->
          base.strokeWidth = 0
          base.fillColor = 'white'
          return
        pegs = _.map(e.nuts, (nut) ->
          bolt_head = Pipeline.create(
            geometry: 'circle'
            position: nut.position
            radius: HEAD_RADIUS
            height: (DIFUSSER_HEIGHT - HEAD_HEIGHT) / DIFUSSER_HEIGHT
            parent: result)
          bolt = Pipeline.create(
            geometry: 'circle'
            position: nut.position
            radius: PEG_RADIUS
            height: 'black'
            parent: result)
          return
        )
        CanvasUtil.call e.base, 'sendToBack'
        invisible = _.compact(_.flatten([
          e.nuts
          e.mc
          e.art
          e.dds
          e.leds
          e.cp
          e.bi
          e.bo
        ]))
        Pipeline.set_visibility invisible, false
        # result.scaling = new paper.Size(-1, 1);
        result.name = 'RESULT: DIFFUSER'
        result.model_height = DIFUSSER_HEIGHT
        return
    
      reflector: (display, e) ->
        g = new Generator
        g.model = 'Reflector'
        g.export = 'REFL'
        result = @makeFromProfile(display, e, g)
        result.name = 'RESULT: DIFFUSER'
        result.model_height = REFLECTOR_HEIGHT
        # _.each(e.dds, function(diffuser){
        #     diffuser.expand({
        #         strokeAlignment: "exterior", 
        #         strokeWidth: 0.1,
        #         strokeOffset: 0, 
        #         // strokeColor: "orange", 
        #         fillColor: "black", 
        #         joinType: "miter", 
        #         opacity: 0.5,
        #         parent: result
        #     });
        #     two = diffuser.expand({
        #         strokeAlignment: "exterior", 
        #         strokeWidth: 0,
        #         strokeOffset: 4, 
        #         strokeColor: "orange", 
        #         fillColor: "white", 
        #         joinType: "miter", 
        #         opacity: 1.0,
        #         parent: result
        #     });
        #     two.sendToBack();
        # }); 
        _.each e.leds, (led) ->
          led_hole = new paper.Path.Circle
            fillColor: 'black'
            strokeColor: 'black'
            radius: Ruler.mm2pts(3.523) #sqrt 2.5^2 + 2.5^2
            position: led.position
            strokeWidth: 0#Ruler.mm2pts(LED_TOLERANCE) / 2
            parent: result
          
          led.set
            fillColor: "black",
            strokeColor: 'black',
            strokeWidth: 0,
            # strokeWidth: Ruler.mm2pts(LED_TOLERANCE), 
            parent: result
          
          led.remove()
        return
      makeFromProfile: (display, e, g, chassis = true, dome = false) ->
        @adjustLEDs display, e
        all = if chassis then _.flatten([e.base,e.diff,e.leds]) else _.flatten([ e.diff ])
        
        # HARD_CODE_DIFFUSER_ASSOCIATIONS
        if SWATCH_ON
          model = MODEL_TO_GENERATE
          e.diff[0].diffuser = 'Planar'
          e.diff[1].diffuser = 'Planar'
          e.diff[2].diffuser = 'Hemisphere'
          e.diff[3].diffuser = 'Cuboid'
        else
          _.each e.diff, (d) ->
            d.diffuser = 'Planar'
            return
          _.each e.dds, (d) ->
            d.diffuser = 'Planar'
            return
        result = new (paper.Group)(all)
        _.each e.base, (base) ->
          base.strokeWidth = 0.01
          base.strokeColor = 'black'
          base.fillColor = 'white'
          return
        _.each e.diff, (diffuser) ->
          if diffuser.className == 'Group'
            return
          expanded = diffuser.expand
            strokeAlignment: 'exterior'
            strokeWidth: 0
            strokeOffset: Ruler.mm2pts(MOLD_WALL_SPECIAL)
            strokeColor: 'black'
            fillColor: 'white'
            joinType: 'miter'
            parent: result
          diffuser.set
            visible: true
            fillColor: 'black'
            strokeWidth: 0
            strokeColor: 'white'
            parent: result
          return
        
        ramps = _.map e.diff, (diff) ->
          dleds = _.filter e.leds, (l) -> return diff.contains l.bounds.center
          if dleds.length == 0 then return
          lines = interpolation_lines(diff, dleds, visible = false)
          cache_gradients = _.chain(lines)
            .unique (l) ->
              l.roundedLength
            .map (l) ->
              g.length = l.roundedLength
              g.random = false
              g.diffuser = diff.diffuser
              {
                roundedLength: l.roundedLength
                gradients: g.getGradient()
                line: l.line
                pathOrigin: l.pathOrigin
              }
            .groupBy('roundedLength')
            .value()
        # # MAKE RAMPS
          ramp_lines = _.map lines, (l, idx) ->
            # if idx > 1 then return
            length = l.roundedLength
            gradient = cache_gradients[length][0].gradients.reflector
            {
              ramp: gradient
              line: l.line
              origin: l.pathOrigin
            }
          # console.log "I GET HERE"
          ramps = rampify(ramp_lines, result)
        # console.log "I AM HERE"
        removeable = CanvasUtil.query(paper.project, {prefix: ['RT','RAY','PL','LS','NP']})
        CanvasUtil.call removeable, 'remove'
        invisible = _.compact(_.flatten([e.nuts, e.art, e.bo, e.bi, e.cp, e.mc, e.dds]))
        Pipeline.set_visibility invisible, false
        result.extend
          name:'RESULT: REFLECTOR'
          model_height: REFLECTOR_HEIGHT
        return result
        
      no_lens: (display, e) ->
        ws = new WebStorage
        @adjustLEDs display, e
        all = _.flatten([
          e.diff
          e.leds
          e.base
        ])
        result = new (paper.Group)(all)
        backgroundBox = new (paper.Path.Rectangle)(
          rectangle: result.bounds.expand(Ruler.mm2pts(MOLD_WALL))
          fillColor: 'white'
          parent: result)
        mc = @adjustMC(display, e, backgroundBox)
        if mc
          mc.parent = result
          mc.bringToFront()
        _.each e.diff, (diff) ->
          diff.set
            fillColor: 'black'
            strokeWidth: 0
          return
        # var pegs = Pipeline.create_corner_pegs({ 
        #  geometry: "hex",
        #  bounds: backgroundBox.strokeBounds, 
        #  radius: HEX_RADIUS, 
        #  padding: PEG_PADDING, 
        #  height: 'yellow', 
        #  parent: result
        # });
        pegs = Pipeline.create_corner_pegs(
          geometry: 'circle'
          bounds: backgroundBox.strokeBounds
          radius: PEG_RADIUS
          padding: PEG_PADDING
          height: 'black'
          parent: result)
        backgroundBox.sendToBack()
        # INVISIBILITY
        invisible = _.compact(_.flatten([
          e.nuts
          e.art
          e.base
          e.dds
          e.bo
          e.bi
          e.cp
          e.leds
        ]))
        Pipeline.set_visibility invisible, false
        result.name = 'RESULT: NO LENS'
        result.model_height = REFLECTOR_HEIGHT
        return
      spacer: (display, e) ->
        ws = new WebStorage
        @adjustLEDs display, e
        all = _.flatten([
          e.base
          e.mc
          e.leds
        ])
        result = new (paper.Group)(all)
        _.each e.base, (base) ->
          base.strokeWidth = 0.0
          base.strokeColor = 'black'
          base.fillColor = 'white'
          return

        # MOLD WALL

        expanded = e.base[0].expand
          strokeAlignment: 'interior'
          strokeWidth: 0
          strokeOffset: Ruler.mm2pts(MOLD_WALL)
          strokeColor: 'black'
          fillColor: new paper.Color (PCB_HEIGHT / SPACER_HEIGHT)
          joinType: 'miter'
          parent: result
        # console.log "EXPANDED", e.base[0]
        pegs = _.map e.nuts, (nut) ->
          bolt = Pipeline.create
            geometry: 'circle'
            position: nut.position
            radius: PEG_RADIUS
            height: 'black'
            parent: result
          return
        
        if MC_MOVE
          mc = @adjustMC(display, e, e.base[0])
          if mc
            mc.parent = result
            mc.bringToFront()
        else
          e.mc[0].fillColor = 'black'
          e.mc[0].parent = result
          e.mc[0].bringToFront()
        invisible = _.compact(_.flatten([
          e.nuts
          e.art
          e.cp
          e.dds
          e.bo
          e.diff
          e.bi
          e.wires
        ]))

        
        _.each e.leds, (led) ->
          led_hole = new paper.Path.Circle
            fillColor: 'black'
            strokeColor: 'black'
            radius: Ruler.mm2pts(3.523) #sqrt 2.5^2 + 2.5^2
            position: led.position
            strokeWidth: 0#Ruler.mm2pts(LED_TOLERANCE) / 2
            parent: result
          
          led.set
            fillColor: "black",
            strokeColor: 'black',
            strokeWidth: 0,
            # strokeWidth: Ruler.mm2pts(LED_TOLERANCE), 
            parent: result
          
          led.remove()
          # led_hole.bringToFront()
          # led_hole.remove()
          return
        # Reflect Object 
        Pipeline.set_visibility invisible, false
        result.scaling = new (paper.Size)(-1, 1)
        result.name = 'RESULT: SPACER'
        result.model_height = SPACER_HEIGHT
        return
      circuit: (display, e) ->
        ws = new WebStorage
        all = _.flatten([
          e.base
          e.leds
          e.diff
        ])
        result = new (paper.Group)(all)
        backgroundBox = new (paper.Path.Rectangle)(
          rectangle: result.bounds.expand(Ruler.mm2pts(MOLD_WALL) - Ruler.mm2pts(WALL_WIDTH))
          fillColor: new (paper.Color)(PCB_HEIGHT / SPACER_HEIGHT)
          strokeColor: 'white'
          strokeWidth: Ruler.mm2pts(WALL_WIDTH))
        if MC_MOVE
          mc = @adjustMC(display, e, e.base[0])
          if mc
            mc.parent = result
            mc.bringToFront()
        else
          e.mc[0].parent = result
          e.mc[0].bringToFront()
        backgroundBox.remove()
        # Function that initializes the routing process.
        leds = _.sortBy(e.leds, (led) ->
          led.lid
        )
        nodes = _.flatten([
          e.bi
          leds
          e.bo
        ])
        nodes = CircuitRouting.generateNodes(nodes, (nodes) ->
          _.each nodes, (node, i, arr) ->
            node.right = null
            node.left = null
            if i - 1 >= 0
              node.left = arr[i - 1]
            if i + 1 < arr.length
              node.right = arr[i + 1]
            return
          config = CircuitRouting.route(nodes)
          ws.set fs.open_file, JSON.stringify(config)
          CircuitRouting.connect_the_dots nodes
          CircuitRouting.cleanup nodes, e
          paper.view.update()
          paper.view.zoom = 1
          return
        )
        addTool()
        invisible = _.compact(_.flatten([
          e.base
          e.cp
        ]))
        Pipeline.set_visibility invisible, false
        paper.view.zoom = 1
        return
      base: (display, e) ->
        all = _.flatten([
          e.leds
          e.diff
          e.mc
          e.base
        ])
        result = new (paper.Group)(all)
        _.each e.base, (base) ->
          base.strokeWidth = 0
          base.fillColor = 'white'
          base.parent = result
          return
        pegs = _.map(e.nuts, (nut) ->
          `var nut`
          nut = Pipeline.create(
            geometry: 'hex'
            position: nut.position
            radius: HEX_RADIUS
            height: END_GAP / BASE_HEIGHT
            parent: result)
          bolt = Pipeline.create(
            geometry: 'circle'
            position: nut.position
            radius: PEG_RADIUS
            height: 'black'
            parent: result)
          return
        )
        CanvasUtil.call e.base, 'sendToBack'
        invisible = _.compact(_.flatten([
          e.art
          e.nuts
          e.mc
          e.leds
          e.dds
          e.diff
          e.cp
          e.bo
          e.bi
        ]))
        Pipeline.set_visibility invisible, false
        result.scaling = new (paper.Size)(-1, 1)
        result.name = 'RESULT: BASE'
        result.model_height = BASE_HEIGHT
        return
      adjustMC: (display, e, backgroundBox, result) ->
        if e.mc.length == 0
          return
        mc = e.mc[0]
        bi = e.bi[0]
        pl = new (paper.Group)([
          mc
          bi
        ])
        alignment = [
          mc.bounds.topCenter
          mc.bounds.bottomCenter
          mc.bounds.leftCenter
          mc.bounds.rightCenter
        ]
        alignment = _.max(alignment, (pt) ->
          bi.position.getDistance pt
        )
        mc.set
          fillColor: 'black'
          pivot: alignment
        pl.pivot = alignment
        position = backgroundBox.getNearestPoint(alignment)
        direction = position.subtract(alignment)
        if backgroundBox.strokeWidth > 0
          direction.length = backgroundBox.strokeWidth / 2.0
          position = position.add(direction)
        pl.position = position
        pl
      adjustLEDs: (display, e) ->
        if ws.includes(display.svgPath)
          config = JSON.parse(ws.get(display.svgPath))
        _.each e.leds, (led) ->
          if _.isUndefined(config)
            rotation = 0
          else
            rotation = _.findWhere(config, id: led.lid)
            if rotation
              rotation = rotation.theta
          led.set rotation: rotation
          return
        return
      code: (display, e) ->
        console.log "CODE", display
        lines = _.chain e.leds 
          .map (led) ->
            if led.colorID
              device: parseInt(led.lid.split(':')[0])
              id: parseInt(led.lid.split(':')[1])
              color: rgb2hex2(led.colorID.toCanvasStyle())
            else
              device: parseInt(led.lid.split(':')[0])
              id: parseInt(led.lid.split(':')[1])
              color: rgb2hex2(led.fillColor.toCanvasStyle())
          .sortBy (line)-> line.id
          .map (line)->
            return 'strip.setPixelColor(' + line.id + ',' + line.color + ');'
          .value()
        .join('\n')

        # 'strip.setPixelColor(' + led.lid.split(':')[1] + ',' + rgb2hex2(led.colorID.toCanvasStyle()) + ');'
        editor.setValue("")
        editor.insert("/* " + fs.getName() + '\n')
        editor.insert(" * " + new Date(Date.now()).toLocaleString() + '\n')
        editor.insert(" */ " + '\n')
        editor.insert(lines)
        $('.popout').fadeIn();
        return

Pipeline.set_visibility = (objects, is_visible) ->
  _.each objects, (object) ->
    object.visible = is_visible
    return
  paper.view.update()
  return

Pipeline.create = (o) ->
  o.radius = Ruler.mm2pts(o.radius)
  if o.geometry == 'hex'
    new (Path.RegularPolygon)(
      parent: o.parent
      position: o.position
      center: [
        50
        50
      ]
      sides: 6
      fillColor: o.height
      radius: o.radius)
  else
    new (paper.Path.Circle)(
      parent: o.parent
      position: o.position
      fillColor: o.height
      radius: o.radius)

### Function takes in bounds box, and creates the bounding holes ###

Pipeline.create_corner_pegs = (o) ->
  o.radius = Ruler.mm2pts(o.radius)
  o.padding = Ruler.mm2pts(o.padding)
  if o.geometry != 'hex'
    o.bounds = o.bounds.expand(-2 * o.radius - Ruler.mm2pts(HEX_RADIUS) - (2 * o.padding))
  else
    o.bounds = o.bounds.expand(-2 * o.radius - (2 * o.padding))
  # - 2 * o.padding 
  corners = [
    o.bounds.topRight
    o.bounds.topLeft
    o.bounds.bottomLeft
    o.bounds.bottomRight
  ]
  corners = _.map(corners, (corner) ->
    dir = o.bounds.center.subtract(corner)
    dir.length = 0
    if o.geometry == 'hex'
      new (Path.RegularPolygon)(
        parent: o.parent
        position: corner.add(dir)
        center: [
          50
          50
        ]
        sides: 6
        fillColor: o.height
        radius: o.radius)
    else
      new (paper.Path.Circle)(
        parent: o.parent
        position: corner.add(dir)
        fillColor: o.height
        radius: o.radius)
  )
  corners
