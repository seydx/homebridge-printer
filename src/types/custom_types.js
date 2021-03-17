'use strict';

const inherits = require('util').inherits;

module.exports = {
  registerWith: function (hap) {
    const Characteristic = hap.Characteristic;

    /// /////////////////////////////////////////////////////////////////////////
    // NetworkState Characteristic
    /// /////////////////////////////////////////////////////////////////////////
    Characteristic.NetworkState = function() {
      Characteristic.call(this, 'Connection', '65ede48d-5d4e-4408-8a6f-feaa57b7320e');
      this.setProps({
        format: Characteristic.Formats.BOOL,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.WRITE, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    };
    inherits(Characteristic.NetworkState, Characteristic);
    Characteristic.NetworkState.UUID = '65ede48d-5d4e-4408-8a6f-feaa57b7320e';
    
  }
};