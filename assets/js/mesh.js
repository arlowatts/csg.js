// return a mesh approximating a shape
export function mesh(shape, resolution) {

    // get the rectangular bounding volume of the shape
    const bounds = shape.bounds();

    // compute the number of cells needed to cover the volume
    const size = [
        Math.ceil((bounds[1][0] - bounds[0][0]) / resolution) + 1,
        Math.ceil((bounds[1][1] - bounds[0][1]) / resolution) + 1,
        Math.ceil((bounds[1][2] - bounds[0][2]) / resolution) + 1,
    ];

    // allocate an array for the signed distance grid
    const signedDistances = new Array(size[0] * size[1] * size[2]);

    // initialize an array for the resulting faces
    const faces = [];

    // evaluate the signed distance to the shape at each point on the grid
    for (let k = 0; k < size[2]; k++) {
        for (let j = 0; j < size[1]; j++) {
            for (let i = 0; i < size[0]; i++) {

                // compute the position of the current grid point
                const x = bounds[0][0] + (i - 0.5) * resolution;
                const y = bounds[0][1] + (j - 0.5) * resolution;
                const z = bounds[0][2] + (k - 0.5) * resolution;

                // store the signed distance to the shape
                signedDistances[i + size[0] * j + size[0] * size[1] * k] = shape.signedDistance(x, y, z);
            }
        }
    }

    // compute the resulting triangular faces
    for (let k = 0; k < size[2] - 1; k++) {
        for (let j = 0; j < size[1] - 1; j++) {
            for (let i = 0; i < size[0] - 1; i++) {

                // access the corners of the current cell
                const corners = [
                    signedDistances[ i      + size[0] *  j      + size[1] * size[2] *  k     ],
                    signedDistances[(i + 1) + size[0] *  j      + size[1] * size[2] *  k     ],
                    signedDistances[ i      + size[0] * (j + 1) + size[1] * size[2] *  k     ],
                    signedDistances[(i + 1) + size[0] * (j + 1) + size[1] * size[2] *  k     ],
                    signedDistances[ i      + size[0] *  j      + size[1] * size[2] * (k + 1)],
                    signedDistances[(i + 1) + size[0] *  j      + size[1] * size[2] * (k + 1)],
                    signedDistances[ i      + size[0] * (j + 1) + size[1] * size[2] * (k + 1)],
                    signedDistances[(i + 1) + size[0] * (j + 1) + size[1] * size[2] * (k + 1)],
                ];

                // compute the position of the current grid point
                const x = bounds[0][0] + (i - 0.5) * resolution;
                const y = bounds[0][1] + (j - 0.5) * resolution;
                const z = bounds[0][2] + (k - 0.5) * resolution;

                // determine the faces present in the current cell
                if (corners[0] <= 0 &&
                    corners[1] >  0 &&
                    corners[2] >  0 &&
                    corners[3] >  0 &&
                    corners[4] >  0 &&
                    corners[5] >  0 &&
                    corners[6] >  0 &&
                    corners[7] >  0) {
                    faces.push([[x + 0.5 * resolution, y, z], [x, y + 0.5 * resolution, z], [x, y, z + 0.5 * resolution]]);
                }
            }
        }
    }

    return faces;
}
