class ExpressivePop
	@collection: []
	@COUNTER: 0
	@hide
	constructor: (op)->
		scope = this
		_.extend(this, op)
		@assignID()
		@dom = makeDOM()
		@bindBehavior()
		@addToCollection()
	assignID: ->
		@id = ExpressivePop.COUNTER ++
	addToCollection: ->
		ExpressivePop.collection.push(this)
	makeDOM: ()->
		console.warn("makeDom not implemented")
	bindBehavior: ()->
		console.warn("bindBehavior not implemented")
	show: ->
		@dom.show()
	hide: ->
		@dom.fadeOut(100)
	setContent: (content)->
		@dom.find('epop-content').html(content)
	select: ()->
		skip = @id
		_.each @collection, (pop, i)->
			if i == skip then return
			else pop.hide()

class TimePop extends ExpressivePop
	@collection: []
	@COUNTER: 0
	assignID: ->
		@id = TimePop.COUNTER ++
	addToCollection: ->
		TimePop.collection.push(this)
	makeDOM: ()->
		template = $('<div class="epop" role="tooltip"><div class="arrow"></div><a class="dismiss btn pull-right"><span class="glyphicon glyphicon-remove"></span></a><div class="epop"></div><input min="0" max="10000" step="100" type="range"/></div>')
		$("body").append(template)
	bindBehavior: ()->
    	scope = this
		@dom.find('.dismiss').click ()-> scope.hide()
		@dom.find('input').val(@parent.form.period)
		@dom.find('input').on 'input', ()->
	      t = $(this).val()
	      scope.setContent(TimeSignal.pretty_time(t))
	      scope.parent.form = {period: t}