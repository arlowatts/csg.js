// a sphere has a position and a radius
export class Sphere {
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
        ];
    }
}

// a torus has a position, a major radius, and a minor radius
export class Torus {
    constructor(x, y, z, radiusMajor, radiusMinor) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.radiusMajor = radiusMajor;
        this.radiusMinor = radiusMinor;
    }

    // return the signed distance to the surface of the sphere
    signedDistance(x, y, z) {
        return Math.sqrt((Math.sqrt((x - this.x) ** 2 + (y - this.y) ** 2) - this.radiusMajor) ** 2 + (z - this.z) ** 2) - this.radiusMinor;
    }

    // return two corners defining a rectangular volume containing the sphere
    bounds() {
        return [
            [this.x - this.radiusMajor - this.radiusMinor, this.y - this.radiusMajor - this.radiusMinor, this.z - this.radiusMinor],
            [this.x + this.radiusMajor + this.radiusMinor, this.y + this.radiusMajor + this.radiusMinor, this.z + this.radiusMinor],
        ];
    }
}
