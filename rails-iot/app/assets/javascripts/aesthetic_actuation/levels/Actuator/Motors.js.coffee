class window.ActuatorSERVO extends Actuator1D
  onCreate: ->
    @expression = 128;
    return
  toAPI: (hid)->
    d = hid.split(":")
    {flag: "A", args: [d[0], d[1], parseInt(@expression)]}
  _updateVisuals: (p)->
    window.paper = @paper
    arm = CanvasUtil.queryPrefix('ARM')[0]
    base = CanvasUtil.queryPrefix('BASE')[0]
    theta = new (paper.Point)(0, -20)
    theta.angle = -(180 - (p))
    arm.remove()
    arm = new (paper.Path.Line)(
      name: 'ARM: emit'
      from: base.position.clone()
      to: base.position.clone().add(theta)
      strokeWidth: 4
      strokeColor: '#DDDDDD'
      shadowColor: new Color(0, 0, 0)
      shadowBlur: 12
      shadowOffset: new Point(5, 5))
    return
  _visuals: ->
    base = new (paper.Path.Rectangle)(
      name: 'BASE: emit'
      position: paper.view.center
      size: [16, 32]
      fillColor: '#00A8E1'
      shadowColor: new Color(0, 0, 0)
      shadowBlur: 6
      shadowOffset: new Point(1, 1))
    arm = new (paper.Path.Line)(
      name: 'ARM: emit'
      from: base.position.clone()
      to: base.position.clone().add(new (paper.Point)(0, -20))
      strokeWidth: 4
      strokeColor: '#DDDDDD'
      shadowColor: new Color(0, 0, 0)
      shadowBlur: 12
      shadowOffset: new Point(5, 5))
    decor = new (paper.Path.Circle)(
      name: 'DECOR: emit'
      position: base.position
      radius: 3
      fillColor: '#333333')
    arm.set pivot: arm.firstSegment.point.clone()
    
    @visuals.push decor
    @visuals.push base
    @visuals.push arm
class window.ActuatorSTEPPER extends ActuatorSERVO