// requires guid()
function PerceptualScheduler(paper){
	var self = this;
	this.animations = [];
	this.global_time = 0;
	paper.view.onFrame = function(event){
		self.global_time = event.time; // time_since_paper_created
		// console.log("GLOBAL TIME", self.global_time);
		_.each(self.animations, function(animation){
			animation.run(event);
		});
	}
}

PerceptualScheduler.prototype = {
	add: function(props){
		props.id = guid();
		props.startTime = this.global_time;
		if(props.delay) props.startTime += (props.delay / 1000);
		if(props.duration) props.duration /= 1000;
		
		
		this.animations.push(new Animation(this, props));
		return props.id;
	}, 
	// forcefull removal calls kill fn for animations
	remove: function(id){
		this.animations = _.reject(this.animations, function(animation){
			if(animation.props.id == id) if(animation.props.onKill) animation.props.onKill();
			return animation.props.id == id;
		});
	}
}

// scheduler.add({
// 	onRun: function(){},
// 	onKill: function(){},
// 	startTime: 0, // seconds from current time
// 	duration: 1000
// })

function Animation(scheduler, props){
	// console.log("Creating new animations", props)
	this.scheduler = scheduler;
	this.props = props;
	var self = this;
	var runonce = _.isUndefined(self.props.duration) || _.isNull(self.props.duration) || self.props.duration == 0
	
	if(runonce)
		this.run = function(event){ 
			if(event.time < self.props.startTime) return;

			p = {};
			if(self.props.onRun){
				if(self.props.debug && self.props.name) console.log(event.time, self.props.startTime, self.props.name);
				self.props.onRun(_.extend(event, p));
			}
			self.scheduler.remove(self.props.id);
		};
	else
		this.run = function(event){
			if(event.time < self.props.startTime) return;

			var elapsed_time = event.time - self.props.startTime; // elapsed time
			p = { parameter: elapsed_time / self.props.duration } // parametrized time left

			if(elapsed_time < self.props.duration){
				if(self.props.debug && self.props.name) console.log(p.parameter, event.time, self.props.startTime, self.props.name);
				if(self.props.onRun) self.props.onRun(_.extend(event, p));
			}
			else
				self.scheduler.remove(self.props.id);
			
		}	
}

