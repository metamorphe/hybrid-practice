# COMMAND LINE ARGUMENT 
# e.g. ard_generator.py -n 10  -f  -t

# file 
# "#DEFINE NUM_OF_LEDS"
# # ...
# + num_leds + 
# file << "END OF CODE"

# OUTPUT FILE

import argparse

parser = argparse.ArgumentParser(description='Generate code for Arduino')
parser.add_argument('leds', type=int, help='number of LEDs', metavar='n')

args = parser.parse_args()

# 'base.txt' should be name of arduino code template file
f = open('base.txt', 'r')

arg = parser.parse_args()

line = f.readline()
pre = ""
while line != "#DEFINE NUM_OF_LEDS\n":
	pre += line
	line = f.readline()
line = line[0:-1] + " " + str(arg.leds) + "\n"
post = f.read()

# 'traffic.txt' is resulting file name
name = "traffic.txt"
r = open(name, 'w')
r.write(pre)
r.write(line)
r.write(post)
r.close();