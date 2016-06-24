function AnimationHandler(paper){
	this.animations = [];
	this.t = 0;
	var self = this;
	paper.view.onFrame = function(event){
		self.t = event.time;

		_.each(self.animations, function(el, i, arr){
			el.fn(event);
		});
	}
}

AnimationHandler.prototype = {
	add: function(fn, duration, killFn){
		var a = new Animation(guid(), this.t, fn, duration, killFn);
		this.animations.push(a);
		return a.id;
	}, 
	remove: function(animation_id){
		this.animations = _.reject(this.animations, function(el, i, arr){
			if(el.id == animation_id) el.kill();
			return el.id == animation_id
		});
	}
}


function Animation(id, t, fn, duration, onKillfn){
	this.start = t;
	this.id = id;
	this.kill = onKillfn;
	var self = this;
	if(_.isUndefined(duration)){
		this.fn = function(event){ fn(event) };
	} else{
		this.fn = function(event){
			var t = event.time - self.start;
			// console.log(event.time - self.start);
			if(t < duration){
				fn(event, t);
			}
			else{
				// onKillfn();
				this.kill();
				designer.animation_handler.remove(self.id);
			}
		}
	}
}

function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
}