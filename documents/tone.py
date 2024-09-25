#!/usr/bin/env python
import RPi.GPIO as GPIO
import time
GPIO.setmode(GPIO.BCM)
GPIO.setwarnings(False)
GPIO.setup(21,GPIO.OUT)
i = 0
while i<200:
	GPIO.output(21,GPIO.HIGH)
	time.sleep(0.0025)
	GPIO.output(21,GPIO.LOW)
	time.sleep(0.0025);
	i=i+1;

