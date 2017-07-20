
Create a Homebridge accessory for a WITTI Dotti LED pixel display.

The Dotti appears as a Lightbulb accessory with a custom characteristic to set the "favorite" icon. Zero will turn it "off" (all pixels off) and 1-8 will load the custom icon set via the Dotti app.

Set the "address" valuein the config.json to specify a particular device, otherwise it will connect to the first one it sees.

This is useful for a quick indication of HomeKit state - for example, if your thermostat turns off when you have a window open, you can have the Dotti show an icon when the window is open and the temperature goes outside a specified range.
