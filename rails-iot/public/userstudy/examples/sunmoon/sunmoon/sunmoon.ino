#include <Adafruit_DotStar.h>
// Because conditional #includes don't work w/Arduino sketches...
//#include <SPI.h>         // COMMENT OUT THIS LINE FOR GEMMA OR TRINKET
#include <avr/power.h> // ENABLE THIS LINE FOR GEMMA OR TRINKET

#define NUMPIXELS 25 // Number of LEDs in strip

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

  float t = 0;
  for (int x = 0; x < 100; x += 1) {
    t += 0.01;
    strip.setBrightness(pow(t, 3) * 100);
    strip.show();
    delay(x);
  }
}

void loop() {
  strip.show();
}
