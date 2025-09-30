import { faceLookup, vertexLookup } from './lookups.js';

// return a mesh approximating a solid
export function mesh(solid, resolution, mergeDistance) {

    // get the rectangular bounding volume of the solid
    const [origin, terminus] = solid.bound();

    // compute the number of cells needed to cover the volume
    const size = [];

    for (let axis = 0; axis < 3; axis++) {
        size[axis] = Math.ceil((terminus[axis] - origin[axis]) / resolution) + 1;
    }

    const signedDistances = getSignedDistances(origin, resolution, size, solid);

    const vertices = getVertices(origin, resolution, size, signedDistances);

    const faces = getFaces(size, signedDistances);

    return faces.map((face) => face.map((vertex) => vertices[vertex[0]][vertex[1]][vertex[2]][vertex[3]]));

    /*// merge close vertices
    for (let k = 1; k < size[2] - 1; k++) {
        for (let j = 1; j < size[1] - 1; j++) {
            for (let i = 1; i < size[0] - 1; i++) {

                // compute the vertex indices around the current grid point
                const vertexIndices = [
                    0 + 3 *  i      + 3 * (size[0] - 1) *  j      + 3 * (size[0] - 1) * (size[1] - 1) *  k     ,
                    1 + 3 *  i      + 3 * (size[0] - 1) *  j      + 3 * (size[0] - 1) * (size[1] - 1) *  k     ,
                    2 + 3 *  i      + 3 * (size[0] - 1) *  j      + 3 * (size[0] - 1) * (size[1] - 1) *  k     ,
                    0 + 3 * (i - 1) + 3 * (size[0] - 1) *  j      + 3 * (size[0] - 1) * (size[1] - 1) *  k     ,
                    1 + 3 *  i      + 3 * (size[0] - 1) * (j - 1) + 3 * (size[0] - 1) * (size[1] - 1) *  k     ,
                    2 + 3 *  i      + 3 * (size[0] - 1) *  j      + 3 * (size[0] - 1) * (size[1] - 1) * (k - 1),
                ];

                // initialize an array for the merged vertices
                const mergedVertices = [];

                // find vertices close to the grid point
                for (let n = 0; n < 3; n++) {
                    if (vertexInterpolants[vertexIndices[n]] <= mergeDistance) {
                        mergedVertices.push(vertexIndices[n]);
                    }
                }

                for (let n = 3; n < 6; n++) {
                    if (vertexInterpolants[vertexIndices[n]] >= 1 - mergeDistance) {
                        mergedVertices.push(vertexIndices[n]);
                    }
                }

                // replace merged vertices with their average position
                if (mergedVertices.length > 1) {

                    // initialize the mean position of the merged vertices
                    const mergedVertex = [0, 0, 0];

                    // compute the mean position
                    for (const vertexIndex of mergedVertices) {
                        for (let axis = 0; axis < 3; axis++) {
                            mergedVertex[axis] += vertices[vertexIndex][axis];
                        }
                    }

                    for (let axis = 0; axis < 3; axis++) {
                        mergedVertex[axis] /= mergedVertices.length;
                    }

                    // add the merged vertex to the array of vertices
                    const mergedVertexIndex = vertices.push(mergedVertex) - 1;
                    vertexFaces.push([]);

                    // replace the merged vertices with the new vertex
                    for (const vertexIndex of mergedVertices) {
                        vertexMap[vertexIndex] = mergedVertexIndex;
                    }
                }
            }
        }
    }

    // prune vertices with only two adjacent faces
    for (let n = 0; n < vertexMap.length; n++) {

        // check the number of faces of the mapped vertex
        if (vertexFaces[vertexMap[n]].length < 3) {

            // delete the extraneous faces
            for (const faceIndex of vertexFaces[vertexMap[n]]) {
                delete faces[faceIndex];
            }

            // clear the array of adjacent faces
            vertexFaces[vertexMap[n]] = [];
        }
    }*/
}

