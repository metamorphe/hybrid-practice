#include <Adafruit_DotStar.h>
// Because conditional #includes don't work w/Arduino sketches...
#include <SPI.h>         // COMMENT OUT THIS LINE FOR GEMMA OR TRINKET
//#include <avr/power.h> // ENABLE THIS LINE FOR GEMMA OR TRINKET

#define NUMPIXELS 16 // Number of LEDs in strip

// Here's how to control the LEDs from any two pins:
#define DATAPIN    3
#define CLOCKPIN   4 
Adafruit_DotStar strip = Adafruit_DotStar(
  NUMPIXELS, DATAPIN, CLOCKPIN, DOTSTAR_BGR);

void setup() {
//
//#if defined(__AVR_ATtiny85__) && (F_CPU == 16000000L)
//  clock_prescale_set(clock_div_1); // Enable 16 MHz on Trinket
//#endif
  strip.begin(); // Initialize pins for output
  strip.show();  // Turn all LEDs off ASAP
}

void loop() {
  strip.setPixelColor(11,0x3b19e6);
  strip.setPixelColor(12,0xe61919);
  strip.setPixelColor(3,0x19e5e6);
  strip.setPixelColor(4,0xe6a219);
  strip.setPixelColor(5,0x19e680);
  strip.setPixelColor(6,0xe61919);
  strip.setPixelColor(14,0xe5e619);
  strip.setPixelColor(2,0xe619a1);
  strip.setPixelColor(8,0xffffff);
  strip.setPixelColor(7,0x19e65d);
  strip.setPixelColor(10,0xe6a219);
  strip.setPixelColor(9,0xffffff);
  strip.setPixelColor(15,0x19e6a2);
  strip.setPixelColor(1,0x19e65d);
  strip.setPixelColor(0,0xe5e619);
  strip.setPixelColor(13,0xe63b19);
  strip.show(); 
}
