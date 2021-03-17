'use strict';

const ipp = require('@sealsystems/ipp');

const Logger = require('./helper/logger.js');
const packageFile = require('../package.json');

//Accessories
const SwitchAccessory = require('./accessories/switch.js');
const ContactAccessory = require('./accessories/contact.js');

//Custom Types
const CustomTypes = require('./types/custom_types.js');
const EveTypes = require('./types/eve_types.js');

const PLUGIN_NAME = 'homebridge-printer';
const PLATFORM_NAME = 'PrinterPlatform';

var Accessory, UUIDGen, FakeGatoHistoryService;

module.exports = function (homebridge) {

  Accessory = homebridge.platformAccessory;
  UUIDGen = homebridge.hap.uuid;
  
  return PrinterPlatform;

};

function PrinterPlatform (log, config, api) {
  
  if (!api||!config) 
    return;

  Logger.init(log, config.debug);
  
  CustomTypes.registerWith(api.hap);
  EveTypes.registerWith(api.hap);
  FakeGatoHistoryService = require('fakegato-history')(api);

  this.api = api;
  this.accessories = [];
  this.config = config;
  
  this.devices = new Map();

  if(this.config.printer && this.config.printer.length) {
  
    this.config.printer.forEach(printer => {
    
      let error = false;

      if (!printer.name) {
        Logger.warn('One of the printer has no name configured. This printer will be skipped.');
        error = true;
      } else if (!printer.address) {
        Logger.warn('There is no address configured for this printer. This printer will be skipped.', printer.name);
        error = true;
      }

      if (!error) {
        
        let options = {
          charset: 'utf-8',
          language: 'en-us',
          version: '2.0'
        };
             
        printer.name = printer.name + ' Sensor';
        printer.switchType = printer.switchType || 'SWITCH';
        printer.printer = ipp.Printer(printer.address, options);
      
        const uuidSwitch = UUIDGen.generate(printer.name);
        
        if (this.devices.has(uuidSwitch)) {
     
          Logger.warn('Multiple devices are configured with this name. Duplicate devices will be skipped.', printer.name);
     
        } else {
          
          printer.type = 'contact';
          printer.polling = Number.isInteger(printer.polling) 
            ?  printer.polling < 1 
              ? 1 
              : printer.polling
            :  10;
          
          this.devices.set(uuidSwitch, printer);
          
          if(printer.switchType === 'SWITCH'){
          
            let config = { ...printer };
            config.name = printer.name.replace('Sensor', 'Switch');
            config.type = 'switch';
            
            const uuidContact = UUIDGen.generate(config.name);
            this.devices.set(uuidContact, config);
          
          }
          
        }
    
      }
      
    });
    
  }

  this.api.on('didFinishLaunching', this.didFinishLaunching.bind(this));
  
}

PrinterPlatform.prototype = {

  didFinishLaunching: async function(){

    for (const entry of this.devices.entries()) {
    
      let uuid = entry[0];
      let device = entry[1];
      
      const cachedAccessory = this.accessories.find(curAcc => curAcc.UUID === uuid);
      
      if (!cachedAccessory) {
      
        const accessory = new Accessory(device.name, uuid);

        Logger.info('Configuring accessory...', accessory.displayName); 
        
        this.setupAccessory(accessory, device);
        
        Logger.info('Configured!', accessory.displayName);
        
        this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
        
        this.accessories.push(accessory);
        
      }
      
    }

    this.accessories.forEach(accessory => {
    
      const device = this.devices.get(accessory.UUID);
      
      try {
      
        if (!device)
          this.removeAccessory(accessory);
    
      } catch(err) {

        Logger.info('It looks like the tv has already been removed. Skip removing.');
        Logger.debug(err);
     
      }
      
    });
  
  },
  
  setupAccessory: function(accessory, device){
    
    accessory.on('identify', () => {
      Logger.info('Identify requested.', accessory.displayName);
    });
    
    const manufacturer = device.manufacturer 
      ? device.manufacturer 
      : 'Homebridge';
      
    const model = device.model
      ? device.model 
      : device.type;
    
    const serialNumber = device.serialNumber
      ? device.serialNumber 
      : 'SerialNumber';
    
    const AccessoryInformation = accessory.getService(this.api.hap.Service.AccessoryInformation);
    
    AccessoryInformation
      .setCharacteristic(this.api.hap.Characteristic.Manufacturer, manufacturer)
      .setCharacteristic(this.api.hap.Characteristic.Model, model)
      .setCharacteristic(this.api.hap.Characteristic.SerialNumber, serialNumber)
      .setCharacteristic(this.api.hap.Characteristic.FirmwareRevision, packageFile.version);
      
    let printer = device.printer;
    
    delete device.printer;
    
    accessory.context.config = device;
    
    switch (device.type) {
      case 'switch':
        new SwitchAccessory(this.api, accessory, this.accessories, printer);
        break;
      case 'contact':
        new ContactAccessory(this.api, accessory, this.accessories, FakeGatoHistoryService, printer);
        break;
      default:
        // fall through
        break;
    }
    
    return;

  },

  configureAccessory: async function(accessory){

    const device = this.devices.get(accessory.UUID);

    if (device){
      Logger.info('Configuring accessory...', accessory.displayName);                                                                                            
      this.setupAccessory(accessory, device);
    }
    
    this.accessories.push(accessory);
  
  },
  
  removeAccessory: function(accessory) {
  
    Logger.info('Removing accessory...', accessory.displayName);
    
    let accessories = this.accessories.map( cachedAccessory => {
      if(cachedAccessory.displayName !== accessory.displayName){
        return cachedAccessory;
      }
    });
    
    this.accessories = accessories.filter(function (el) {
      return el != null;
    });

    this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
  
  }

};
