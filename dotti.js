
var util = require('util');
var events = require('events');


var DottiCommands = {
    SET_LED: 0x0702,
    SET_LED_ALL: 0x0601,
    SET_LED_ROW: 0x0704,
    SET_LED_COLUMN: 0x0703,
    MODE: 0x0405,
    SYNC_TIME: 0x0609,
    ANIMATION_SPEED: 0x0415,
    SAVE_SCREEN: 0x0607,
    LOAD_SCREEN: 0x0608
}

var DottiModes = {
    DEFAULT_ON_ICON: 0x00,
    ANIMATION: 0x01,
    CLOCK: 0x02,
    DICE_GAME: 0x03,
    BATTERY: 0x04,
    SCREEN_OFF: 0x05
}

// The first byte of the two-byte [COMMAND, iconID] message, except for DEFAULT
var DottiIconCommands = {
    DEFAULT: 0x0000, // 2-byte value, technically NOTIFICATION with iconID 0.
    NOTIFICATION: 0x00,
    ANIMATION: 0x01,
    OTHER: 0x02
}

var Dotti = function(characteristic, log) {
    this.characteristic = characteristic;
    this.log = log;
}

// Utility functions

Dotti.prototype.toggleOnOff = function(turnOn, callback) {
    this.log.debug("toggleOnOff", turnOn, callback);
    this.changeMode(turnOn ? DottiModes.DEFAULT_ON_ICON : DottiModes.SCREEN_OFF, callback)
}

// Low-level functions
Dotti.prototype.changeMode = function(mode, callback) {
    this.log.debug("changeMode", mode, callback);
    var data = Buffer(3)
    data.writeUInt16BE(DottiCommands.MODE, 0);
    data.writeUInt8(mode & 0xFF, 2);
    this.characteristic.write(data, false, callback);
}

/*
 * Save/load screen options: (zero-based index)
 *
 * 0x0000 - default on icon
 * 0x00?0 - notification where ? is 1 + index, 9 total
 *          Factory install: 5 standard, 4 user-selected
 * 0x01?0 - animations where ? is index, limit 8 total
 * 0x02?0 - favorites where ? is 8 + index, 8 total
 * 0x02?0 - game where ? is index, 6 total
 *
 * 0x0405 - change mode
 *
 * For others see docs.
 */

Dotti.prototype.saveScreen = function(command, byteID, callback) {
    var data = Buffer(4)
    data.writeUInt16BE(DottiCommands.SAVE_SCREEN, 0);
    data.writeUInt8(command, 2);
    data.writeUInt8(byteID, 3);
    this.characteristic.write(data, false, callback);
}

Dotti.prototype.loadScreen = function(command, byteID, callback) {
    this.log.debug("loadScreen", command, byteID, callback);
    var data = Buffer(4)
    data.writeUInt16BE(DottiCommands.LOAD_SCREEN, 0);
    data.writeUInt8(command, 2);
    data.writeUInt8(byteID, 3);
    this.characteristic.write(data, false, callback);
}

// Write a three-byte RGB color.

Buffer.prototype.writeRGBColor24BE = function(rgb, offset) {
    this.writeUInt8(rgb.r, offset);
    this.writeUInt8(rgb.g, offset+1);
    this.writeUInt8(rgb.b, offset+2);
}

// All writes must have withoutResponse=false or they will fail.
Dotti.prototype.showRGB = function(rgb, callback) {
    var data = Buffer(5)
    data.writeUInt16BE(DottiCommands.SET_LED_ALL, 0);
    data.writeRGBColor24BE(rgb, 2)
    this.characteristic.write(data, false, callback);
}

// Dotti can drop pixels if they're sent too quickly, so writing a whole image should be serialized.
// It's probably better to to use the available apps for this.
Dotti.prototype.drawPixel = function(pixelID, rgb, callback) {
    if (pixelID < 0 || pixelID > 63) { if (callback) {callback();} return };
    var data = Buffer(6)
    data.writeUInt16BE(DottiCommands.SET_LED, 0);
    data.writeUInt8(pixelID, 2);
    data.writeRGBColor24BE(rgb, 3)
    this.characteristic.write(data, false, callback);
}

// For convenience, you can also save/load the default icon by passing in -1
Dotti.prototype.saveFavoriteIcon = function(iconID, callback) {
    if (iconID < -1 || iconID > 8) { if (callback) {callback();} return };
    if (iconID == -1) {
        this.saveScreen(DottiIconCommands.NOTIFICATION, 0, callback);
    } else {
        var byteID = 0b10000000 + (iconID<<4);
        this.saveScreen(DottiIconCommands.OTHER, byteID, callback);
    }
}

Dotti.prototype.loadFavoriteIcon = function(iconID, callback) {
    this.log.debug("loadFavoriteIcon", iconID, callback);
    if (iconID < -1 || iconID > 8) { if (callback) {callback();} return };
    if (iconID == -1) {
        this.loadScreen(DottiIconCommands.NOTIFICATION, 0, callback);
    } else {
        var byteID = 0b10000000 + (iconID<<4);
        this.loadScreen(DottiIconCommands.OTHER, byteID, callback);
    }
}

exports.Dotti = Dotti;
exports.DottiCommands = DottiCommands;
exports.DottiModes = DottiModes;

