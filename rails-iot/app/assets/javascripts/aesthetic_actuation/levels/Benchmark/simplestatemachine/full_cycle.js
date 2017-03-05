function fullCycle(){
	bm.init();
	bm.play("AWAKE", 0);
	bm.play("READY", 2000);
	bm.play("BORED", 3000);
	bm.play("PAY_ATTENTION", 1000);
	bm.play("BORED", 3000);
	bm.play("FALL_ASLEEP", 3000);
	bm.play("WAKE_UP", 5000);
	bm.play("FORCE_SLEEP", 1000);
	bm.play("POWER_DOWN", 3000);
}

bm.run = fullCycle();
