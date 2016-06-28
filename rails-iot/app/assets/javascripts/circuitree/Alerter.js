// alerter
function Alerter(dom){
	this.template = dom.clone();

	dom.remove();
	this.silenced = [];
	this.auto = [];
}

Alerter.prototype = {
	alert: function(message, fn, action_message){
		$("#alerter").find('.close').click();
		var scope = this;
		if(_.isUndefined(fn)) fn = function(){};
		if(_.isUndefined(message)) message = "Something went wrong";
		if(this.silenced.indexOf(message) != -1) return;
		if(this.auto.indexOf(message) != -1){
			fn();
			return;
		};

		var dom = this.template.clone();
		dom.find('#message').html(message);
		dom.find('#action').html(action_message);
		dom.find("#silence").click(function(){
			scope.silenced.push($('#message').html());
			$("#alerter").find('.close').click();
		});
		dom.find("#auto").click(function(){
			scope.auto.push($('#message').html());
			fn(event);
			$("#alerter").find('.close').click();
		});
		dom.find("#action").click(function(event){
			fn(event);
			$("#alerter").find('.close').click();
		});

		$("#alert-container").append(dom);
			dom.on('closed.bs.alert', function(event) {
		  // fn(event);
		});

	}
}