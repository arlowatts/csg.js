// a sphere has a position and a radius
export class Sphere {

    // initialize a new sphere
    constructor(x, y, z, radius) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.radius = radius;
    }

    // return the signed distance to the surface of the sphere
    signedDistance(x, y, z) {
        return Math.sqrt((x - this.x) ** 2 + (y - this.y) ** 2 + (z - this.z) ** 2) - this.radius;
    }

    // return two corners defining a rectangular volume containing the sphere
    bounds() {
        return [
            [this.x - this.radius, this.y - this.radius, this.z - this.radius],
            [this.x + this.radius, this.y + this.radius, this.z + this.radius],
        ]
    }
}
