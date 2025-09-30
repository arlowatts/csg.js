import { Sphere, Torus } from './primitives.js';
import { Union } from './operators.js';
import { mesh } from './mesh.js';

// create the scene
const sphere = new Sphere(0, 0, 0, 1);
const torus = new Torus(0, 0, 1, 0.5, 0.2);
const union = new Union([sphere, torus]);

// approximate the scene as a mesh
const [vertexList, faceList] = mesh(union, 0.05, 0.4);

// every ply file starts with the string 'ply' and a format description
const startHeader = [
    'ply\n',
    'format binary_little_endian 1.0\n'
];

// describe the number and properties of vertices
const vertexHeader = [
    `element vertex ${vertexList.length}\n`,
    'property float x\n',
    'property float y\n',
    'property float z\n',
];

// describe the number and properties of faces
const faceHeader = [
    `element face ${faceList.length}\n`,
    'property list uchar uint vertex_indices\n',
];

const endHeader = ['end_header\n'];

// initialize an array for binary data
const data = [];

// add the vertices to the array of data
for (const vertex of vertexList) {
    data.push(new Float32Array(vertex));
}

// add the faces to the array of data
for (const face of faceList) {
    data.push(new Uint8Array([face.length]));
    data.push(new Uint32Array(face));
}

// create a blob for the file data
const blob = new Blob([...startHeader, ...vertexHeader, ...faceHeader, ...endHeader, ...data]);

// create a url referencing the blob
const url = URL.createObjectURL(blob);

// create a link to download the data
const link = document.createElement('a');
link.href = url;
link.download = 'model.ply';
link.innerText = 'Download';
document.body.appendChild(link);
