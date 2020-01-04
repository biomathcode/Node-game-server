module.exports = class Vector2 {
    constructor(X = 0, Y = 0) {
        this.x = X;
        this.y = Y;
    }
    Magnitude() {
        return Math.sqrt((this.x * this.x) + (this.y * this.y) )
    }

    Normalized() {
        const mag = this.Magnitude();
        return new Vector2(this.x / mag, this.y/mag);
    }

    Distance(otherVect = Vector2) {
        const direction = new Vector2();
        direction.x = otherVect.x - this.x;
        direction.y = otherVect.y - this.y;
        return direction.Magnitude();

    }

    ConsoleOutput() {
        return "(" + this.x + ',' + this.y + ')';
    }
}