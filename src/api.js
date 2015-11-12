'use strict';

var q     = require('q')
  , Cache = require('./cache');

var cache = new Cache();

module.exports = {
  login             : login,
  getBalance        : getBalance,
  listAddresses     : listAddresses,
  getAddressBalance : getAddressBalance
};

function login(guid, options) {
  var MyWallet = require('blockchain-wallet-client').MyWallet;
  var deferred = q.defer()
    , needs2FA  = deferred.reject.bind(null, 'ERR_2FA')
    , error     = deferred.reject.bind(null, 'ERR_SAVING');
  function success() {
    var resolve = deferred.resolve.bind(null, { guid: guid, success: true })
      , reject  = deferred.reject.bind(null, 'ERR_HISTORY');
    MyWallet.wallet.getHistory().then(resolve).catch(reject);
    cache.save(MyWallet.wallet);
  }
  function tryLogin() {
    clearCache();
    MyWallet.login(guid, null, options.password, null, success, needs2FA, null, null, error);
    return deferred.promise;
  }
  return tryLogin();
}

function getBalance(guid, options) {
  return cache.wallet(guid).then(function (wallet) {
    return { balance: wallet.finalBalance };
  });
}

function listAddresses(guid, options) {
  return cache.wallet(guid).then(function (wallet) {
    var addresses = wallet.keys.map(addressFactory);
    return { addresses: addresses };
  });
  function addressFactory(a) {
    return {address: a.address, label: a.label, balance: a.balance, total_received: a.totalReceived};
  }
}

function getAddressBalance(guid, options) {
  return cache.wallet(guid).then(function (wallet) {
    var addr = wallet.key(options.address);
    return { balance: addr.balance, address: addr.address, total_received: addr.totalReceived };
  });
}

// Helper functions
function clearCache() {
  if (require.cache) {
    Object.keys(require.cache).forEach(function (module) {
      delete require.cache[module];
    });
  }
}
