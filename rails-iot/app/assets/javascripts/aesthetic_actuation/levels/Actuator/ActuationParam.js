function ActuationParam(op){
	this.op = _.extend(_.clone(op), {min: op.range.min, max: op.range.max, range: op.range.max - op.range.min});
	this.value = 0;
	// this.param = 0;
}
ActuationParam.prototype = {
	to_value: function(p){ return this._inv_map(p);},
	_map: function(x){ return (x - this.op.min) / this.op.range ;},
	_inv_map: function(y){ return this.op.min + y * this.op.range; },
	// r_value: function(){ return this.value.toFixed(this.op.resolution) },
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

@resolution_fix: (p, r, range)->
    v = p * range
    off = v % r
    r = parseFloat(r)
    if off / r > 0.5
      return v - off + r
    else
      return v - off