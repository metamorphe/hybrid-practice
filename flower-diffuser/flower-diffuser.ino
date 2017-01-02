//************************ NEOPIXEL PLASMA ************************//
// Convenient 2D point structure
struct Point {
  float x;
  float y;
};

float phase = 0.0;
float phaseIncrement = 0.01;  // Controls the speed of the moving points. Higher == faster. I like 0.08 .
float colorStretch = 0.11; // Higher numbers will produce tighter color bands. I like 0.11 .


//******** Neopixel *********** //
#include <Adafruit_DotStar.h>
#include <avr/power.h>

#define NUMPIXELS 4
// Here's how to control the LEDs from any two pins:
#define DATAPIN    3
#define CLOCKPIN   4
Adafruit_DotStar strip = Adafruit_DotStar(
  NUMPIXELS, DATAPIN, CLOCKPIN, DOTSTAR_BGR);


uint32_t leaf_green    = strip.Color(30, 44, 0);
uint32_t green         = strip.Color(0, 24, 0);
uint32_t mediumSeaGreen       = strip.Color(12, 36, 23);
uint32_t mediumSpringGreen    = strip.Color(0, 50, 20);
uint32_t lightGreen       = strip.Color(10, 50, 10);
uint32_t aquamarine       = strip.Color(25, 51, 42);
uint32_t turquoise        = strip.Color(13, 45, 42);
uint32_t mediumTurquoise  = strip.Color(14, 42, 41);

void setup() {
  
  // Dotstar setup
  strip.begin();
  strip.show(); // Initialize all pixels to 'off'
}

void loop() {
  // put your main code here, to run repeatedly:
  //cycle_color_flash(30, 44, 0, 0, 24, 0);
  //cycle_color_flash(0, 24, 0, 12, 36, 23);
  //cycle_color_flash(12, 36, 23, 0, 50, 20);
  //cycle_color_flash(

  neopixel_plasma();
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

/*
    Multicolored Plasma for the Arduino Micro-Controller and NeoPixel Shield
    Copyright (C) 2013 John Ericksen
    https://github.com/johncarl81/neopixelplasma/blob/master/neopixelplasma.ino
    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.
    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.
    You should have received a copy of the GNU General Public License
    along with this program.  If not, see http://www.gnu.org/licenses/.
*/

// 12 LEDs in HERE
// This function is called every frame.
void neopixel_plasma() {
  phase += phaseIncrement;
  
  // The two points move along Lissajious curves, see: http://en.wikipedia.org/wiki/Lissajous_curve
  // We want values that fit the LED grid: x values between 0..13, y values between 0..8 .
  // The sin() function returns values in the range of -1.0..1.0, so scale these to our desired ranges.
  // The phase value is multiplied by various constants; I chose these semi-randomly, to produce a nice motion.
  Point p1 = { (sin(phase*1.000)+1.0) * 4.5, (sin(phase*1.310)+1.0) * 4.0 };
  Point p2 = { (sin(phase*1.770)+1.0) * 4.5, (sin(phase*2.865)+1.0) * 4.0 };
  Point p3 = { (sin(phase*0.250)+1.0) * 4.5, (sin(phase*0.750)+1.0) * 4.0 };
  
  byte row, col;
  
  // For each row...
  for( row=0; row<10; row++ ) {
    float row_f = float(row);  // Optimization: Keep a floating point value of the row number, instead of recasting it repeatedly.
    
    // For each column...
    for( col=0; col<10; col++ ) {
      float col_f = float(col);  // Optimization.
      
      // Calculate the distance between this LED, and p1.
      Point dist1 = { col_f - p1.x, row_f - p1.y };  // The vector from p1 to this LED.
      float distance1 = sqrt( dist1.x*dist1.x + dist1.y*dist1.y );
      
      // Calculate the distance between this LED, and p2.
      Point dist2 = { col_f - p2.x, row_f - p2.y };  // The vector from p2 to this LED.
      float distance2 = sqrt( dist2.x*dist2.x + dist2.y*dist2.y );
      
      // Calculate the distance between this LED, and p3.
      Point dist3 = { col_f - p3.x, row_f - p3.y };  // The vector from p3 to this LED.
      float distance3 = sqrt( dist3.x*dist3.x + dist3.y*dist3.y );
      
      // Warp the distance with a sin() function. As the distance value increases, the LEDs will get light,dark,light,dark,etc...
      // You can use a cos() for slightly different shading, or experiment with other functions. Go crazy!
      float color_1 = distance1;  // range: 0.0...1.0
      float color_2 = distance2;
      float color_3 = distance3;
      float color_4 = (sin( distance1 * distance2 * colorStretch )) + 2.0 * 0.5;
      
      // Square the color_f value to weight it towards 0. The image will be darker and have higher contrast.
      color_1 *= color_1 * color_4;
      color_2 *= color_2 * color_4;
      color_3 *= color_3 * color_4;
      color_4 *= color_4;
 
      // Scale the color up to 0..7 . Max brightness is 7.
      //strip.setPixelColor(col + (8 * row), strip.Color(color_4, 0, 0) );
      strip.setPixelColor(col + (8 * row), strip.Color(color_1, color_2, color_3));
      //strip.setPixelColor(col + (8 * row)+LEDS_HERE_START, strip.Color(color_1/4, color_2, color_3*5));
    }
  }
  strip.show();
}
