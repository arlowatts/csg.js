import { Sphere, Torus } from './primitives.js';
import { Union } from './operators.js';
import { mesh } from './mesh.js';

let sphere = new Sphere(0, 0, 0, 1);
let torus = new Torus(0, 0, 1, 0.5, 0.2);
let union = new Union([sphere, torus]);

// approximate the scene as a mesh
const faces = mesh(union, 0.05, 0.4);

console.log(faces.length);

// the header of an stl file is 80 bytes and can be empty
const header = new Uint8Array(80);

// a single 32-bit unsigned integer represents the number of faces
const triangleCount = new Uint32Array([faces.length]);

// define an empty normal vector
const normalVector = new Float32Array([0, 0, 0]);

// define a default attribute byte
const attributeByteCount = new Uint16Array([0]);

// initialize the data of the stl file
const data = [header, triangleCount];

// load the face data
for (const face of faces) {

    // add a normal vector
    data.push(normalVector)

    // add the vertices
    for (const vertex of face) {
        data.push(new Float32Array(vertex));
    }

    // add the empty attribute bytes
    data.push(attributeByteCount);
}

// create a blob for the stl data
const blob = new Blob(data, { type: 'model/stl' });

// create a url referencing the blob
const url = URL.createObjectURL(blob);
// URL.revokeObjectURL(url);

// create a link to download the data
const link = document.createElement('a');
link.href = url;
link.download = 'model.stl';
link.innerText = 'Download';
document.body.appendChild(link);
