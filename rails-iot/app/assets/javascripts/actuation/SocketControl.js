  SocketControl.DISCONNECTED = 0; 
  SocketControl.ERROR = -1; 
  SocketControl.CONNECTED = 1; 
  
  function SocketControl(options) {
    this._properties = options;
    this.state = SocketControl.DISCONNECTED; 
    this.init();
  }
  
  SocketControl.prototype = {
    init: function() {
      console.info("Enabling socket control");
    	var scope = this;
      var p = this._properties;
      var ports = _.map(p.ports, function(el, i, arr){
        var name = el.split('/');
        name = name[name.length-1];
        return {name: name, value: el};
      });
      console.log(ports);
      var noPorts = ports.length == 0;
      ports =  noPorts ? [{name: "NO PORTS DETECTED", value: null}] : ports
      var available_ports = _.map(ports, function(port, i, arr){
        var dom =  $('<option></options>').html(port.name.toUpperCase())
          .attr('value', port.value);
        return dom;
      });
      p.selector.html(available_ports);

      if(noPorts){
        p.noports_func(p.trigger);
        // var widget = p.selector.parents(".widget")
        // widget.find('.viewer').click();
        // widget.find('#name').html("NO PORTS FOUND");
        // widget.find('.widget-title')
        //   .removeClass('label-normal')
        //   .addClass('label-danger');
      } else{
      	this._properties.trigger.click(function(){
      		switch(scope.state){
    			case SocketControl.DISCONNECTED:
    				scope.connect();
    				break;
    			case SocketControl.CONNECTED:
    				scope.disconnect();
    				break;
    			case SocketControl.ERROR:
    				scope.connect();
    				break;
      		}
      	});
      	this.update();
      }
    },
    update: function(){
    	var scope = this;
  
    	switch(this.state){
    	   case SocketControl.DISCONNECTED:
    		this._properties.disconnect_func(scope._properties.trigger);
    		break;
    	   case SocketControl.CONNECTED:
    	   	this._properties.connect_func(scope._properties.trigger);
    	   	break;
    	   case SocketControl.ERROR:
    	   	this._properties.error_func(scope._properties.trigger);
    	   	break;
    	}
    },
    disconnect: function(){
    	this.ws.onclose = function () {}; // disable onclose handler first
      this.ws.close();
      this.state = SocketControl.DISCONNECTED;
      this.update();
    },
    connect: function() {
      var scope = this;
      this.ws = new WebSocket("ws://localhost:3015");
      scope.state = SocketControl.DISCONNECTED;
  
      this.ws.onopen = function() {
        scope.state = SocketControl.CONNECTED;
        scope.update();
      };
      this.ws.onclose = function() {
        scope.state = SocketControl.DISCONNECTED;
        scope.update();
      };
      this.ws.onerror = function() {
        scope.state = SocketControl.ERROR;
        scope.update();
      };
      this.ws.onmessage = function(evt) {
          if(evt.data){
            try{
              console.log('↑');//, evt.data);
            }
            catch(e){
              console.log("ERROR", e, evt.data);
              scope.state = SocketControl.ERROR;
            }
          }
      	scope.update();
      }
    },
    sendUpdateMsg: function(delay=0){
      this.sendMessageAt('u\n', delay);
    },
    /**
     * No ACK-checking, UDP style.
     */
    sendMessage: function(msgString) {
      if(this.state != SocketControl.CONNECTED) return;
  	    try{
  	    	this.ws.send(msgString);
  		    console.log('↓', msgString);
  	    }
  	    catch(e){
  	    		console.error('ERROR SENSING', msgString);
  	    	}
      	return true;
    }, 
    sendMessageAt: function(msgString, timeFromNow, updateFN){
      if(_.isUndefined(updateFN)) var updateFN = function(){};
      if(timeFromNow == 0){ this.sendMessage(msgString); updateFN(); return; }
      var scope = this;
      setTimeout(function(){
        scope.sendMessage(msgString);
        updateFN();
      }, timeFromNow);
    }
  }