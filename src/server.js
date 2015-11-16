'use strict';

var express     = require('express')
  , bodyParser  = require('body-parser')
  , q           = require('q')
  , ecodes      = require('./error-codes')
  , api         = require('./api');

module.exports = {
  start: start
};

var app         = express()
  , merchantAPI = express();

// Configuration
app.use('/merchant', merchantAPI);
merchantAPI.use(bodyParser.json());
merchantAPI.use(parseOptions());

// Routing
merchantAPI.all(
  '/:guid/login',
  required('password'),
  callApi('login')
);

merchantAPI.all(
  '/:guid/balance',
  callApi('getBalance')
);

merchantAPI.all(
  '/:guid/list',
  callApi('listAddresses')
);

merchantAPI.all(
  '/:guid/address_balance',
  required('address'),
  callApi('getAddressBalance')
);

merchantAPI.all(
  '/:guid/sendmany',
  required(['recipients', 'from']),
  callApi('sendMany')
);

merchantAPI.all(
  '/:guid/payment',
  required(['to', 'amount', 'from']),
  callApi('makePayment')
);

merchantAPI.all(
  '/:guid/new_address',
  callApi('generateAddress')
);

// Helper functions
function handleResponse(apiAction, res) {
  apiAction
    .then(function (data) { res.status(200).json(data); })
    .catch(function (e) {
      console.log(e);
      var err = ecodes[e] || ecodes['ERR_UNEXPECT'];
      res.status(500).json({ error: err });
    });
}

function start(options) {
  app.listen(options.port, function () {
    console.log('blockchain.info wallet service running on port %d', options.port);
  });
}

// Custom middleware
function callApi(method) {
  return function (req, res) {
    var apiAction = api[method](req.params.guid, req.bc_options);
    handleResponse(apiAction, res);
  };
}

function required(props) {
  props = props instanceof Array ? props : [props];
  return function (req, res, next) {
    var rejection = q.reject('ERR_PARAM');
    for (var i = 0; i < props.length; i++) {
      var prop = props[i];
      var propExists = req.bc_options[prop] != null;
      if (!propExists) return handleResponse(rejection, res);
    }
    next();
  };
}

function parseOptions() {
  return function (req, res, next) {
    var _q = req.query
      , _b = req.body;
    req.bc_options = {
      password  : _q.password || _b.password,
      api_code  : _q.api_code || _b.api_code,
      address   : _q.address  || _b.address,
      to        : _q.to       || _b.to,
      from      : _q.from     || _b.from,
      note      : _q.note     || _b.note,
      label     : _q.label    || _b.label,
      recipients: _q.recipients || _b.recipients,
      second_password : _q.second_password || _b.second_password,
      amount    : parseInt(_q.amount  || _b.amount) || undefined,
      fee       : parseInt(_q.fee     || _b.fee) || undefined,
    };
    Object.keys(req.bc_options).forEach(function (p) {
      if (req.bc_options[p] === undefined) delete req.bc_options[p];
    });
    next();
  };
}
