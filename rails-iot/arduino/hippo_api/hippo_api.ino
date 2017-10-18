#define BAUD 38400
#define DEBUG 0
// https://arduino-info.wikispaces.com/SmallSteppers

/* YourDuino.com Example Software Sketch
   Small Stepper Motor and Driver V1.5 06/21/2017
  http://www.yourduino.com/sunshop/index.php?l=product_detail&p=126
   Steps one revolution of output shaft, then back
   terry@yourduino.com */

/*-----( Import needed libraries )-----*/
#include <Stepper.h>
#include <EEPROM.h>
/*-----( Declare Constants, Pin Numbers )-----*/
//---( Number of steps per revolution of INTERNAL motor in 4-step mode )---
#define STEPS_PER_MOTOR_REVOLUTION 32   

//---( Steps per OUTPUT SHAFT of gear reduction )---
#define STEPS_PER_OUTPUT_REVOLUTION 32 * 64  //2048  

#define SPEED 900
 

/*-----( Declare objects )-----*/
// create an instance of the stepper class, specifying
// the number of steps of the motor and the pins it's
// attached to
//-------------------------------------------------------------
//The pin connections need to be pins 8,9,10,11 connected
// to Motor Driver In1, In2, In3, In4 
//-------------------------------------------------------------

// Then the pins are entered here in the sequence 1-3-2-4 for proper sequencing
Stepper small_stepper(STEPS_PER_MOTOR_REVOLUTION, 8, 10, 9, 11);
// API PROCESSING
char prefix = 0;
char buffer = ' ';
int devID = 0;
int id = 0;
int diffAngle = 0;
int currentAngle = 0;
int angle = 0;
int address = 0;
/*-----( Declare Variables )-----*/
int  stepsToTake;

void setup()   /*----( SETUP: RUNS ONCE )----*/
{
//  EEPROM.write(address, 0);
  Serial.begin(BAUD);
  Serial.println("Aesthetic Stepper Controller - Hippo");
  currentAngle = EEPROM.read(address);
  if(DEBUG){
    Serial.println(currentAngle);
  }
}/*--(end setup )---*/


//void loop()   /*----( LOOP: RUNS CONSTANTLY )----*/
//{
//  moveStepperOne(1);
//  delay(1000);
//  
//  moveStepperOne(-1);
//  delay(2000);
//
//}


void findCommandEnd(){
  buffer = ' ';
  while(buffer != '\n'){
    if(Serial.available() > 0){
      buffer = Serial.read();
    } 
  }
}
int dir = 1;

float revRatio = 1;
void goToAngle(){
  devID = Serial.parseInt();
  id = Serial.parseInt();
  angle = Serial.parseInt();
  diffAngle = (angle - currentAngle) % 360;
  if(diffAngle > 0) dir = 1;
  else dir = -1;
  diffAngle = abs(diffAngle);
  if(diffAngle == 0) return;
  revRatio = float(diffAngle) / 360;
  revRatio = 1.0 / revRatio;
  if(DEBUG){
    Serial.print("goto: ");
    Serial.println(angle);
    Serial.print("from: ");
    Serial.println(currentAngle);
    Serial.print("DIFF: ");
    Serial.println(diffAngle);
    Serial.print("revRatio: ");
    Serial.println(revRatio);
  }
  stepsToTake  =  -1 * dir * STEPS_PER_OUTPUT_REVOLUTION / revRatio;  // Rotate CW 1/x turn
  if(DEBUG){
    Serial.print("steps: ");
    Serial.println(stepsToTake);
  }
  currentAngle = angle;
  EEPROM.write(address, angle);
  small_stepper.setSpeed(SPEED);   
  small_stepper.step(stepsToTake);
  delay(0.3 * diffAngle);
//  stepsToTake  =  dir * STEPS_PER_OUTPUT_REVOLUTION / x;  // Rotate CW 1/x turn
  
}
//void moveStepperOne(int dir) {
//  // if dir is positive, will rotate CW
//  // if dir is negative, will rotate CCW
//  int x = 5;
//  stepsToTake  =  dir * STEPS_PER_OUTPUT_REVOLUTION / x;  // Rotate CW 1/x turn
//  small_stepper.setSpeed(SPEED);   
//  small_stepper.step(stepsToTake);
//}
void update(){}
void api_call(char prefix){
  if (DEBUG == 1) {
    Serial.print("prefix: ");
    Serial.println(prefix);
  }
   switch (prefix) {
    case 'u': 
      update();
      findCommandEnd();
      break;
    case 'a':
      goToAngle();
      findCommandEnd(); 
      break;
    default: 
      Serial.print(prefix);
      Serial.println("API command does not exist");
      findCommandEnd(); 
    break;
  }
}

void loop() {
  enable_api(); // always on
}

void enable_api(){
  if (Serial.available() > 0) {
       prefix = Serial.read();
       api_call(prefix);
  }
}


/* --(end main loop )-- */

/* ( THE END ) */

