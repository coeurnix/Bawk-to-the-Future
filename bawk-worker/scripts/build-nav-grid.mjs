import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import * as THREE from "three";

const BASE_MAP_PATH = path.resolve("public/assets/base-map.glb");
const OUTPUT_PATH = path.resolve("public/assets/nav-grid.json");
const execFileAsync = promisify(execFile);

const RECT_LIGHT_PREFIX = "rect-light";
const CHAIR_PREFIX = "chair";
const STATIC_CYLINDER_PREFIX = "smcyl-";
const STATIC_BOX_PREFIX = "smbox-";
const NPC_NAV_CELL_SIZE = 0.5;
const FLOOR_RAY_START_HEIGHT = 2;
const FLOOR_RAY_DISTANCE = 6;

const COMPONENTS_BY_TYPE = {
	SCALAR: 1,
	VEC2: 2,
	VEC3: 3,
	VEC4: 4,
	MAT2: 4,
	MAT3: 9,
	MAT4: 16,
};

const COMPONENT_TYPES = {
	5120: { bytes: 1, ArrayType: Int8Array },
	5121: { bytes: 1, ArrayType: Uint8Array },
	5122: { bytes: 2, ArrayType: Int16Array },
	5123: { bytes: 2, ArrayType: Uint16Array },
	5125: { bytes: 4, ArrayType: Uint32Array },
	5126: { bytes: 4, ArrayType: Float32Array },
};

function isSimpleStaticMarker(name) {
	return name.startsWith(CHAIR_PREFIX) ||
		name.startsWith(STATIC_CYLINDER_PREFIX) ||
		name.startsWith(STATIC_BOX_PREFIX);
}

function isDynamicLevelMarker(name) {
	return name.startsWith(RECT_LIGHT_PREFIX) || isSimpleStaticMarker(name);
}

function parseGlb(buffer) {
	if (buffer.readUInt32LE(0) !== 0x46546c67) {
		throw new Error(`${BASE_MAP_PATH} is not a GLB file.`);
	}

	let json = null;
	let binary = null;
	let offset = 12;
	while (offset < buffer.length) {
		const length = buffer.readUInt32LE(offset);
		const type = buffer.readUInt32LE(offset + 4);
		const chunk = buffer.subarray(offset + 8, offset + 8 + length);
		if (type === 0x4e4f534a) {
			json = JSON.parse(chunk.toString("utf8"));
		} else if (type === 0x004e4942) {
			binary = chunk;
		}
		offset += 8 + length;
	}

	if (!json || !binary) {
		throw new Error(`${BASE_MAP_PATH} must contain JSON and BIN chunks.`);
	}
	return { json, binary };
}

async function createDracoDecodedCopy(inputPath) {
	const outputPath = path.join(
		await fs.mkdtemp(path.join(os.tmpdir(), "bawk-nav-grid-")),
		"base-map.decoded.glb",
	);
	try {
		await execFileAsync("gltf-transform", ["copy", inputPath, outputPath]);
	} catch (error) {
		throw new Error(
			"Could not decode base-map.glb for nav-grid baking. " +
			"Install the glTF Transform CLI or ensure `gltf-transform` is on PATH.",
			{ cause: error },
		);
	}
	return outputPath;
}

function readAccessor(gltf, binary, accessorIndex) {
	const accessor = gltf.accessors?.[accessorIndex];
	if (!accessor) {
		throw new Error(`Missing accessor ${accessorIndex}.`);
	}
	if (accessor.sparse) {
		throw new Error(`Sparse accessor ${accessorIndex} is not supported by the nav-grid baker.`);
	}

	const bufferView = gltf.bufferViews?.[accessor.bufferView];
	if (!bufferView) {
		throw new Error(`Accessor ${accessorIndex} has no bufferView.`);
	}

	const component = COMPONENT_TYPES[accessor.componentType];
	const itemSize = COMPONENTS_BY_TYPE[accessor.type];
	if (!component || !itemSize) {
		throw new Error(`Accessor ${accessorIndex} has unsupported component metadata.`);
	}

	const byteOffset = (bufferView.byteOffset ?? 0) + (accessor.byteOffset ?? 0);
	const stride = bufferView.byteStride ?? itemSize * component.bytes;
	const { ArrayType } = component;

	if (stride === itemSize * component.bytes) {
		const start = binary.byteOffset + byteOffset;
		const length = accessor.count * itemSize;
		if (start % component.bytes === 0) {
			return new ArrayType(binary.buffer.slice(start, start + length * component.bytes));
		}
	}

	const output = new ArrayType(accessor.count * itemSize);
	for (let index = 0; index < accessor.count; index += 1) {
		const itemOffset = binary.byteOffset + byteOffset + index * stride;
		const source = new ArrayType(binary.buffer, itemOffset, itemSize);
		output.set(source, index * itemSize);
	}
	return output;
}

function createMeshPrimitive(gltf, binary, primitive, name) {
	if (primitive.mode !== undefined && primitive.mode !== 4) {
		return null;
	}

	const positionAccessor = primitive.attributes?.POSITION;
	if (positionAccessor === undefined) {
		return null;
	}

	const geometry = new THREE.BufferGeometry();
	const positions = readAccessor(gltf, binary, positionAccessor);
	geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

	if (primitive.indices !== undefined) {
		geometry.setIndex(new THREE.BufferAttribute(readAccessor(gltf, binary, primitive.indices), 1));
	}

	const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ side: THREE.FrontSide }));
	mesh.name = name;
	return mesh;
}

