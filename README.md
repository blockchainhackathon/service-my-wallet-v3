
# service-my-wallet-v3

Service for running the [Blockchain.info Wallet API](https://blockchain.info/api/blockchain_wallet_api) on your own server.

## Development

  1. Clone this repo
  2. Run `npm install`
  3. Install globally `npm install -g .`
  4. Use the [CLI](#cli) to develop

## API

Programmatic usage of this service. [See CLI usage here.](#cli)

Usage:

```js
var walletService = require('service-my-wallet-v3');
```

### start

Starts the wallet service.

```js
walletService.start(options);
```

Options:

  * `port` - port number to run the server from

## Service Endpoints

View the [original documentaion](https://blockchain.info/api/blockchain_wallet_api).

Visit the [new documentaion](https://docs.blockchain.com).

### Log into Wallet

Loads a blockchain.info wallet. A wallet must be loaded via this endpoint before any other api interactions can occur.

Endpoint: `/:guid/login`

Query Parameters:

  * `password` - main wallet password (required)
  * `api_code` - blockchain.info wallet api code

### Make Payment

Endpoint: `/:guid/payment`

Query Parameters:

  * `to` - bitcoin address to send to (required)
  * `from` - bitcoin address to send from (required)
  * `amount` - amount **IN SATOSHI** to send (required)
  * `second_password` - second wallet password (required, only if second password is enabled)
  * `fee` - specify transaction fee **IN SATOSHI** (optional, otherwise fee is computed)
  * `note` - public note to include with the transaction (optional, limit 255 characters)

Note: the `from` field is not required on the hosted API, in this service it is required.

### Fetch Wallet Balance

Endpoint: `/:guid/balance`

### Fetch Address Balance

Endpoint: `/:guid/address_balance`

Query Parameters:

  * `address` - address to fetch balance for (required)

Note: unlike the hosted API, there is no option of a `confirmations` parameter for specifying minimum confirmations.

### List Addresses

Endpoint: `/:guid/list`

## CLI

When service-my-wallet-v3 is installed globally, it can be accessed via the `wallet-service` command.

Installing globally:

```sh
$ npm install -g .
```

Accessing the CLI help menu:

```sh
wallet-service --help
# or
wallet-service [command] --help
```

### Options

  * `-h, --help` - output usage information
  * `-V, --version` - output the version number
  * `-c, --cwd` - use the current directory as the wallet service module

### Commands

#### start

Usage: `wallet-service start [options]`

Command options:

  * `-h, --help` - output usage information
  * `-p, --port` - port number to run the server on

### Examples

To start the wallet service on port 3000:

```sh
$ wallet-service start --port 3000
```

To start the wallet service on port 3000 using the current directory as the module:

```sh
$ wallet-service --cwd start --port 3000
```

Why? Using `--cwd` is great for development, since it allows you to make changes in the current directory, and then see those changes without having to reinstall globally.
