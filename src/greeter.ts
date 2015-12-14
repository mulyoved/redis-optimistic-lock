/// <reference path='../typings/tsd.d.ts' />

'use strict';

class Greeter {
    greeting: string;

    constructor(message: string) {
        this.greeting = message;
    }

    greet() {
        return 'Bonjour, ' + this.greeting + '!';
    }
}

export = Greeter;
