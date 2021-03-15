<p align="center">
    <img src="https://github.com/SeydX/homebridge-printer/blob/main/images/printer_logo.png" height="200">
</p>



# homebridge-printer

[![npm](https://img.shields.io/npm/v/homebridge-printer.svg?style=flat-square)](https://www.npmjs.com/package/homebridge-printer)
[![npm](https://img.shields.io/npm/dt/homebridge-printer.svg?style=flat-square)](https://www.npmjs.com/package/homebridge-printer)
[![GitHub last commit](https://img.shields.io/github/last-commit/SeydX/homebridge-printer.svg?style=flat-square)](https://github.com/SeydX/homebridge-printer)
[![verified-by-homebridge](https://badgen.net/badge/homebridge/verified/purple)](https://github.com/homebridge/homebridge/wiki/Verified-Plugins)
[![Discord](https://img.shields.io/discord/432663330281226270?color=728ED5&logo=discord&label=discord)](https://discord.gg/kqNCe2D)
[![Donate](https://img.shields.io/badge/Donate-PayPal-blue.svg?style=flat-square&maxAge=2592000)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=NP4T3KASWQLD8)

**Creating and maintaining Homebridge plugins consume a lot of time and effort, if you would like to share your appreciation, feel free to "Star" or donate.**

[Click here](https://github.com/SeydX) to review more of my plugins.

## Info

This is a dynamic platform plugin for [Homebridge](https://github.com/nfarina/homebridge) to check the state of your ipp (AirPrint) capable printer.

This Plugin creates a Switch Accessory and ContactSensor Accessory with FakeGato functionality. The Switch Accessory shows if the printer is online or offline and the ContactSensor Accessory shows if the printer is printing.

## Installation instructions

After [Homebridge](https://github.com/nfarina/homebridge) has been installed:

-  ```sudo npm i -g homebridge-printer@latest```


## Basic configuration

 ```
{
  "bridge": {
    ...
  },
  "accessories": [
    ...
  ],
  "platforms": [
    {
      "platform": "PrinterPlatform",
      "debug": true,
      "printer":[
        {
          "name": "HP Envy Pro",
          "address": "http://hpf92bab4321ab:631/ipp/printer",
          "polling": 10,
          "manufacturer": "HP",
          "model": "Envy Pro",
          "serialNumber": "12345"
        }
      ]
    }
  ]
}
 ```
 See [Example Config](https://github.com/SeydX/homebridge-printer/blob/master/example-config.json) for more details.

 
 ## Options

| **Attributes** | **Required** | **Usage** |
|------------|----------|-------|
| platform | **Yes** | Must be **PrinterPlatform** |
| debug | **No** | Enables additional output in the log. |
| printer.address | **Yes** | IPP address of the printer. |
| printer.polling | **No** | Printer state polling. (Default: 10s) |
| printer.manufacturer | **No** | Manufacturer name for display in the Home app. |
| printer.model | **No** | Model name for display in the Home app. |
| printer.serialNumber | **No** | Serialnumber for display in the Home app. |

## Supported clients

This plugin has been verified to work with the following apps on iOS 12.2 and iOS 12.3 Beta:

* iOS 14+
* Apple Home
* All 3rd party apps like Elgato Eve etc.
* Homebridge v1.1.6+


## Contributing

You can contribute to this homebridge plugin in following ways:

- [Report issues](https://github.com/SeydX/homebridge-printer/issues) and help verify fixes as they are checked in.
- Review the [source code changes](https://github.com/SeydX/homebridge-printer/pulls).
- Contribute bug fixes.
- Contribute changes to extend the capabilities

Pull requests are accepted.


## Troubleshooting

If you have any issues with the plugin then you can run this plugin in debug mode, which will provide some additional information. This might be useful for debugging issues. Just enable ``debug`` in your config and restart homebridge.
