var Greeter = require("../src/greeter");
var RedisTest = require("../src/redis");
var Q = require('q');


describe("greeter", function () {
  it("should greet with message", function () {
    var greeter = new Greeter('friend');
    expect(greeter.greet()).toBe('Bonjour, friend!');
  });
});

xdescribe("redis", function () {
  it("should test redis", function(done) {
    var redisTest = new RedisTest();
    redisTest.test(done)
  });

  it("should optimisticLock", function(done) {
    function doWorkStart(value) {
      var deferred = Q.defer();
      console.log('optimisticLock job', value);
      var newValue = value;
      if (!value || typeof value !== 'object') {
        newValue = {
          initValue: 'initValue',
          num: 0,
          items: []
        };
      }

      newValue.num++;
      newValue.items.push(myuuid);
      deferred.resolve(newValue);
      //cb(newValue);
      return deferred.promise;
    }

    function doWorkEnd(value) {
      var deferred = Q.defer();
      console.log('optimisticLock job', value);
      var newValue = value;
      if (!value || typeof value !== 'object') {
        return deferred.reject(new Error('Missing initial value'))
      }

      newValue.num--;
      var idx = newValue.items.indexOf(myuuid);
      if (idx < 0) {
        return deferred.reject(new Error('Cannot not find myuuid'))
      }

      newValue.items.splice(idx,1);
      deferred.resolve(newValue);
      return deferred.promise;
    }

    var redisTest= new RedisTest();
    redisTest.optimisticLock('test-key', doWork)
      .then(function(answer) {
        console.log(answer);
        done();
      })
      .catch(function(err) {
        console.error(err);
        done(err);
      });
  });

});

