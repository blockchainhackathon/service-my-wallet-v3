'use strict';

var bc;
var q = require('q');

module.exports = {
  login             : login,
  getBalance        : getBalance,
  listAddresses     : listAddresses,
  getAddressBalance : getAddressBalance
};

function login(guid, options) {
  var deferred = q.defer()
    , needs2FA  = deferred.reject.bind(null, 'ERR_2FA')
    , error     = deferred.reject.bind(null, 'ERR_SAVING');
  function success() {
    var resolve = deferred.resolve.bind(null, { guid: guid, success: true })
      , reject  = deferred.reject.bind(null, 'ERR_HISTORY');
    bc.MyWallet.wallet.getHistory().then(resolve).catch(reject);
  }
  function tryLogin() {
    refreshCache();
    bc.MyWallet.login(guid, null, options.password, null, success, needs2FA, null, null, error);
    return deferred.promise;
  }
  return tryLogin();
}

function getBalance(guid, options) {
  return getWallet().then(function (wallet) {
    return { balance: wallet.finalBalance };
  });
}

function listAddresses(guid, options) {
  return getWallet().then(function (wallet) {
    var addresses = wallet.keys.map(addressFactory);
    return { addresses: addresses };
  });
  function addressFactory(a) {
    return {address: a.address, label: a.label, balance: a.balance, total_received: a.totalReceived};
  }
}

function getAddressBalance(guid, options) {
  return getWallet().then(function (wallet) {
    var addr = wallet.key(options.address);
    return { balance: addr.balance, address: addr.address, total_received: addr.totalReceived };
  });
}

// Helper functions
function refreshCache() {
  if (require.cache) {
    Object.keys(require.cache).forEach(function (module) {
      delete require.cache[module];
    });
  }
  bc = require('blockchain-wallet-client');
}

function getWallet() {
  var exists = bc && bc.MyWallet && bc.MyWallet.wallet;
  return exists ? q(bc.MyWallet.wallet) : q.reject('ERR_WALLET_ID');
}
