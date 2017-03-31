/*************************************************** 
  This is an example for our Adafruit 16-channel PWM & Servo driver
  PWM test - this will drive 16 PWMs in a 'wave'

  Pick one up today in the adafruit shop!
  ------> http://www.adafruit.com/products/815

  These displays use I2C to communicate, 2 pins are required to  
  interface. For Arduino UNOs, thats SCL -> Analog 5, SDA -> Analog 4

  Adafruit invests time and resources providing this open source code, 
  please support Adafruit and open-source hardware by purchasing 
  products from Adafruit!

  Written by Limor Fried/Ladyada for Adafruit Industries.  
  BSD license, all text above must be included in any redistribution
 ****************************************************/
#define DEBUG 0

#include <Wire.h>
#include <Adafruit_PWMServoDriver.h>

#define BAUD 9600
#define NUM_DEVICES 2

Adafruit_PWMServoDriver pwmDriver[NUM_DEVICES] = {
  Adafruit_PWMServoDriver(), // default address is 0x40;
  Adafruit_PWMServoDriver(0x41) // soldered so second address is 0x41;
};

void update() {
  // This PWM driver handles this
}

void registerActuators() {
  for(int i = 0; i < NUM_DEVICES; i++) {
    pwmDriver[i].begin();
    pwmDriver[i].setPWMFreq(1000);
  }
}

void registerSensors() {
  
}

// API PROCESSING
char prefix = 0;
char buffer = ' ';
uint16_t devID = 0;
uint16_t id = 0;
uint16_t val = 0;

void brightnessChange() {
  devID = Serial.parseInt();
  id = Serial.parseInt();
  val = Serial.parseInt();
  uint16_t non = Serial.parseInt();
  uint16_t sense = Serial.parseInt();
  if (DEBUG == 1) {
    Serial.print("devID: ");
    Serial.println(devID);
    Serial.print("id: ");
    Serial.println(id);
    Serial.print("val: ");
    Serial.println(val); 
  }
  pwmDriver[devID].setPin(id, (val*50)%4096);
  //pwm41.setPin(channel, (i + (1024/16)*channel) % 4096);
}

void findCommandEnd(){
  buffer = ' ';
  while(buffer != '\n'){
    if(Serial.available() > 0){
      buffer = Serial.read();
    } 
  }
}

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
    case 'c':
      brightnessChange();
      findCommandEnd(); 
      break;
    default: 
      Serial.print(prefix);
      Serial.println("API command does not exist");
      findCommandEnd(); 
    break;
  }
}

void setup() {
  Serial.begin(BAUD);
  if (DEBUG) {
    Serial.println("16 channel PWM test!");
  }
  registerActuators();
}

void enable_api(){
  if (Serial.available() > 0) {
       prefix = Serial.read();
       api_call(prefix);
  }
}


void non_block_delay(char s, int delay){
  Serial.print("T:");
  Serial.print(s);
  Serial.print(" ");
  Serial.print(delay);
  Serial.println();
}

void loop() {
  enable_api(); // always on
}

// saved for posterity
void createWave(){
  // Drive each PWM in a 'wave'
  // increasing the amount "i" is incremented by speeds up the animation.
  for (uint16_t i=0; i<4096; i += 32) {
    for (uint8_t channel=0; channel < 16; channel++) {
      //                     on    off
      //pwm41.setPin(channel, (i + (1024/16)*channel) % 4096);
      //pwm40.setPin(channel, (i + (1024/16)*channel) % 4096);
    }
  }
}

