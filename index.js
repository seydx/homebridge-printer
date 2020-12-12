/**
 * v1.0
 *
 * @url https://github.com/SeydX/homebridge-printer
 * @author SeydX <seyd55@outlook.de>
 *
**/

'use strict';

module.exports = function (homebridge) {
  let PrinterPlatform = require('./src/platform.js')(homebridge);
  homebridge.registerPlatform('homebridge-printer', 'PrinterPlatform', PrinterPlatform, true);
};
