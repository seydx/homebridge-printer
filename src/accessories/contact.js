'use strict';

const Logger = require('../helper/logger.js');

const moment = require('moment');

const timeout = (ms) => new Promise((res) => setTimeout(res, ms));

class ContactAccessory {

  constructor (api, accessory, accessories, FakeGatoHistoryService, printer) {
    
    this.api = api;
    this.accessory = accessory;
    this.accessories = accessories;
    this.FakeGatoHistoryService = FakeGatoHistoryService;
    
    this.printer = printer;
    
    this.getService();
    
  }

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
  // Services
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//

  async getService () {
    
    let service = this.accessory.getService(this.api.hap.Service.ContactSensor);
    
    if(!service){
      Logger.info('Adding Contact service', this.accessory.displayName);
      service = this.accessory.addService(this.api.hap.Service.ContactSensor, this.accessory.displayName, this.accessory.context.config.type);
    }
    
    if (!service.testCharacteristic(this.api.hap.Characteristic.LastActivation))
      service.addCharacteristic(this.api.hap.Characteristic.LastActivation);
    
    if (!service.testCharacteristic(this.api.hap.Characteristic.TimesOpened))
      service.addCharacteristic(this.api.hap.Characteristic.TimesOpened);
    
    if (!service.testCharacteristic(this.api.hap.Characteristic.OpenDuration))
      service.addCharacteristic(this.api.hap.Characteristic.OpenDuration);
    
    if (!service.testCharacteristic(this.api.hap.Characteristic.ClosedDuration))
      service.addCharacteristic(this.api.hap.Characteristic.ClosedDuration);

    if (!service.testCharacteristic(this.api.hap.Characteristic.ResetTotal))
      service.addCharacteristic(this.api.hap.Characteristic.ResetTotal);
      
    service.getCharacteristic(this.api.hap.Characteristic.ResetTotal)
      .on('set', (value,callback) => {
       
        Logger.info('Resetting FakeGato..', this.accessory.displayName);
        
        const now = Math.round(new Date().valueOf() / 1000); 
        const epoch = Math.round(new Date('2001-01-01T00:00:00Z').valueOf() / 1000);
        
        service.getCharacteristic(this.api.hap.Characteristic.ResetTotal)
          .updateValue(now - epoch);
  
        this.accessory.context.timesOpened = 0;
  
        service.getCharacteristic(this.api.hap.Characteristic.TimesOpened)
          .updateValue(this.accessory.context.timesOpened);
      
        callback(null);
      });
      
    this.historyService = new this.FakeGatoHistoryService('door', this.accessory, {storage:'fs', path: this.api.user.storagePath(), disableTimer:true});
    
    service.getCharacteristic(this.api.hap.Characteristic.ContactSensorState)
      .on('change', value => {
        
        if(value.oldValue !== value.newValue){
          
          if(value.newValue){
          
            this.accessory.context.timesOpened = this.accessory.context.timesOpened || 0;
            this.accessory.context.timesOpened += 1;
            
            let lastActivation = moment().unix() - this.historyService.getInitialTime();
            let closeDuration = moment().unix() - this.historyService.getInitialTime();
            
            service
              .getCharacteristic(this.api.hap.Characteristic.LastActivation)
              .updateValue(lastActivation);
              
            service
              .getCharacteristic(this.api.hap.Characteristic.TimesOpened)
              .updateValue(this.accessory.context.timesOpened);
            
            service
              .getCharacteristic(this.api.hap.Characteristic.ClosedDuration)
              .updateValue(closeDuration);
          
          } else {
          
            let openDuration = moment().unix() - this.historyService.getInitialTime();
          
            service
              .getCharacteristic(this.api.hap.Characteristic.ClosedDuration)
              .updateValue(openDuration);
          
          }
            
          this.historyService.addEntry({
            time: moment().unix(), 
            status: value.newValue ? 1 : 0
          });
       
        }
        
      });
    
    this.refreshHistory(service);
    
  }

  async refreshHistory(service){ 
    
    await timeout(5000);
    
    let state = service.getCharacteristic(this.api.hap.Characteristic.ContactSensorState).value;
    
    this.historyService.addEntry({
      time: moment().unix(), 
      status: state ? 1 : 0
    });
    
    setTimeout(() => {
      this.refreshHistory(service);
    }, 10 * 60 * 1000);
    
  }

}

module.exports = ContactAccessory;