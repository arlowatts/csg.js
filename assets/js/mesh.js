import { faceLookup, vertexLookup } from './lookups.js';

// return a mesh approximating a solid
export function mesh(solid, resolution) {

    // get the rectangular bounding volume of the solid
    const bound = solid.bound();

    // compute the number of grid points needed to cover the volume
    const size = [
        Math.ceil((bound[1][0] - bound[0][0]) / resolution) + 2,
        Math.ceil((bound[1][1] - bound[0][1]) / resolution) + 2,
        Math.ceil((bound[1][2] - bound[0][2]) / resolution) + 2,
    ];

    // allocate an array for the signed distance grid
    const signedDistances = new Array(size[0] * size[1] * size[2]);

    // initialize an array for the resulting faces
    const faces = [];

    // evaluate the signed distance to the solid at each point on the grid
    for (let k = 0; k < size[2]; k++) {
        for (let j = 0; j < size[1]; j++) {
            for (let i = 0; i < size[0]; i++) {

                // compute the position of the current grid point
                const x = bound[0][0] + (i - 0.5) * resolution;
                const y = bound[0][1] + (j - 0.5) * resolution;
                const z = bound[0][2] + (k - 0.5) * resolution;

                // store the signed distance to the solid
                signedDistances[i + size[0] * j + size[0] * size[1] * k] = solid.signedDistance(x, y, z);
            }
        }
    }

    // compute the resulting triangular faces
    for (let k = 0; k < size[2] - 1; k++) {
        for (let j = 0; j < size[1] - 1; j++) {
            for (let i = 0; i < size[0] - 1; i++) {

                // access the corners of the current cell
                const corners = [
                    signedDistances[ i      + size[0] *  j      + size[0] * size[1] *  k     ],
                    signedDistances[(i + 1) + size[0] *  j      + size[0] * size[1] *  k     ],
                    signedDistances[ i      + size[0] * (j + 1) + size[0] * size[1] *  k     ],
                    signedDistances[(i + 1) + size[0] * (j + 1) + size[0] * size[1] *  k     ],
                    signedDistances[ i      + size[0] *  j      + size[0] * size[1] * (k + 1)],
                    signedDistances[(i + 1) + size[0] *  j      + size[0] * size[1] * (k + 1)],
                    signedDistances[ i      + size[0] * (j + 1) + size[0] * size[1] * (k + 1)],
                    signedDistances[(i + 1) + size[0] * (j + 1) + size[0] * size[1] * (k + 1)],
                ];

                // compute the index into the lookup table
                const faceIndex = corners.reduce(
                    (faceIndex, signedDistance, cornerIndex) => faceIndex + ((signedDistance <= 0) << cornerIndex),
                    0,
                );

                // compute the position of the current grid point
                const x = bound[0][0] + (i - 0.5) * resolution;
                const y = bound[0][1] + (j - 0.5) * resolution;
                const z = bound[0][2] + (k - 0.5) * resolution;

                // access the face information from the lookup table
                for (let face of faceLookup[faceIndex]) {

                    // access the vertices of the faces
                    face = face.map(
                        (vertexIndex) => vertexLookup[vertexIndex]
                    );

                    // convert the vertices to global coordinates
                    face = face.map(
                        (vertex) => {
                            const vertexPosition = [
                                x + resolution * vertex[2][0],
                                y + resolution * vertex[2][1],
                                z + resolution * vertex[2][2],
                            ];

                            vertexPosition[vertex[0]] += resolution * corners[vertex[1][0]] / (corners[vertex[1][0]] - corners[vertex[1][1]]);

                            return vertexPosition;
                        }
                    );

                    // triangulate the face as a triangle fan
                    for (let n = 2; n < face.length; n++) {

                        // append the triangle to the mesh
                        faces.push([face[0], face[n - 1], face[n]]);
                    }
                }
            }
        }
    }

    return faces;
}
