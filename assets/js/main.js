// create a simple stl file and download it

// the header of an stl file is 80 bytes and can be empty
const header = new Uint8Array(80);

// a single 32-bit unsigned integer represents the number of triangles
const triangleCount = new Uint32Array([4]);

// define an empty normal vector
const normalVector = new Float32Array([0, 0, 0]);

// define the vertices
const vertices = [
    new Float32Array([0, 0, 0]),
    new Float32Array([0, 0, 1]),
    new Float32Array([0, 1, 0]),
    new Float32Array([1, 0, 0]),
];

// define a default attribute byte count
const attributeByteCount = new Uint16Array(1);

// create a blob for the stl data
const blob = new Blob([
    header,
    triangleCount,
    normalVector, vertices[3], vertices[1], vertices[0], attributeByteCount,
    normalVector, vertices[1], vertices[2], vertices[0], attributeByteCount,
    normalVector, vertices[2], vertices[3], vertices[0], attributeByteCount,
    normalVector, vertices[2], vertices[1], vertices[3], attributeByteCount,
], { type: 'model/stl' });

// create a url referencing the blob
const url = URL.createObjectURL(blob);
// URL.revokeObjectURL(url);

// create a link to download the data
const link = document.createElement('a');
link.href = url;
link.download = 'tetrahedron.stl';
link.innerText = 'Download a tetrahedron';
document.body.appendChild(link);
