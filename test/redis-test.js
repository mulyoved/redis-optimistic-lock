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
var Greeter = require('../src/greeter');
var RedisTest = require('../src/redis');
var util = require('util');
describe('ts - test', function () {
    it('ts - test2', function () {
        var greeter = new Greeter('TSfriend');
        expect(greeter.greet()).toBe('Bonjour, TSfriend!');
    });
});
describe('redis', function () {
    let myuuid = 'test1';
    let redisVarName = 'testkey1';
    function makeid() {
        var text = '';
        var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (var i = 0; i < 5; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }
    it('should test redis', function (done) {
        var redisTest = new RedisTest();
        redisTest.test(done);
    });
    it('should optimisticLock twice', function (done) {
        return __awaiter(this, void 0, Promise, function* () {
            function pause(delay) {
                return __awaiter(this, void 0, Promise, function* () {
                    return new Promise((resolve, reject) => {
                        setTimeout(function () {
                            resolve();
                        }, delay);
                    });
                });
            }
            ;
            function doWorkStart(value) {
                return __awaiter(this, void 0, Promise, function* () {
                    console.log('doWorkStart: received initial value', util.inspect(value));
                    let newValue = value;
                    if (!value || typeof value !== 'object') {
                        newValue = {
                            initValue: 'initValue',
                            totalCount: 0,
                            num: 0,
                            items: []
                        };
                    }
                    newValue.num++;
                    newValue.totalCount++;
                    newValue.items.push(myuuid);
                    console.log('doWorkStart: return ', util.inspect(newValue));
                    return newValue;
                });
            }
            function doWorkEnd(value) {
                return __awaiter(this, void 0, Promise, function* () {
                    console.log('doWorkEnd: received initial value', util.inspect(value));
                    var newValue = value;
                    if (!value || typeof value !== 'object') {
                        console.error('doWorkEnd: Missing initial value', util.inspect(value), !value, typeof value);
                        throw new Error('Missing initial value');
                    }
                    newValue.num--;
                    newValue.totalCount++;
                    var idx = newValue.items.indexOf(myuuid);
                    if (idx < 0) {
                        console.error('doWorkEnd: Cannot not find myuuid');
                        throw new Error('Cannot not find myuuid');
                    }
                    newValue.items.splice(idx, 1);
                    console.log('doWorkEnd: return ', util.inspect(newValue));
                    return newValue;
                });
            }
            try {
                console.log('create redis client');
                let redisTest = new RedisTest();
                redisTest.resetValue(redisVarName);
                console.log('call redisTest.optimisticLock');
                let answerStart = yield redisTest.optimisticLock('work-start', redisVarName, doWorkStart);
                console.log('optimisticLock answer start:', answerStart);
                expect(answerStart.totalCount).toBe(1);
                expect(answerStart.num).toBe(1);
                let answerEnd = yield redisTest.optimisticLock('work-end', redisVarName, doWorkEnd);
                console.log('optimisticLock answer end:', answerEnd);
                expect(answerEnd.totalCount).toBe(2);
                expect(answerEnd.num).toBe(0);
                expect(answerEnd.items.length).toBe(0);
                done();
            }
            catch (err) {
                console.error(err.stack);
                done(err);
            }
        });
    });
    it('should fail optimisticLock 10 times before success', function (done) {
        return __awaiter(this, void 0, Promise, function* () {
            let redisTest1 = new RedisTest();
            let redisTest2 = new RedisTest();
            redisTest1.resetValue(redisVarName);
            function doWork2(value) {
                return __awaiter(this, void 0, Promise, function* () {
                    console.log('doWork2: received initial value', util.inspect(value));
                    let newValue = value;
                    if (!value || typeof value !== 'object') {
                        newValue = {
                            initValue: 'initValue',
                            totalCount: 0,
                            num: 0,
                            items: []
                        };
                    }
                    newValue.totalCount++;
                    newValue.last = 2;
                    console.log('doWork2: return ', util.inspect(newValue));
                    return newValue;
                });
            }
            function doWork1(value) {
                return __awaiter(this, void 0, Promise, function* () {
                    console.log('doWork1: received initial value', util.inspect(value));
                    let newValue = value;
                    if (!value || typeof value !== 'object') {
                        newValue = {
                            initValue: 'initValue',
                            totalCount: 0,
                            num: 0,
                            items: []
                        };
                    }
                    newValue.totalCount++;
                    newValue.last = 1;
                    if (newValue.totalCount < 10) {
                        console.log('doWork1: calling optimisticLock with work2, should fail this lock');
                        yield redisTest2.optimisticLock('fail2', redisVarName, doWork2);
                    }
                    console.log('doWork1: return ', util.inspect(newValue));
                    return newValue;
                });
            }
            try {
                console.log('call redisTest.optimisticLock');
                let answerStart = yield redisTest1.optimisticLock('fail1', redisVarName, doWork1);
                console.log('optimisticLock answer start:', answerStart);
                expect(answerStart.last).toBe(1);
                expect(answerStart.totalCount).toBe(10);
                done();
            }
            catch (err) {
                console.error(err.stack);
                done(err);
            }
        });
    });
    it('job should fail 10 times before success', function (done) {
        return __awaiter(this, void 0, Promise, function* () {
            let redisTest1 = new RedisTest();
            let totalTry = 0;
            redisTest1.resetValue(redisVarName);
            function doFailingWork(value) {
                return __awaiter(this, void 0, Promise, function* () {
                    console.log('doFailingWork: received initial value', util.inspect(value));
                    let newValue = value;
                    if (!value || typeof value !== 'object') {
                        newValue = {
                            initValue: 'initValue',
                            totalCount: 0,
                            num: 0,
                            items: []
                        };
                    }
                    newValue.totalCount++;
                    newValue.last = 1;
                    totalTry++;
                    if (totalTry < 10) {
                        console.error(util.format('Simulated exception, failed to execute job for %s times', totalTry));
                        return null;
                    }
                    console.log('doFailingWork: return ', util.inspect(newValue));
                    return newValue;
                });
            }
            try {
                let answerStart = null;
                while (!answerStart) {
                    answerStart = yield redisTest1.optimisticLock('FailingWork', redisVarName, doFailingWork);
                }
                expect(answerStart.totalCount).toBe(1);
                expect(totalTry).toBe(10);
                done();
            }
            catch (err) {
                console.error(err.stack);
                done(err);
            }
        });
    });
});
