'use strict';

var bc  = require('blockchain-wallet-client')
  , q   = require('q');

module.exports = {
  login             : login,
  getBalance        : getBalance,
  listAddresses     : listAddresses,
  getAddressBalance : getAddressBalance
};

function login(guid, options) {
  var MyWallet = bc.MyWallet
    , deferred = q.defer();
  var needs2FA  = deferred.reject.bind(null, 'ERR_2FA')
    , error     = deferred.reject.bind(null, 'ERR_SAVING');
  function success() {
    var resolve = deferred.resolve.bind(null, { guid: guid, success: true })
      , reject  = deferred.reject.bind(null, 'ERR_HISTORY');
    bc.MyWallet.wallet.getHistory().then(resolve).catch(reject);
  }
  function tryLogin() {
    clearCache();
    bc = require('blockchain-wallet-client');
    bc.MyWallet.login(guid, null, options.password, null, success, needs2FA, null, null, error);
    return deferred.promise;
  }
  return tryLogin();
}

function getBalance(guid, options) {
  var wallet = bc.MyWallet.wallet;
  return q({ balance: wallet.finalBalance });
}

function listAddresses(guid, options) {
  var wallet = bc.MyWallet.wallet
    , addresses = wallet.keys.map(addressFactory);
  return q({ addresses: addresses });
  function addressFactory(a) {
    return {address: a.address, label: a.label, balance: a.balance, total_received: a.totalReceived};
  }
}

function getAddressBalance(guid, options) {
  var wallet  = bc.MyWallet.wallet
    , addr    = wallet.key(options.address);
  return q({ balance: addr.balance, address: addr.address, total_received: addr.totalReceived });
}

// Helper functions
function clearCache() {
  if (require.cache) {
    Object.keys(require.cache).forEach(function (module) {
      delete require.cache[module];
    });
  }
}
