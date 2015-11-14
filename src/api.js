'use strict';

var bc;
var q       = require('q')
  , request = require('request-promise');

module.exports = {
  login             : login,
  getBalance        : getBalance,
  listAddresses     : listAddresses,
  getAddressBalance : getAddressBalance,
  sendMany          : sendMany,
  makePayment       : makePayment,
  generateAddress   : generateAddress
};

function login(guid, options) {
  var deferred = q.defer()
    , needs2FA  = deferred.reject.bind(null, 'ERR_2FA')
    , error     = deferred.reject.bind(null, 'ERR_DECRYPT');
  function success() {
    var resolve = deferred.resolve.bind(null, { guid: guid, success: true })
      , reject  = deferred.reject.bind(null, 'ERR_HISTORY');
    bc.WalletStore.setAPICode(options.api_code);
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

function sendMany(guid, options) {
  var recipients = JSON.parse(options.recipients);
  if ('object' !== typeof recipients)
    return q.reject('ERR_ADDR_AMT');

  options.amount  = [];
  options.to      = [];

  Object.keys(recipients).forEach(function (r) {
    options.to.push(r);
    options.amount.push(recipients[r]);
  });

  delete options.recipients;
  return makePayment(guid, options);
}

function makePayment(guid, options) {
  return getWallet().then(function (wallet) {
    var payment = new bc.Payment()
      .to(options.to)
      .amount(options.amount)
      .from(options.from);

    var password = options.second_password;
    if (options.fee) payment.fee(options.fee);
    if (options.note) payment.note(options.note);

    return payment.build().sign(password).publish().payment
      .catch(function (e) {
        console.log(e);
        throw 'ERR_PUSHTX';
      });
  });
}

function generateAddress(guid, options) {
  // temp solution: just make the normal api call...
  return getWallet().then(function (wallet) {
    var requestOptions = {
      method  : 'GET',
      json    : true,
      url : 'https://blockchain.info/merchant/' + wallet.guid + '/new_address',
      qs  : {
        'password'  : options.password,
        'second_password' : options.second_password,
        'label'     : options.label,
        'json'      : true
      }
    };
    return request(requestOptions)
      .then(function (r) {
        if (r.error) throw r.error;
        return r;
      })
      .then(login.bind(null, guid, options))
      .catch(function (e) {
        console.log(e);
        throw 'ERR_ACCESS';
      });
    // wallet.newLegacyAddress(options.label, password, deferred.resolve, deferred.reject);
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
