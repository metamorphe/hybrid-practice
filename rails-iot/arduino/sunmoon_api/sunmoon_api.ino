/*  Sunmoon Port API
 *  Updated 10 March 2017
 *  Author: Cesar Torres
 */
#define DEBUG 0
 
#include <Adafruit_DotStar.h>
#include <SPI.h>         // COMMENT OUT THIS LINE FOR GEMMA OR TRINKET
//#include <avr/power.h> // ENABLE THIS LINE FOR GEMMA OR TRINKET
#define BAUD 19200
// SENSORS AND ACTUATOR PINS
#define NUMPIXELS 25 // Number of LEDs in strip
#define DATAPIN    3
#define CLOCKPIN   4 
Adafruit_DotStar strip = Adafruit_DotStar(
  NUMPIXELS, DATAPIN, CLOCKPIN, DOTSTAR_BGR);
void update(){
  strip.show();
  strip.show();
}
void registerActuators(){
  strip.begin(); // Initialize pins for output
  strip.show();  // Turn all LEDs off ASAP
  strip.setPixelColor(16,0xe5e619);
  strip.setPixelColor(17,0xe5e619);
  strip.setPixelColor(18,0xe5e619);
  strip.setPixelColor(19,0xe5e619);
  strip.setPixelColor(15,0xe5e619);
  strip.setPixelColor(14,0xe5e619);
  strip.setPixelColor(23,0xffffff);
  strip.setPixelColor(20,0x195de6);
  strip.setPixelColor(12,0x19a1e6);
  strip.setPixelColor(13,0x19a1e6);
  strip.setPixelColor(11,0x19a1e6);
  strip.setPixelColor(0,0xe65e19);
  strip.setPixelColor(1,0xe65e19);
  strip.setPixelColor(2,0xe65e19);
  strip.setPixelColor(4,0xe65e19);
  strip.setPixelColor(3,0xe65e19);
  strip.setPixelColor(6,0xe65e19);
  strip.setPixelColor(5,0xe65e19);
  strip.setPixelColor(7,0xe65e19);
  strip.setPixelColor(8,0xe65e19);
  strip.setPixelColor(9,0xe65e19);
  strip.setPixelColor(22,0x195de6);
  strip.setPixelColor(21,0x195de6);
  strip.setPixelColor(10,0xe65e19);
  strip.setPixelColor(24,0xffffff);
  update();
}

void registerSensors(){
  // add all setup commands for sensors here
}

// API PROCESSING
char prefix = 0;
char buffer = ' ';
uint16_t devID = 0;
uint16_t id = 0;
uint8_t r = 0;
uint8_t g = 0;
uint8_t b = 0;


// STATE MACHINE
char state = ' ';
char prevState = ' ';
bool off = false; // ARTIFICIAL TURN OFF (UNBINDS API)

/* SANDBOX API */
void color_change(){
  devID = Serial.parseInt();
  id = Serial.parseInt();
  r = Serial.parseInt();
  g = Serial.parseInt();
  b = Serial.parseInt();
  strip.setPixelColor(id, r, g, b);  
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
   switch (prefix) {
    case 'p': 
      findCommandEnd();     
      break;
    case 'u': 
      update();
      findCommandEnd();
      break;
    case 'c':
      color_change();
      findCommandEnd(); 
      break;
    default: 
      Serial.print(prefix);
      Serial.println(" API command does not exist");
      findCommandEnd(); 
    break;
  }
}

void setup() {
  Serial.begin(BAUD);
  if (DEBUG == 1) {
    Serial.println("Aesthetic Actuation Controller - Sunmoon");
  }
  registerActuators();
  registerSensors();
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

