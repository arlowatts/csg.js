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

    // allocate an array for the vertex positions
    const vertices = new Array(3 * (size[0] - 1) * (size[1] - 1) * (size[2] - 1));

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

    // compute the positions of the vertices
    for (let k = 0; k < size[2] - 1; k++) {
        for (let j = 0; j < size[1] - 1; j++) {
            for (let i = 0; i < size[0] - 1; i++) {

                // compute the position of the current grid point
                const x = bound[0][0] + (i - 0.5) * resolution;
                const y = bound[0][1] + (j - 0.5) * resolution;
                const z = bound[0][2] + (k - 0.5) * resolution;

                // access the distance at the current grid point
                const signedDistance = signedDistances[i + size[0] * j + size[0] * size[1] * k];

                // access the three adjacent corners of the current cell
                const corners = [
                    signedDistances[(i + 1) + size[0] *  j      + size[0] * size[1] *  k     ],
                    signedDistances[ i      + size[0] * (j + 1) + size[0] * size[1] *  k     ],
                    signedDistances[ i      + size[0] *  j      + size[0] * size[1] * (k + 1)],
                ];

                // interpolate the three vertices adjacent to the current grid point
                for (let axis = 0; axis < 3; axis++) {

                    // compute the current vertex index
                    const index = axis + 3 * i + 3 * size[0] * j + 3 * size[0] * size[1] * k;

                    // store the base position of the vertex
                    vertices[index] = [x, y, z];

                    // interpolate the vertex
                    const interpolant = signedDistance / (signedDistance - corners[axis]);

                    if (interpolant >= 0 && interpolant <= 1) {
                        vertices[index][axis] += resolution * interpolant;
                    }
                }
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

                // compute the vertex indices of the current cell
                const vertexIndices = vertexLookup.map(
                    (vertex) => vertex[0] + 3 * (i + vertex[2][0]) + 3 * size[0] * (j + vertex[2][1]) + 3 * size[0] * size[1] * (k + vertex[2][2])
                );

                // access the face information from the lookup table
                for (let face of faceLookup[faceIndex]) {

                    // access the vertices of the faces
                    face = face.map(
                        (vertexIndex) => vertices[vertexIndices[vertexIndex]]
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
