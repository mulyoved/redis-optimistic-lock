'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, Promise, generator) {
    return new Promise(function (resolve, reject) {
        generator = generator.call(thisArg, _arguments);
        function cast(value) { return value instanceof Promise && value.constructor === Promise ? value : new Promise(function (resolve) { resolve(value); }); }
        function onfulfill(value) { try { step("next", value); } catch (e) { reject(e); } }
        function onreject(value) { try { step("throw", value); } catch (e) { reject(e); } }
        function step(verb, value) {
            var result = generator[verb](value);
            result.done ? resolve(result.value) : cast(result.value).then(onfulfill, onreject);
        }
        step("next", void 0);
    });
};
var redisLib = require('redis');
var util = require('util');
class RedisTest {
    constructor() {
        this.redisUrl = 'redis://@192.168.153.156:6379';
        this.redisOptions = {};
        this.redis = redisLib.createClient(this.redisUrl, this.redisOptions);
    }
    redisGet(key) {
        return __awaiter(this, void 0, Promise, function* () {
            return new Promise((resolve, reject) => {
                this.redis.get(key, (err, keyValue) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(keyValue);
                    }
                });
            });
        });
    }
    redisExec(dataKey, newValue) {
        return __awaiter(this, void 0, Promise, function* () {
            return new Promise((resolve, reject) => {
                this.redis
                    .multi()
                    .set(dataKey, newValue)
                    .exec(function (err, replies) {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(replies);
                    }
                });
            });
        });
    }
    redisUnwatch() {
        return __awaiter(this, void 0, Promise, function* () {
            return new Promise((resolve, reject) => {
                this.redis
                    .unwatch(function (err, replies) {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(replies);
                    }
                });
            });
        });
    }
    resetValue(dataKey) {
        return __awaiter(this, void 0, Promise, function* () {
            return new Promise((resolve, reject) => {
                this.redis
                    .del(dataKey);
            });
        });
    }
    optimisticLock(taskName, dataKey, jobCallback) {
        return __awaiter(this, void 0, Promise, function* () {
            this.redis.watch(dataKey);
            let keyValue = JSON.parse(yield this.redisGet(dataKey));
            console.log(taskName + ': got keyValue', util.inspect(keyValue));
            let newValue = yield jobCallback(keyValue);
            if (newValue) {
                console.log(taskName + ': newValue from jobCallback', util.inspect(newValue));
                let replies = yield this.redisExec(dataKey, JSON.stringify(newValue));
                if (!replies) {
                    console.log(taskName + ': optimistic lock failed, retry');
                    return yield this.optimisticLock(taskName, dataKey, jobCallback);
                }
                console.log(taskName + ': exec replies', util.inspect(replies));
            }
            else {
                yield this.redisUnwatch();
                console.log(taskName + ': failed, possibly should retry after sometime');
            }
            return newValue;
        });
    }
    test(cb) {
        this.redis.set('some key', 'some val');
        this.redis.get('some key', function (err, replay) {
            console.log('err', err, 'replay', replay);
            cb();
        });
    }
}
module.exports = RedisTest;
