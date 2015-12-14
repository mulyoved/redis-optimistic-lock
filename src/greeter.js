'use strict';
class Greeter {
    constructor(message) {
        this.greeting = message;
    }
    greet() {
        return 'Bonjour, ' + this.greeting + '!';
    }
}
module.exports = Greeter;
