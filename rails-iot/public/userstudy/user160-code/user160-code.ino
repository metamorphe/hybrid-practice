#include <Adafruit_DotStar.h>
// Because conditional #includes don't work w/Arduino sketches...
//#include <SPI.h>         // COMMENT OUT THIS LINE FOR GEMMA OR TRINKET
#include <avr/power.h> // ENABLE THIS LINE FOR GEMMA OR TRINKET

#define NUMPIXELS 4 // Number of LEDs in strip

// Here's how to control the LEDs from any two pins:
#define DATAPIN    3
#define CLOCKPIN   4 
Adafruit_DotStar strip = Adafruit_DotStar(
  NUMPIXELS, DATAPIN, CLOCKPIN, DOTSTAR_BGR);

//brightness control
float t = 0;
int x = 0;

void setup() {

#if defined(__AVR_ATtiny85__) && (F_CPU == 16000000L)
  clock_prescale_set(clock_div_1); // Enable 16 MHz on Trinket
#endif
  strip.begin(); // Initialize pins for output
  strip.show();  // Turn all LEDs off ASAP


  strip.setPixelColor(0,0xe619c3);
  strip.setPixelColor(1,0x19e5e6);
  strip.setPixelColor(2,0xe5e619);
  strip.setPixelColor(3,0xffffff);
  
  float t = 0;
  for (int x = 0; x < 100; x += 1) {
    t += 0.01;
    strip.setBrightness(pow(t, 3) * 100);
     strip.show();
     delay(x);
  }
 
}
int delay_time = 100;
void loop() {
  strip.show();
  
  // ease in
  /*
  float t = 0;
  for (int x = 0; x < 100; x += 1) {
    t += 0.1;
    delay(pow(t, 3) * x);
    strip.setBrightness(x);
  }
  */


}
