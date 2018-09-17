import {deployerConfig} from "./types/types";
import {Account} from "./account";
import {Transaction} from "./transaction";

const fs = require('fs');

export class Deployer {
    _eos: any;
    _contract_name: string;
    _deployer_account?: Account;
    _wasm: string = '';
    _abi: string = '';
    _after_deploy_tr?: Transaction;
    _before_deploy_tr?: Transaction;

    constructor({eos, contract_name}: deployerConfig) {
        this._eos = eos;
        this._contract_name = contract_name;
    }

    from(account: Account) {
        if (!account.isAccount) {
            throw new Error('Account must be instance of account.js');
        }

        this._deployer_account = account;

        return this;
    }

    read(dir: string) {
        if (!dir) {
            throw new Error('Compiled contracts directory not specified');
        }

        this._wasm = fs.readFileSync(dir + '/' + this._contract_name + '.wasm');
        this._abi = fs.readFileSync(dir + '/' + this._contract_name + '.abi');

        return this;
    }

    afterDeploy(transaction: Transaction) {
        if (!transaction.isTransaction) {
            throw new Error('Transaction must be instance of transaction.js');
        }

        this._after_deploy_tr = transaction;

        return this;
    }

    beforeDeploy(transaction: Transaction) {
        if (!transaction.isTransaction) {
            throw new Error('Transaction must be instance of transaction.js');
        }

        this._before_deploy_tr = transaction;

        return this;
    }

    async deploy() {
        if (!this._wasm || !this._abi || !this._deployer_account) {
            throw new Error('Deployer not initialized');
        }

        if (this._before_deploy_tr) {
            await this._before_deploy_tr.execute(this._eos);
        }

        let result: Array<any> = [];
        // Publish contract to the blockchain
        result.push(await this._eos.setcode(this._deployer_account.name, 0, 0, this._wasm)); // @returns {Promise}
        result.push(await this._eos.setabi(this._deployer_account.name, JSON.parse(this._abi))); // @returns {Promise}

        if (this._after_deploy_tr) {
            await this._after_deploy_tr.execute(this._eos);
        }

        return result;
    }
}

module.exports = Deployer;