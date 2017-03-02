# TEMPLATE UPDATE
# $ ->
#   # DROP-TOOL FUNCTIONALITY
#   $('.btn-ard').click ->
#     $(this).toggleClass 'active'
#     $(this).siblings('ul').slideToggle()
#     return

#   $('.drop-tool ul li').click ->
#     $(this).siblings().removeClass 'active'
#     $(this).toggleClass 'active'
#     return
#   widgets = $('#status .widget-title')
#   template = $('#widget-title')
#   _.each widgets, (widget) ->
#     t = template.clone()
#     name = $(widget).attr('name')
#     t.removeClass 'template'
#     t.find('span#name').html name
#     $(widget).html t.children()
#     return
#   # EYE FUNCTIONALITY
#   $('.viewer').click ->
#     $(this).parent().siblings().toggleClass 'hide'
#     eye = $(this).find('span')
#     if eye.hasClass('glyphicon-eye-open')
#       eye.removeClass 'glyphicon-eye-open'
#       eye.addClass 'glyphicon-eye-close'
#     else
#       eye.addClass 'glyphicon-eye-open'
#       eye.removeClass 'glyphicon-eye-close'
#     return
#   _.each $('.viewer'), (v) ->
#     if $(v).parents('.widget').hasClass('collapsed')
#       $(v).click()
#     return
#  return
