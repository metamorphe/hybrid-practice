function awakeAndForgotten(){
	bm.init();
	bm.play("AWAKE", 0);
	bm.play("READY", 2000);
	bm.play("BORED", 3000);
	bm.play("FALL_ASLEEP", 3000);
	bm.play("POWER_DOWN", 3000);
}

bm.run = awakeAndForgotten();
