// a union combines the geometry of two or more solids
export class Union {
    constructor(solids) {
        this.solids = solids;
    }

    // return the signed distance to the surface of the solid
    signedDistance(x, y, z) {
        const solidSignedDistances = this.solids.map((solid) => solid.signedDistance(x, y, z));

        return Math.min(...solidSignedDistances);
    }

    // return two corners defining a rectangular volume containing the solid
    bound() {
        const solidBounds = this.solids.map((solid) => solid.bound());

        const bound = [[Infinity, Infinity, Infinity], [-Infinity, -Infinity, -Infinity]];

        for (const solidBound of solidBounds) {
            for (let axis = 0; axis < 3; axis++) {
                bound[0][axis] = Math.min(bound[0][axis], solidBound[0][axis]);
                bound[1][axis] = Math.max(bound[1][axis], solidBound[1][axis]);
            }
        }

        return bound;
    }
}
