function ActuationParam(op){
	this.op = _.extend(op, {min: op.range.min, max: op.range.max, range: op.range.max - op.range.min});
	this.value = 0;
	// this.param = 0;
}
ActuationParam.prototype = {
	_map: function(x){ return (x - this.op.min) / this.op.range ;},
	_inv_map: function(y){ return this.op.min + y * this.op.range; },
	get param(){ return this._param; },
	get value(){ return this._value; },
	set param(x){
		this.value = this._inv_map(x);
		this._param = x;
	},	
	set value(x){
		var scope = this;
		if(x > this.op.max || x < this.op.min){
			console.error("Attempt to set", this.op.name, "to out of range ["+ this.op.min + ", " + this.op.max + "] value:", x);
			return;
		}
		var p = scope._map(x);
		this._param = p;
		if(scope.op.render && this.op.onChange) this.op.onChange(p);
		this._value = x;
	}
}