# Place all the behaviors and hooks related to the matching controller here.
# All this logic will automatically be available in application.js.
# You can use CoffeeScript in this file: http://coffeescript.org/

//= require underscore
//= require numeric.min
//= require dat.gui.min
//= require d3
//= require clipper
//= require paper-full.min
//= require saveas.min
//= require format
//= require convex
//= require grid
//= require hull
//= require metamorphehalf/webcache
//= require eld/ruler
//= require eld/CanvasUtil
//= require eld/artwork
//= require eld/CircuitEditBrush
//= require eld/CircuitRouting
//= require eld/PipeManager
//= require eld/Pipeline
//= require eld/graph
//= require eld/ButtonExporter
//= require eld/PointSource
//= require eld/ImagePlane
//= require eld/LensGenerator
//= require eld/SimulatedAnnealing
//= require eld/Generator
//= require eld/Splitter
//= require eld/Reflector
//= require eld/TIR
//= require eld/noLens
//= require eld/Sticher
//= require eld/brushes/SelectionManager
//= require eld/brushes/CircuitBrush
//= require eld/brushes/HeatBrush
//= require eld/brushes/MagicWandBrush
//= require eld/brushes/PanTool
//= require eld/brushes/DirectManipulationTool
//= require eld/brushes/LinkBrush
//= require eld/brushes/FillBrush
//= require eld/brushes/LEDPlacerBrush
//= require eld/scripts/diffuser_spacer
//= require actuation/ComponentSelectTool
//= require actuation/PathSelectTool
//= require actuation/BurstSelectTool
//= require actuation/SIA
# TEMPLATE UPDATE

$ ->
  # DROP-TOOL FUNCTIONALITY
  $('.btn-ard').click ->
    $(this).toggleClass 'active'
    $(this).siblings('ul').slideToggle()
    return

  $('.drop-tool ul li').click ->
    $(this).siblings().removeClass 'active'
    $(this).toggleClass 'active'
    return
  widgets = $('#status .widget-title')
  template = $('#widget-title')
  _.each widgets, (widget) ->
    t = template.clone()
    name = $(widget).attr('name')
    t.removeClass 'template'
    t.find('span#name').html name
    $(widget).html t.children()
    return
  # EYE FUNCTIONALITY
  $('.viewer').click ->
    $(this).parent().siblings().toggleClass 'hide'
    eye = $(this).find('span')
    if eye.hasClass('glyphicon-eye-open')
      eye.removeClass 'glyphicon-eye-open'
      eye.addClass 'glyphicon-eye-close'
    else
      eye.addClass 'glyphicon-eye-open'
      eye.removeClass 'glyphicon-eye-close'
    return
  _.each $('.viewer'), (v) ->
    if $(v).parents('.widget').hasClass('collapsed')
      $(v).click()
    return
 return

