'use strict';

const Logger = require('../helper/logger.js');

class SwitchAccessory {

  constructor (api, accessory, accessories, printer) {

    this.api = api;
    this.accessory = accessory;
    this.accessories = accessories;

    this.printer = printer;

    this.getService();

  }

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
  // Services
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//

  async getService () {

    let service = this.accessory.getService(this.api.hap.Service.Switch);
    let serviceFilter = this.accessory.getService(this.api.hap.Service.FilterMaintenance);

    if(serviceFilter){
      this.accessory.removeService(serviceFilter);
    }

    if(!service){
      Logger.info('Adding Switch service', this.accessory.displayName);
      service = this.accessory.addService(this.api.hap.Service.Switch, this.accessory.displayName, this.accessory.context.config.type);
    }

    service
      .getCharacteristic(this.api.hap.Characteristic.On)
      .onSet(value => {
      
        Logger.info('Switching state not supported yet', this.accessory.displayName);
    
        setTimeout(() => {
          service
            .getCharacteristic(this.api.hap.Characteristic.On)
            .updateValue(!value);
        }, 500);
      
      });

  }

}

module.exports = SwitchAccessory;
