import { faceLookup, vertexLookup } from './lookups.js';

// return a mesh approximating a solid
export function mesh(solid, resolution, mergeDistance) {

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

    // allocate an array to map vertex indices in the vertices array
    const vertexMap = new Array(3 * (size[0] - 1) * (size[1] - 1) * (size[2] - 1));

    // allocate an array to store the interpolant value for each vertex
    const vertexInterpolants = new Array(3 * (size[0] - 1) * (size[1] - 1) * (size[2] - 1));

    // allocate an array to store the adjacent faces for each vertex
    const vertexFaces = new Array(3 * (size[0] - 1) * (size[1] - 1) * (size[2] - 1));

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

                // interpolate the vertices adjacent to the current grid point
                for (let axis = 0; axis < 3; axis++) {

                    // compute the current vertex index
                    const vertexIndex = axis + 3 * i + 3 * (size[0] - 1) * j + 3 * (size[0] - 1) * (size[1] - 1) * k;

                    // store the base position of the vertex
                    vertices[vertexIndex] = [x, y, z];

                    // store the vertex index in the map
                    vertexMap[vertexIndex] = vertexIndex;

                    // initialize the array of adjacent faces
                    vertexFaces[vertexIndex] = [];

                    // interpolate the vertex
                    const interpolant = signedDistance / (signedDistance - corners[axis]);

                    // shift the vertex by the interpolated value
                    if (interpolant >= 0 && interpolant <= 1) {
                        vertices[vertexIndex][axis] += resolution * interpolant;
                        vertexInterpolants[vertexIndex] = interpolant;
                    }

                    // use a default value of 0.5 if the surface is far away
                    else {
                        vertices[vertexIndex][axis] += resolution * 0.5;
                        vertexInterpolants[vertexIndex] = 0.5;
                    }
                }
            }
        }
    }

    // merge close vertices
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
                    (vertex) => vertex[0] + 3 * (i + vertex[1][0]) + 3 * (size[0] - 1) * (j + vertex[1][1]) + 3 * (size[0] - 1) * (size[1] - 1) * (k + vertex[1][2])
                );

                // access the face information from the lookup table
                for (let face of faceLookup[faceIndex]) {

                    // access the vertices of the faces
                    face = face.map((vertexIndex) => vertexMap[vertexIndices[vertexIndex]]);

                    // triangulate the face as a triangle fan
                    for (let n = 2; n < face.length; n++) {

                        // omit faces with merged vertices
                        if (face[0] !== face[n - 1] && face[n - 1] !== face[n] && face[n] !== face[0]) {

                            // append the triangle to the mesh
                            const faceIndex = faces.push([vertices[face[0]], vertices[face[n - 1]], vertices[face[n]]]) - 1;

                            // append this face to the arrays of adjacent faces
                            vertexFaces[face[0]].push(faceIndex);
                            vertexFaces[face[n - 1]].push(faceIndex);
                            vertexFaces[face[n]].push(faceIndex);
                        }
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
    }

    return faces;
}