// get the surface triangulation from the lookup table
function getFaces(size, signedDistances) {
    const faces = [];

    for (let i = 0; i < size[0]; i++) {
        for (let j = 0; j < size[1]; j++) {
            for (let k = 0; k < size[2]; k++) {

                // get the signed distance at all grid points in the cell
                const corners = [
                    signedDistances[i    ][j    ][k    ],
                    signedDistances[i + 1][j    ][k    ],
                    signedDistances[i    ][j + 1][k    ],
                    signedDistances[i + 1][j + 1][k    ],
                    signedDistances[i    ][j    ][k + 1],
                    signedDistances[i + 1][j    ][k + 1],
                    signedDistances[i    ][j + 1][k + 1],
                    signedDistances[i + 1][j + 1][k + 1],
                ];

                // compute the index into the lookup table
                const faceLookupIndex = corners.reduce(
                    (faceLookupIndex, signedDistance, cornerIndex) => faceLookupIndex + ((signedDistance <= 0) << cornerIndex),
                    0,
                );

                for (let face of faceLookup[faceLookupIndex]) {

                    // translate vertex lookup indices to vertex array indices
                    face = face.map(
                        (vertexIndex) => [
                            i + vertexLookup[vertexIndex][1][0],
                            j + vertexLookup[vertexIndex][1][1],
                            k + vertexLookup[vertexIndex][1][2],
                            vertexLookup[vertexIndex][0],
                        ]
                    );

                    // triangulate the face
                    for (let n = 2; n < face.length; n++) {
                        faces.push([face[0], face[n - 1], face[n]]);
                    }
                }
            }
        }
    }

    return faces;
}

// interpolate the position of every vertex in the grid
function getVertices(origin, resolution, size, signedDistances) {
    const vertices = [];

    for (let i = 0; i < size[0]; i++) {
        vertices[i] = [];

        for (let j = 0; j < size[1]; j++) {
            vertices[i][j] = [];

            for (let k = 0; k < size[2]; k++) {
                vertices[i][j][k] = [];

                // get the position of the current grid point
                const gridPoint = getGridPoint(origin, resolution, [i, j, k]);

                // get the signed distance at adjacent grid points
                const corners = [
                    signedDistances[i + 1][j][k],
                    signedDistances[i][j + 1][k],
                    signedDistances[i][j][k + 1],
                ];

                for (let axis = 0; axis < 3; axis++) {
                    const interpolant = signedDistances[i][j][k] / (signedDistances[i][j][k] - corners[axis]);

                    // set the base position of the vertex
                    vertices[i][j][k][axis] = [...gridPoint];

                    // add the value of the valid interpolant
                    if (interpolant >= 0 && interpolant <= 1) {
                        vertices[i][j][k][axis][axis] += resolution * interpolant;
                    }

                    // add a default value if the interpolant is invalid
                    else {
                        vertices[i][j][k][axis][axis] += resolution * 0.5;
                    }
                }
            }
        }
    }

    return vertices;
}

// evaluate the signed distance to the solid at each point on the grid
function getSignedDistances(origin, resolution, size, solid) {
    const signedDistances = [];

    for (let i = 0; i < size[0] + 1; i++) {
        signedDistances[i] = [];

        for (let j = 0; j < size[1] + 1; j++) {
            signedDistances[i][j] = [];

            for (let k = 0; k < size[2] + 1; k++) {

                // get the position of the current grid point
                const gridPoint = getGridPoint(origin, resolution, [i, j, k]);

                // evaluate the signed distance function at the grid point
                signedDistances[i][j][k] = solid.signedDistance(...gridPoint);
            }
        }
    }

    return signedDistances;
}

// compute the position of a grid point
function getGridPoint(origin, resolution, gridCoordinates) {
    const gridPoint = [];

    for (let axis = 0; axis < 3; axis++) {
        gridPoint[axis] = origin[axis] + (gridCoordinates[axis] - 0.5) * resolution;
    }

    return gridPoint;
}
