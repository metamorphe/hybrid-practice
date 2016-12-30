//******** Neopixel *********** //
#include <Adafruit_NeoPixel.h>
#include <avr/power.h>

#define NEOPIXEL_PIN 1
#define NUM_LEDS 1
Adafruit_NeoPixel strip = Adafruit_NeoPixel(NUM_LEDS, NEOPIXEL_PIN, NEO_GRB + NEO_KHZ800);

uint32_t leaf_green    = strip.Color(30, 44, 0);
uint32_t green         = strip.Color(0, 24, 0);
uint32_t mediumSeaGreen       = strip.Color(12, 36, 23);
uint32_t mediumSpringGreen    = strip.Color(0, 50, 20);
uint32_t lightGreen       = strip.Color(10, 50, 10);
uint32_t aquamarine       = strip.Color(25, 51, 42);
uint32_t turquoise        = strip.Color(13, 45, 42);
uint32_t mediumTurquoise  = strip.Color(14, 42, 41);

void setup() {
  // Neopixel setup
  strip.begin();
  strip.show(); // Initialize all pixels to 'off'
  strip.setBrightness(50);
}

void loop() {
  // put your main code here, to run repeatedly:
  cycle_color_flash(30, 44, 0, 0, 24, 0);
  cycle_color_flash(0, 24, 0, 12, 36, 23);
  cycle_color_flash(12, 36, 23, 0, 50, 20);
  //cycle_color_flash(
  

}

void cycle_color_flash(int rStart, int gStart, int bStart, int rEnd, int gEnd, int bEnd) {
  int Rstart = rStart;
  int Gstart = gStart;
  int Bstart = bStart;

  int Rend = rEnd;
  int Gend = gEnd;
  int Bend = bEnd;
  int n = 100;
  for(int i = 0; i < n; i++) {// larger values of 'n' will give a smoother/slower transition.
    for(int j = 0; j<strip.numPixels(); j++) {
      float Rnew = Rstart + (Rend - Rstart) * i / n;
      float Gnew = Gstart + (Gend - Gstart) * i / n;
      float Bnew = Bstart + (Bend - Bstart) * i / n;
      strip.setPixelColor(j, strip.Color(Rnew, Gnew, Bnew));
    }
    strip.show();
    delay(10);
  }  
}
