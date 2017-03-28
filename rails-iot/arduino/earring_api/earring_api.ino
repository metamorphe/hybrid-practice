/*  Map Port API
 *  Updated 27 March 2017
 *  Author: Molly Nicholas
 */
 
#include <Adafruit_NeoPixel.h>
#define BAUD 115200

// SENSORS AND ACTUATOR PINS
#define NUMPIXELS 12 // Number of LEDs in strip
#define NEOPIXEL_PIN 6
Adafruit_NeoPixel strip = Adafruit_NeoPixel(NUMPIXELS, NEOPIXEL_PIN, NEO_GRB + NEO_KHZ800);

void update() {
  strip.show();
}

void registerActuators() {
  strip.begin();
  strip.show(); // Initialize all pixels to 'off'
}

void registerSensors() {
  
}

// API PROCESSING
char prefix = 0;
char buffer = ' ';
uint16_t id = 0;
uint8_t r = 0;
uint8_t g = 0;
uint8_t b = 0;


/* SANDBOX API */
void color_change(){
  id = Serial.parseInt();
  r = Serial.parseInt();
  g = Serial.parseInt();
  b = Serial.parseInt();
  Serial.print("id: ");
  Serial.println(id);
  Serial.print("r: ");
  Serial.println(r);
  Serial.print("g: ");
  Serial.println(g);
  Serial.print("b: ");
  Serial.println(b);
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
   Serial.print("prefix: ");
   Serial.println(prefix);
   switch (prefix) {
    case 'u': 
      update();
      findCommandEnd();
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
  Serial.begin(BAUD);
  Serial.println("Aesthetic Actuation Controller - Earring");
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

