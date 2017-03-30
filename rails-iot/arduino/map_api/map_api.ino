/*  Map Port API
 *  Updated 10 March 2017
 *  Author: Cesar Torres
 */
 
#include <Adafruit_DotStar.h>
#include <SPI.h>         // COMMENT OUT THIS LINE FOR GEMMA OR TRINKET
//#include <avr/power.h> // ENABLE THIS LINE FOR GEMMA OR TRINKET
#define BAUD 19200
// SENSORS AND ACTUATOR PINS
#define NUMPIXELS 16 // Number of LEDs in strip
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
  strip.setPixelColor(0,0xe5e619);
  strip.setPixelColor(1,0x19e65d);
  strip.setPixelColor(2,0xe619a1);
  strip.setPixelColor(3,0x19e5e6);
  strip.setPixelColor(4,0xe6a219);
  strip.setPixelColor(5,0x19e680);
  strip.setPixelColor(6,0xe61919);
  strip.setPixelColor(8,0xffffff);
  strip.setPixelColor(7,0x19e65d);
  strip.setPixelColor(9,0xffffff);
  strip.setPixelColor(10,0xe6a219);
  strip.setPixelColor(11,0x3b19e6);
  strip.setPixelColor(12,0xe61919);
  strip.setPixelColor(13,0xe63b19);
  strip.setPixelColor(14,0xe5e619);
  strip.setPixelColor(15,0x19e6a2);
  update();
}

void registerSensors(){
  // add all setup commands for sensors here
}

// API PROCESSING
char prefix = 0;
char buffer = ' ';
uint16_t d_id = 0;
uint16_t id = 0;
uint8_t r = 0;
uint8_t g = 0;
uint8_t b = 0;


/* SANDBOX API */
void color_change(){
  d_id = Serial.parseInt();
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
      Serial.println("API command does not exist");
      findCommandEnd(); 
    break;
  }
}

void setup() {
  Serial.begin(19200);
  Serial.println(": Aesthetic Actuation Controller - Map");
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

