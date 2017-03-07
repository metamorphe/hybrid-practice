function badTurner(){
	bm.init();
	bm.play("AWAKE", 0);
	bm.play("WARN", 1000);
	bm.play("CLOSE_ONE", 1000);
	bm.play("BAD_STRIKE", 1000);
	bm.play("DEATH", 3000);
	bm.play("POWER_DOWN", 2000);
}

bm.run = badTurner();
