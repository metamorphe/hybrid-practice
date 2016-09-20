/*********************************************************
This is a library for the MPR121 12-channel Capacitive touch sensor

Designed specifically to work with the MPR121 Breakout in the Adafruit shop 
  ----> https://www.adafruit.com/products/

These sensors use I2C communicate, at least 2 pins are required 
to interface

Adafruit invests time and resources providing this open source code, 
please support Adafruit and open-source hardware by purchasing 
products from Adafruit!

Written by Limor Fried/Ladyada for Adafruit Industries.  
BSD license, all text above must be included in any redistribution
**********************************************************/

#include <Wire.h>
#include "Adafruit_MPR121.h"

// You can have up to 4 on one i2c bus but one is enough for testing!
Adafruit_MPR121 cap = Adafruit_MPR121();

const int numReadings = 10;

int readIndex = 0;              // the index of the current reading
 
uint16_t readingsZero[numReadings];      // the readings from the analog input
int totalZero = 0;                  // the running total
int averageZero = 0;                // the average
int startAverageZero = 0;

uint16_t readingsOne[numReadings];      // the readings from the analog input
int totalOne = 0;                  // the running total
int averageOne = 0;                // the average
int startAverageOne = 0;

uint16_t readingsTwo[numReadings];      // the readings from the analog input
int totalTwo = 0;                  // the running total
int averageTwo = 0;                // the average
int startAverageTwo = 0;

void setup() {
  while (!Serial);        // needed to keep leonardo/micro from starting too fast!

  Serial.begin(9600);
  Serial.println("Adafruit MPR121 Capacitive Touch sensor test"); 
  
  // Default address is 0x5A, if tied to 3.3V its 0x5B
  // If tied to SDA its 0x5C and if SCL then 0x5D
  if (!cap.begin(0x5A)) {
    Serial.println("MPR121 not found, check wiring?");
    while (1);
  }
  Serial.println("MPR121 found!");

  // initialize all the arrays to 0:
  memset(readingsZero,0,sizeof(readingsZero));
  memset(readingsOne,0,sizeof(readingsOne));
  memset(readingsTwo,0,sizeof(readingsTwo));
}

void loop() {
  /*
  int i = 2;

  totals[i] = totals[i] - readingsMatrix[i][readIndex];
  readingsMatrix[i][readIndex] = cap.filteredData(i);
  totals[i] = totals[i] + readingsMatrix[i][readIndex];
  readIndex++;

  // if we're at the end of the array...
  if (readIndex >= numReadings) {
    // ...wrap around to the beginning:
    readIndex = 0;
    compareAverages[i] = average;
  }

  // calculate the average:
  averages[i] = totals[i] / numReadings;

  //uint16_t comp = compareAverages[i] - averages[i];
  //if ( abs(comp) > 10) {
  if (compareAverages[i] - averages[i] > 5) {
    Serial.println("triggered***************************************");
    compareAverages[i] = averages[i];
  }
  */

  
  // subtract the last reading:
  totalZero = totalZero - readingsZero[readIndex];
  totalOne = totalOne - readingsOne[readIndex];
  totalTwo = totalTwo - readingsTwo[readIndex];
  // read from the sensor:
  readingsZero[readIndex] = cap.filteredData(0);
  readingsOne[readIndex] = cap.filteredData(1);
  readingsTwo[readIndex] = cap.filteredData(2);
  // add the reading to the total:
  totalZero = totalZero + readingsZero[readIndex];
  totalOne = totalOne + readingsOne[readIndex];
  totalTwo = totalTwo + readingsTwo[readIndex];
  // advance to the next position in the array:
  readIndex = readIndex + 1;

  // if we're at the end of the array...
  if (readIndex >= numReadings) {
    // ...wrap around to the beginning:
    readIndex = 0;
    startAverageZero = averageZero;
    startAverageOne = averageOne;
    startAverageTwo = averageTwo;
  }

  // calculate the average:
  averageZero = totalZero / numReadings;
  averageOne = totalOne / numReadings;
  averageTwo = totalTwo / numReadings;

  if ( (startAverageZero - averageZero) > 5) {
    Serial.println("triggered000000000000000000000000000000000000000000");
    startAverageZero = averageZero;
  }

  if ( (startAverageOne - averageOne) > 5) {
    Serial.println("triggered1111111111111111111111111111111111111111111");
    startAverageOne = averageOne;
  }

  if ( (startAverageTwo - averageTwo) > 5) {
    Serial.println("triggered222222222222222222222222222222222222222222");
    startAverageTwo = averageTwo;
  }

  // send it to the computer as ASCII digits
  Serial.print("average: " );
  Serial.println(averageZero);
  delay(1);        // delay in between reads for stability
  
  // put a delay so it isn't overwhelming
  //delay(100);
}
