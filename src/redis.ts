/// <reference path='../typings/tsd.d.ts' />

'use strict';

import redisLib = require('redis');
import util = require('util');

class RedisTest {

    redisUrl = 'redis://@192.168.153.156:6379';
    redisOptions: redisLib.ClientOpts = {};
    redis: redisLib.RedisClient;

    constructor() {
        this.redis = redisLib.createClient(this.redisUrl, this.redisOptions);
    }

    async redisGet(key: string): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            this.redis.get(key, (err, keyValue) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(keyValue);
                }
            });
        });
    }

    async redisExec(dataKey: string, newValue: any): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            this.redis
                .multi()
                .set(dataKey, newValue)
                .exec(function(err: Error, replies: any) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(replies);
                    }
                });
        });
    }

    async redisUnwatch(): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            this.redis
                .unwatch(function(err: Error, replies: any) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(replies);
                    }
                });
        });
    }

    async resetValue(dataKey: string) {
        return new Promise<string>((resolve, reject) => {
            this.redis
                .del(dataKey);
        });
    }

    //http://redis.io/topics/transactions
    async optimisticLock(taskName: string, dataKey: string, jobCallback: any): Promise<any> {
        this.redis.watch(dataKey);
        let keyValue: string = JSON.parse(await this.redisGet(dataKey));
        console.log(taskName + ': got keyValue', util.inspect(keyValue));

        let newValue: any = await jobCallback(keyValue);
        if (newValue) {
            console.log(taskName + ': newValue from jobCallback', util.inspect(newValue));
            let replies: any = await this.redisExec(dataKey, JSON.stringify(newValue));
            if (!replies) {
                //exec failed, say optimistic lock was failed, need to retry all
                console.log(taskName + ': optimistic lock failed, retry');
                return await this.optimisticLock(taskName, dataKey, jobCallback);
            }

            console.log(taskName + ': exec replies', util.inspect(replies));
        } else {
            await this.redisUnwatch();
            console.log(taskName + ': failed, possibly should retry after sometime');
        }
        return newValue;
    }

    test(cb: any) {

        this.redis.set('some key', 'some val');
        this.redis.get('some key', function(err, replay) {
            console.log('err', err, 'replay', replay);
            cb();
        });
    }
}

export = RedisTest;
