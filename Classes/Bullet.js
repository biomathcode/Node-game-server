const ServerObject = require('./ServerObject.js');
const Vector2 = require('./Vector2');

module.exports = class Bullet extends ServerObject{
    constructor() {
        super();
        this.direction = new Vector2();
        this.speed = 0.5;

    }

    onUpdate() {
        this.position.x += this.direction.x * this.speed
        this.position.y += this.direction.y * this.speed
        

        return false;
    }
}