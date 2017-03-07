#include <Adafruit_DotStar.h>
#include <SPI.h>         // COMMENT OUT THIS LINE FOR GEMMA OR TRINKET
//#include <avr/power.h> // ENABLE THIS LINE FOR GEMMA OR TRINKET

#define NUMPIXELS 25 // Number of LEDs in strip
//`16 // Number of LEDs in strip
#define DATAPIN    3
#define CLOCKPIN   4 
Adafruit_DotStar strip = Adafruit_DotStar(
  NUMPIXELS, DATAPIN, CLOCKPIN, DOTSTAR_BGR);
  
uint16_t id = 0;
uint8_t r = 0;
uint8_t g = 0;
uint8_t b = 0;
char prefix = 0;
char buffer = ' ';


int potValue = 0;
void update(){
  strip.show();
  strip.show();
}

void initActuators(){
  strip.begin(); // Initialize pins for output
  strip.show();  // Turn all LEDs off ASAP
//  strip.setPixelColor(11,0x3b19e6);
//  strip.setPixelColor(12,0xe61919);
//  strip.setPixelColor(3,0x19e5e6);
//  strip.setPixelColor(4,0xe6a219);
//  strip.setPixelColor(5,0x19e680);
//  strip.setPixelColor(6,0xe61919);
//  strip.setPixelColor(14,0xe5e619);
//  strip.setPixelColor(2,0xe619a1);
//  strip.setPixelColor(8,0xffffff);
//  strip.setPixelColor(7,0x19e65d);
//  strip.setPixelColor(10,0xe6a219);
//  strip.setPixelColor(9,0xffffff);
//  strip.setPixelColor(15,0x19e6a2);
//  strip.setPixelColor(1,0x19e65d);
//  strip.setPixelColor(0,0xe5e619);
//  strip.setPixelColor(13,0xe63b19);

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
void initSensors(){
  pinMode(A0, INPUT);
}

void setup() {
  #if defined(__AVR_ATtiny85__) && (F_CPU == 16000000L)
    clock_prescale_set(clock_div_1); // Enable 16 MHz on Trinket
  #endif
  Serial.begin(115200);
  Serial.print("I am the Luminaire with ");
  Serial.print(NUMPIXELS);
  Serial.println(" pixels!");
  initActuators();
  initSensors();
}

void dim(){
  for(int i = 0; i < NUMPIXELS; i++){
     strip.setPixelColor(i, 30, 30, 30);
  }
  strip.show(); 
}

void all_on(){
  for(int i = 0; i < NUMPIXELS; i++){
     strip.setPixelColor(i, 255, 255, 255);
  }
  strip.show(); 
}


void all_off(){
  for(int i = 0; i < NUMPIXELS; i++){
     strip.setPixelColor(i, 0, 0, 0);
  }
  strip.show(); 
}

void color_change(){
  id = Serial.parseInt();
  r = Serial.parseInt();
  g = Serial.parseInt();
  b = Serial.parseInt();         
  strip.setPixelColor(id, r, g, b);
//  strip.show();
}
void findCommandEnd(){
  while(Serial.available() > 0){
    buffer = Serial.read();
    if(buffer == '\n') break;
  }
}
/* SANDBOX API */

void api_call(char prefix){
  switch (prefix) {
    case 'p': 
      Serial.println("API COMMANDS");
      Serial.println("o - ALL ON");
      Serial.println("f - ALL OFF");
      Serial.println("c - COLORCHANGE(id, r, g, b)");
      Serial.println("u - UPDATE");
      findCommandEnd();   
      break;
    case 'o':
      Serial.println("ALL ON");
      all_on();
      findCommandEnd();
      break;
    case 'f':
      Serial.println("ALL OFF");
      all_off();
      findCommandEnd();
      break;
    case 'd':
      Serial.println("DIM");
      dim();
      findCommandEnd();
      break;
    case 'c': 
       color_change();
       findCommandEnd();
      
       Serial.print("CHANGING: ");
       Serial.print(id);
         Serial.print(",");
       Serial.print(r);
         Serial.print(",");
       Serial.print(g);
         Serial.print(",");
       Serial.println(b);
       break;
    case 'u': 
      Serial.println("UPDATE STRIP");
      update();
      findCommandEnd();
      break;
    default: 
      Serial.print(prefix);
      Serial.println(" API command does not exist");
      findCommandEnd();
      break;
  }
}


void enable_api(){
   // Listening for character input for Serial console
  if (Serial.available() > 0) {
      // read the incoming byte:
      prefix = Serial.read();
//      if(Serial.read() == '\n'){
       Serial.print("Calling API Command: ");
       Serial.print(prefix);
       Serial.print(" ");
       api_call(prefix);
//    }
  }
  delay(5);              // wait for a 50 milliseconds
}


void loop() {
  enable_api();
//  test();
}


