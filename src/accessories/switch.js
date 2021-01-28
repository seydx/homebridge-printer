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

    if(!service){
      Logger.info('Adding Switch service', this.accessory.displayName);
      service = this.accessory.addService(this.api.hap.Service.Switch, this.accessory.displayName, this.accessory.context.config.type);
    }

    service
      .getCharacteristic(this.api.hap.Characteristic.On)
      .on('set', this.setState.bind(this));

    if(!serviceFilter){

      try {

        let response = await this.getPrinterAttributes();

        if(response && response['printer-attributes-tag']){

          let attributes = response['printer-attributes-tag'];
          let markers = [attributes['marker-names']];

          if(markers && markers.length){

            markers.forEach((marker, index) => {

              Logger.info('Adding FilterMaintenance service for ' + marker, this.accessory.displayName);

              let filterService = this.accessory.addService(this.api.hap.Service.FilterMaintenance, marker, 'marker-' + index);

              filterService
                .addCharacteristic(this.api.hap.Characteristic.FilterLifeLevel);

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

    }

    this.getState();

  }

  async getState(){

    try {

      let response = await this.getPrinterAttributes();

      if(response && response['printer-attributes-tag']){

        Logger.debug(response, this.accessory.displayName);

        this.accessory
          .getService(this.api.hap.Service.Switch)
          .getCharacteristic(this.api.hap.Characteristic.On)
          .updateValue(true);

        let attributes = response['printer-attributes-tag'];
        let markerLevel = [attributes['marker-levels']];

        if(markerLevel && markerLevel.length){

          markerLevel.forEach((level, index) => {

            let filterService = this.accessory.getServiceById(this.api.hap.Service.FilterMaintenance, 'marker-' + index);

            if(filterService){

              filterService
                .getCharacteristic(this.api.hap.Characteristic.FilterLifeLevel)
                .updateValue(level);

            }

          });

          let printingAccessory = this.accessories.find(accessory => accessory.displayName === this.accessory.displayName + ' Printing');

          let printing = attributes['printer-state'];

          printingAccessory
            .getService(this.api.hap.Service.ContactSensor)
            .getCharacteristic(this.api.hap.Characteristic.ContactSensorState)
            .updateValue(printing === 'processing' ? 1 : 0);

        }

      } else {

        Logger.warn('No response received from printer!', this.accessory.displayName);

        if(response)
          Logger.warn(response, this.accessory.displayName);

        this.accessory
          .getService(this.api.hap.Service.Switch)
          .getCharacteristic(this.api.hap.Characteristic.On)
          .updateValue(false);

      }

    } catch(err) {

      Logger.error('An error occured during getting state', this.accessory.displayName);
      Logger.error(err);

      this.accessory
        .getService(this.api.hap.Service.Switch)
        .getCharacteristic(this.api.hap.Characteristic.On)
        .updateValue(true);

    } finally {

      setTimeout(() => {
        this.getState();
      }, 10000);

    }

  }

  async setState(state, callback){

    Logger.info('Switching state not supported yet', this.accessory.displayName);

    setTimeout(() => {
      this.accessory
        .getService(this.api.hap.Service.Switch)
        .getCharacteristic(this.api.hap.Characteristic.On)
        .updateValue(!state);
    }, 1000);

    callback(null);

  }

  getPrinterAttributes(){

    return new Promise((resolve, reject) => {

      const msg = {
        'operation-attributes-tag': {
          'requested-attributes': [
            'queued-job-count',
            'marker-names',
            'marker-levels',
            'printer-make-and-model',
            'printer-is-accepting-jobs',
            'printer-state',
            'printer-up-time'
          ]
        }
      };

      this.printer.execute('Get-Printer-Attributes', msg, (err, res) => {

        if(err)
          return reject(err);

        if(res.statusCode && res.statusCode !== 'successful-ok')
          return reject(res);

        resolve(res);

      });

    });

  }

}

module.exports = SwitchAccessory;
