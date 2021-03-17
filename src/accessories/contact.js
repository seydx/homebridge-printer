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
    
    if(this.accessory.context.config.marker){
    
      try {

        let response = await this.getPrinterAttributes();

        if(response && response['printer-attributes-tag']){

          let attributes = response['printer-attributes-tag'];
          let markers = !Array.isArray(attributes['marker-names'])
            ? [attributes['marker-names']]
            : attributes['marker-names'];

          if(markers && markers.length){

            markers.forEach((marker, index) => {
            
              if(marker){
              
                let filterService = this.accessory.getServiceById(this.api.hap.Service.FilterMaintenance, 'marker-' + index);
  
                if(!filterService){
                
                  Logger.info('Adding FilterMaintenance service for ' + marker, this.accessory.displayName);
                
                  filterService = this.accessory.addService(this.api.hap.Service.FilterMaintenance, marker, 'marker-' + index);
    
                  filterService
                    .addCharacteristic(this.api.hap.Characteristic.FilterLifeLevel);
                
                }
                
              }

            });

          }

        } else {

          Logger.warn('No or wrong response received from printer!', this.accessory.displayName);

          if(response)
            Logger.warn(response, this.accessory.displayName);

        }

      } catch(err) {

        Logger.error('An error occured during adding filter services', this.accessory.displayName);
        Logger.error(err);

      }

    } else {
    
      let filterServices = [];
    
      this.accessory.services.forEach(service => {
        if(service.subtype && service.subtype.includes('marker')){
          filterServices.push({
            name: service.displayName,
            subtype: service.subtype
          });
        }
      });
      
      filterServices.forEach(filter => {
        Logger.info('Removing Filter service (' + filter.name + ')', this.accessory.displayName);
        this.accessory.removeService(this.accessory.getServiceById(this.api.hap.Service.FilterMaintenance, filter.subtype));
      });
    
    }
    
    if (this.accessory.context.config.switchType === 'CHARACTERISTIC'){
      
      if(!service.testCharacteristic(this.api.hap.Characteristic.NetworkState)){
        Logger.info('Adding Switch characteristic', this.accessory.displayName);
        service.addCharacteristic(this.api.hap.Characteristic.NetworkState);
      }
      
      service.getCharacteristic(this.api.hap.Characteristic.NetworkState)
        .onSet(value => {
        
          Logger.info('Switching state not supported yet', this.accessory.displayName);
      
          setTimeout(() => {
            service
              .getCharacteristic(this.api.hap.Characteristic.NetworkState)
              .updateValue(!value);
          }, 500);
        
        });
      
    } else {
      if(service.testCharacteristic(this.api.hap.Characteristic.NetworkState))
        service.removeCharacteristic(service.getCharacteristic(this.api.hap.Characteristic.NetworkState));
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
    
    await timeout(250);
    
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
    
    this.getState();
    this.refreshHistory(service);
    
  }
  
  async getState(){
  
    let switchAccessory = this.accessories.find(accessory => accessory.displayName === this.accessory.displayName + ' Switch');

    try {

      let response = await this.getPrinterAttributes();

      if(response && response['printer-attributes-tag']){
      
        let attributes = response['printer-attributes-tag'];

        Logger.debug(response, this.accessory.displayName);

        //Received a response from printer, so it must be online
        if(switchAccessory){
          switchAccessory
            .getService(this.api.hap.Service.Switch)
            .getCharacteristic(this.api.hap.Characteristic.On)
            .updateValue(true);
        }
        
        if(this.accessory.context.config.switchType === 'CHARACTERISTIC'){
          this.accessory
            .getService(this.api.hap.Service.ContactSensor)
            .getCharacteristic(this.api.hap.Characteristic.NetworkState)
            .updateValue(true);
        }
        
        //Printer (printing) state
        let printing = attributes['printer-state'];

        this.accessory
          .getService(this.api.hap.Service.ContactSensor)
          .getCharacteristic(this.api.hap.Characteristic.ContactSensorState)
          .updateValue(printing === 'processing' ? 1 : 0);
          
        //Marker

        if(this.accessory.context.config.marker){
        
          let markerLevel = !Array.isArray(attributes['marker-levels'])
            ? [attributes['marker-levels']]
            : attributes['marker-levels'];
  
          if(markerLevel && markerLevel.length){
  
            markerLevel.forEach((level, index) => {
            
              if(level !== undefined){
  
                let filterService = this.accessory.getServiceById(this.api.hap.Service.FilterMaintenance, 'marker-' + index);
    
                if(filterService){
    
                  filterService
                    .getCharacteristic(this.api.hap.Characteristic.FilterLifeLevel)
                    .updateValue(level < 0 ? 0 : level);
    
                }
              
              }
  
            });
  
          }
        
        }

      } else {

        Logger.warn('No response received from printer!', this.accessory.displayName);

        if(response)
          Logger.warn(response, this.accessory.displayName);

        //No response from printer, so it must be offline
        if(switchAccessory){
          switchAccessory
            .getService(this.api.hap.Service.Switch)
            .getCharacteristic(this.api.hap.Characteristic.On)
            .updateValue(false);
        }
        
        if(this.accessory.context.config.switchType === 'CHARACTERISTIC'){
          this.accessory
            .getService(this.api.hap.Service.ContactSensor)
            .getCharacteristic(this.api.hap.Characteristic.NetworkState)
            .updateValue(false);
        }

      }

    } catch(err) {
    
      if(err instanceof Error){
        if(err.code && (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT' || err.code === 'EHOSTUNREACH' || err.code === 'ECONNRESET' || err.code === 'ECONNABORTED' || err.code === 'ENOTFOUND' || err.code === 'EBUSY')){
          Logger.debug('Can not reach printer!', this.accessory.displayName);
        } else {
          Logger.error('An error occured during getting state', this.accessory.displayName);
          Logger.error(err.message);
        }
      }

      //No response from printer, so it must be offline
      if(switchAccessory){
        switchAccessory
          .getService(this.api.hap.Service.Switch)
          .getCharacteristic(this.api.hap.Characteristic.On)
          .updateValue(false);
      }
      
      if(this.accessory.context.config.switchType === 'CHARACTERISTIC'){
        this.accessory
          .getService(this.api.hap.Service.ContactSensor)
          .getCharacteristic(this.api.hap.Characteristic.NetworkState)
          .updateValue(false);
      }

    } finally {

      setTimeout(() => {
        this.getState();
      }, this.accessory.context.config.polling * 1000);

    }

  }
  
  getPrinterAttributes(){

    return new Promise((resolve, reject) => {

      const msg = {
        'operation-attributes-tag': {
          'requested-attributes': [
            'queued-job-count',
            'printer-make-and-model',
            'printer-is-accepting-jobs',
            'printer-state',
            'printer-up-time'
          ]
        }
      };
      
      if(this.accessory.context.config.marker){
        msg['operation-attributes-tag']['requested-attributes'].push('marker-names');
        msg['operation-attributes-tag']['requested-attributes'].push('marker-levels');
      }

      this.printer.execute('Get-Printer-Attributes', msg, (err, res) => {

        if(err)
          return reject(err);

        if(res.statusCode && res.statusCode !== 'successful-ok')
          return reject(res);

        resolve(res);

      });

    });

  }

  async refreshHistory(service){ 
    
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