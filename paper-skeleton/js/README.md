## Aesthetic Actuators

Available actuators:

	function RotatedBehavior(variable_name, path, upper_bound)
	function Halo(variable_name, path, upper_bound)
	
Each of these actuators has some variable such as "brightness" for Halo, and "degrees" for RotatedBehavior. Each of these behaviors also contains a visual element. For example, the visual representation of the Halo behavior being activated on an LED is a few rings propagated outwards from the LED. The visual representation of the rotation behavior being activated on a servo motor would be a few arrows rotating either clockwise or counterclockwise determined by user input.



### Creating a new artwork
	
	var map = new Artwork("img/map.svg", function(display){
			//...bind behaviors to actuators here
		});
		
##### Initializing an actuator

	var animatedSLight = new Actuator("AnimatedLight", nled);
	
##### Giving an actuator a behavior
	var newhalo = new Halo("brightness", nled, 1024);
	
##### Binding actuator to behavior

	animatedSLight.set(newhalo);
	
With this notation, you may bind multiple behaviors to an actuator.

	var newrotation = new RotatedBehavior("degrees", nled, 360);
	animatedSLight.set(newhalo);
	animatedSLight.set(newrotation);
	
_____

	
###Running code

	run python -m SimpleHTTPServer to properly serve assets


	

	
			
