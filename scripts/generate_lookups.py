#       ______
#     /4     /6
#   /______/  |
#   5  0___7__2
#   | /    | /
#   1______3

import json

def main():
    print('export const vertexLookup = ', json.dumps(generate_vertex_lookup()), ';', sep = '')
    print('export const faceLookup = ', json.dumps(generate_face_lookup()), ';', sep = '')

# index lookup table
i = [1, 2, 4, 8, 16, 32, 64, 128]

# adjacent corner lookup table
c = [[1, 0, 3, 2, 5, 4, 7, 6], [2, 3, 0, 1, 6, 7, 4, 5], [4, 5, 6, 7, 0, 1, 2, 3]] * 2

# edge lookup table
e = [[0, 0, 1, 1, 2, 2, 3, 3], [4, 5, 4, 5, 6, 7, 6, 7], [8, 9, 10, 11, 8, 9, 10, 11]] * 2

# generate the lookup table to map edge indices to relative coordinates
def generate_vertex_lookup():

    lookup = [[] for n in range(12)]

    for n in (0, 3, 5, 6):
        for a in range(3):
            lookup[e[a][n]] = [(n & 1) + (c[a][n] & 1), (n & 2) + (c[a][n] & 2) >> 1, (n & 4) + (c[a][n] & 4) >> 2]

    return lookup

# generate the lookup table to map cube configurations to faces
def generate_face_lookup():

    lookup = [[] for n in range(256)]

    # one vertex and inverse
    for n in range(8):
        lookup[i[n]] = [[e[0][n], e[1][n], e[2][n]]]
        lookup[0xff ^ i[n]] = [face[::-1] for face in lookup[i[n]]]

        if n.bit_count() % 2:
            lookup[i[n]], lookup[0xff ^ i[n]] = lookup[0xff ^ i[n]], lookup[i[n]]

    # two vertices sharing an edge and inverse
    for n in (0, 3, 5, 6):
        for a in range(3):
            lookup[i[n] + i[c[a][n]]] = [[e[a+2][n], e[a+2][c[a][n]], e[a+1][c[a][n]], e[a+1][n]]]
            lookup[0xff ^ i[n] + i[c[a][n]]] = [face[::-1] for face in lookup[i[n] + i[c[a][n]]]]

    # three vertices sharing a face and inverse
    for n in range(8):
        for a in range(3):
            lookup[i[n] + i[c[a+1][n]] + i[c[a+2][n]]] = [[e[a][n], e[a][c[a+1][n]], e[a][c[a+2][n]]], [e[a+2][c[a+1][n]], e[a+1][c[a+2][n]], e[a][c[a+2][n]], e[a][c[a+1][n]]]]
            lookup[0xff ^ i[n] + i[c[a+1][n]] + i[c[a+2][n]]] = [face[::-1] for face in lookup[i[n] + i[c[a+1][n]] + i[c[a+2][n]]]]

            if n.bit_count() % 2:
                lookup[i[n] + i[c[a+1][n]] + i[c[a+2][n]]], lookup[0xff ^ i[n] + i[c[a+1][n]] + i[c[a+2][n]]] = lookup[0xff ^ i[n] + i[c[a+1][n]] + i[c[a+2][n]]], lookup[i[n] + i[c[a+1][n]] + i[c[a+2][n]]]

    # four vertices sharing a face
    for a in range(3):
        lookup[i[0] + i[c[a+1][0]] + i[c[a+2][0]] + i[c[a+2][c[a+1][0]]]] = [[e[a][0], e[a][c[a+1][0]], e[a][c[a+2][c[a+1][0]]], e[a][c[a+2][0]]]]

    for a in range(3):
        lookup[i[7] + i[c[a+1][7]] + i[c[a+2][7]] + i[c[a+2][c[a+1][7]]]] = [[e[a][c[a+2][c[a+1][7]]], e[a][c[a+1][7]], e[a][7], e[a][c[a+2][7]]]]

    # four vertices around a corner
    for n in range(8):
        lookup[i[n] + i[c[a][n]] + i[c[a+1][n]] + i[c[a+2][n]]] = [[e[a+2][c[a][n]], e[a+1][c[a][n]], e[a][c[a+1][n]], e[a+2][c[a+1][n]], e[a+1][c[a+2][n]], e[a][c[a+2][n]]]]

        if n.bit_count() % 2:
            lookup[i[n] + i[c[a][n]] + i[c[a+1][n]] + i[c[a+2][n]]] = [face[::-1] for face in lookup[i[n] + i[c[a][n]] + i[c[a+1][n]] + i[c[a+2][n]]]]

    # two vertices sharing a face but not an edge and inverse
    for n in (0, 7):
        for a in range(3):
            lookup[i[n] + i[c[a+2][c[a+1][n]]]] = [[e[a][c[a+2][c[a+1][n]]], e[a][n], e[a+1][n], e[a+2][c[a+1][n]]], [e[a][n], e[a][c[a+2][c[a+1][n]]], e[a+1][c[a+2][n]], e[a+2][n]]]
            lookup[0xff ^ i[n] + i[c[a+2][c[a+1][n]]]] = [face[::-1] for face in lookup[i[n] + i[c[a+2][c[a+1][n]]]]]

            lookup[i[c[a+1][n]] + i[c[a+2][n]]] = [[e[a][c[a+2][n]], e[a][c[a+1][n]], e[a+2][c[a+1][n]], e[a+1][c[a+2][n]]], [e[a][c[a+1][n]], e[a][c[a+2][n]], e[a+2][n], e[a+1][n]]]
            lookup[0xff ^ i[c[a+1][n]] + i[c[a+2][n]]] = [face[::-1] for face in lookup[i[c[a+1][n]] + i[c[a+2][n]]]]

            if n.bit_count() % 2:
                lookup[i[n] + i[c[a+2][c[a+1][n]]]], lookup[0xff ^ i[n] + i[c[a+2][c[a+1][n]]]] = lookup[0xff ^ i[n] + i[c[a+2][c[a+1][n]]]], lookup[i[n] + i[c[a+2][c[a+1][n]]]]
                lookup[i[c[a+1][n]] + i[c[a+2][n]]], lookup[0xff ^ i[c[a+1][n]] + i[c[a+2][n]]] = lookup[0xff ^ i[c[a+1][n]] + i[c[a+2][n]]], lookup[i[c[a+1][n]] + i[c[a+2][n]]]

    return lookup

if __name__ == '__main__': main()