function applyNodeTransform(object, node) {
	if (node.matrix) {
		object.matrix.fromArray(node.matrix);
		object.matrix.decompose(object.position, object.quaternion, object.scale);
		return;
	}
	if (node.translation) {
		object.position.fromArray(node.translation);
	}
	if (node.rotation) {
		object.quaternion.fromArray(node.rotation);
	}
	if (node.scale) {
		object.scale.fromArray(node.scale);
	}
}

function buildScene(gltf, binary) {
	const nodeObjects = (gltf.nodes ?? []).map((node, nodeIndex) => {
		const name = node.name ?? `node-${nodeIndex}`;
		const object = new THREE.Object3D();
		object.name = name;
		applyNodeTransform(object, node);

		if (node.mesh !== undefined) {
			const mesh = gltf.meshes?.[node.mesh];
			for (const primitive of mesh?.primitives ?? []) {
				const primitiveMesh = createMeshPrimitive(gltf, binary, primitive, name);
				if (primitiveMesh) {
					object.add(primitiveMesh);
				}
			}
		}

		return object;
	});

	for (let index = 0; index < nodeObjects.length; index += 1) {
		const node = gltf.nodes[index];
		for (const childIndex of node.children ?? []) {
			nodeObjects[index].add(nodeObjects[childIndex]);
		}
	}

	const root = new THREE.Group();
	const scene = gltf.scenes?.[gltf.scene ?? 0];
	for (const nodeIndex of scene?.nodes ?? []) {
		root.add(nodeObjects[nodeIndex]);
	}
	root.updateWorldMatrix(true, true);
	return root;
}

function collectLevelMeshes(root) {
	const meshes = [];
	root.traverse((object) => {
		if (object.isMesh && !isDynamicLevelMarker(object.name)) {
			meshes.push(object);
		}
	});
	return meshes;
}

function isFloorPlacementSurface(object) {
	const name = object.name.toLowerCase();
	return name.includes("floor") || name.includes("threshold");
}

function floorHitAt(raycaster, x, z, startY, objects) {
	raycaster.set(new THREE.Vector3(x, startY, z), new THREE.Vector3(0, -1, 0));
	raycaster.far = FLOOR_RAY_DISTANCE * 3;
	let highestHit = null;

	for (const hit of raycaster.intersectObjects(objects, false)) {
		if (!isFloorPlacementSurface(hit.object)) {
			continue;
		}
		const normal = hit.face?.normal.clone();
		if (!normal) {
			continue;
		}
		normal.transformDirection(hit.object.matrixWorld);
		if (normal.y > 0.55 && (!highestHit || hit.point.y > highestHit.point.y)) {
			highestHit = hit;
		}
	}

	return highestHit;
}

function createNpcNavGrid(levelMeshes) {
	const bounds = new THREE.Box3();
	for (const mesh of levelMeshes) {
		bounds.expandByObject(mesh);
	}

	if (bounds.isEmpty()) {
		throw new Error("No level meshes found for nav-grid baking.");
	}

	const cellSize = NPC_NAV_CELL_SIZE;
	const minX = Math.floor(bounds.min.x / cellSize) * cellSize - cellSize;
	const minZ = Math.floor(bounds.min.z / cellSize) * cellSize - cellSize;
	const maxX = Math.ceil(bounds.max.x / cellSize) * cellSize + cellSize;
	const maxZ = Math.ceil(bounds.max.z / cellSize) * cellSize + cellSize;
	const width = Math.ceil((maxX - minX) / cellSize);
	const depth = Math.ceil((maxZ - minZ) / cellSize);
	const cells = [];
	const startY = bounds.max.y + FLOOR_RAY_START_HEIGHT;
	const raycaster = new THREE.Raycaster();

	for (let z = 0; z < depth; z += 1) {
		for (let x = 0; x < width; x += 1) {
			const worldX = minX + (x + 0.5) * cellSize;
			const worldZ = minZ + (z + 0.5) * cellSize;
			const hit = floorHitAt(raycaster, worldX, worldZ, startY, levelMeshes);
			cells.push({ walkable: !!hit, y: hit ? Number(hit.point.y.toFixed(4)) : 0 });
		}
	}

	return { minX, minZ, width, depth, cellSize, cells };
}

function compactNpcNavGrid(grid) {
	return {
		version: 1,
		minX: grid.minX,
		minZ: grid.minZ,
		width: grid.width,
		depth: grid.depth,
		cellSize: grid.cellSize,
		walkable: grid.cells.map((cell) => cell.walkable ? "1" : "0").join(""),
		y: grid.cells.map((cell) => cell.y),
	};
}

const decodedMapPath = await createDracoDecodedCopy(BASE_MAP_PATH);
const buffer = await fs.readFile(decodedMapPath);
const { json, binary } = parseGlb(buffer);
const scene = buildScene(json, binary);
const levelMeshes = collectLevelMeshes(scene);
const grid = createNpcNavGrid(levelMeshes);

await fs.writeFile(OUTPUT_PATH, `${JSON.stringify(compactNpcNavGrid(grid))}\n`);
await fs.rm(path.dirname(decodedMapPath), { recursive: true, force: true });
console.log(
	`Wrote ${path.relative(process.cwd(), OUTPUT_PATH)} ` +
	`(${grid.width}x${grid.depth}, ${grid.cells.length} cells, ${levelMeshes.length} meshes).`,
);
