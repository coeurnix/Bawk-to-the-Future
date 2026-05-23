import * as THREE from "three";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { Octree } from "three/examples/jsm/math/Octree.js";
import { Capsule } from "three/examples/jsm/math/Capsule.js";
import { clone as cloneSkeleton } from "three/examples/jsm/utils/SkeletonUtils.js";
import { SleckUi } from "./sleck-ui";
import { SogoUi, type SogoConversationMode } from "./sogo-ui";

const GRAVITY = 30;
const PLAYER_RADIUS = 0.35;
const STAND_HEIGHT = 1.72;
const CROUCH_HEIGHT = 1.08;
const STAND_EYE = 1.58;
const CROUCH_EYE = 0.96;
const WALK_SPEED = 2.95;
const SPRINT_SPEED = 8.3;
const CROUCH_SPEED = 2.8;
const GROUND_ACCELERATION = 36;
const AIR_ACCELERATION = 9;
const STOP_EPSILON = 0.02;
const JUMP_SPEED = 5.2;
const JUMP_GRACE_SECONDS = 0.12;
const PHYSICS_STEPS = 5;
const COLLISION_PASSES = 3;
const MAX_FRAME_RATE = 60;
const FRAME_INTERVAL_MS = 1000 / MAX_FRAME_RATE;
const NPC_SPAWN_DISTANCE = 2;
const FLOOR_RAY_START_HEIGHT = 2;
const FLOOR_RAY_DISTANCE = 6;
const TELEPORT_FLOOR = -20;
const DEFAULT_AMBIENT_INTENSITY = 1.5;
const DEFAULT_NPC_FILL_INTENSITY = 0.7;
const NPC_NAV_GRID_PATH = "/assets/nav-grid.json";
const RECT_LIGHT_PREFIX = "rect-light";
const OVERHEAD_LIGHT_INTENSITY = 2.45;
const OVERHEAD_LIGHT_HEIGHT = 60;
const OVERHEAD_LIGHT_SHADOW_RADIUS = 46;
const OVERHEAD_LIGHT_SHADOW_FAR = 120;
const OVERHEAD_SHADOW_PASSTHROUGH_MESH_NAMES = new Set([
	"CEILING_TILES_MERGED",
	"processing-ceiling",
	"processing-ceiling.001",
]);
const WALL_MESH_PREFIX = "WALL_";
const WALL_DEPTH_MATERIAL_NAMES = new Set([
	"Interior Wall - pale concrete",
	"Exterior Wall - warm white",
]);
const WALL_DEPTH_NEAR = 5.5;
const WALL_DEPTH_FAR = 31;
const WALL_DEPTH_STRENGTH = 0.56;
const CEILING_TILE_MESH_NAME = "CEILING_TILES_MERGED";
const CEILING_TILE_MATERIAL_NAME = "Ceiling_Tile_Tiling_Material";
const FLOOR_TILE_MESH_NAME = "FLOOR_TILES_MERGED";
const FLOOR_TILE_MATERIAL_NAME = "Floor_Tile_Tiling_Material";
const CHAIR_PREFIX = "chair";
const STATIC_CYLINDER_PREFIX = "smcyl-";
const STATIC_BOX_PREFIX = "smbox-";
const INSTANCED_NON_PBR_PREFIXES = ["smbox-van", "smbox-chicken", "GLASS"] as const;
const CHAIR_COLLISION_RADIUS_SCALE = 0.28;
const CHAIR_COLLISION_MAX_RADIUS = 0.38;
const STATIC_CYLINDER_COLLISION_SCALE = 0.92;
const STATIC_BOX_COLLISION_SCALE = 0.96;
const ANIMATION_BLEND_SECONDS = 0.5;
const NPC_WALK_SPEED = 1.6;
const NPC_WALK_ACCELERATION_SECONDS = 0.45;
const ROBOT_MODEL_YAW_OFFSET = -Math.PI / 2;
const NPC_TURN_BLEND_SECONDS = 0.28;
const NPC_SCRIPTED_TURN_SECONDS = 0.3;
const NPC_TURN_LOOKAHEAD_DISTANCE = 0.7;
const NPC_NAV_CELL_SIZE = 0.5;
const NPC_NAV_AGENT_RADIUS = 0.62;
const NPC_NAV_WALL_CHECK_HEIGHT = 0.75;
const NPC_NAV_MAX_STEP_HEIGHT = 0.45;
const NPC_NAV_CORNER_REACH_DISTANCE = 0.04;
const HEAD_BLEND_SECONDS = 0;
const HEAD_LOOK_X_LIMIT = 0.4;
const HEAD_LOOK_Z_LIMIT = 0.25;
const HEAD_INCLINATION_SCALE = 0;
const EYE_VERTICAL_GAIN = 0.12;
const EYE_HORIZONTAL_GAIN = 0.9;
const PLAYER_GAZE_TARGET_Y_OFFSET = 0;
const TALKFILE_TWEEN_SECONDS = 0.18;
const TALKFILE_SMOOTH_LAMBDA = 14;
const TALKFILE_ROOT = "/assets/talkfiles";
const TALK_JAW_OPEN_TARGET = "SR_21_Jaw_Open";
const INTERACT_DISTANCE = 2;
const TOUCH_LOOK_SENSITIVITY = 0.004;
const STAGE_1_PLAYER_X = -12;
const STAGE_1_PLAYER_Z = -9.45;
const STAGE_1_COWORKER_X = -14.27;
const STAGE_1_COWORKER_Z = -10.61;
const MIN_STAGE_INDEX = 1;
const MAX_STAGE_INDEX = 13;
const NEXTFLIX_DESKTOP_IMAGES = {
	winded: "/assets/images/winded-no-sleck.webp",
	windedWithSleck: "/assets/images/winded.webp",
	selection: "/assets/images/nextflix-selection.webp",
} as const;
const MAIN_MENU_VIDEO_FADE_SECONDS = 1;
const MAIN_MENU_VIDEO_AV1 = "/assets/videos/av1/starting-video-av1.mp4";
const MAIN_MENU_VIDEO_FALLBACK = "/assets/videos/starting-video.mp4";
const ENDING_VIDEO_AV1 = "/assets/videos/av1/ending-video-av1.mp4";
const ENDING_VIDEO_FALLBACK = "/assets/videos/ending-video.mp4";
const MAIN_MENU_SONG_SOURCES = [
	{ url: "/assets/sounds/song.webm", type: 'audio/webm; codecs="opus"' },
	{ url: "/assets/sounds/song.m4a", type: 'audio/mp4; codecs="mp4a.40.2"' },
	{ url: "/assets/sounds/song.mp3", type: "audio/mpeg" },
] as const;
const NEXTFLIX_DESKTOP_SIZE = { width: 1280, height: 960 };
const NEXTFLIX_HOTSPOT = { x: 73, y: 94, width: 260, height: 245 };
const SLECK_HOTSPOT = { x: 72, y: 420, width: 250, height: 260 };
const NEXTFLIX_VIDEO_GRID = { x: 24, y: 121, width: 1234, height: 821, columns: 5, rows: 4 };
const NEXTFLIX_LATER_SECONDS = 4;
const VISEME_MORPH_TARGETS = [
	"AA_VI_00_Sil",
	"AA_VI_01_PP",
	"AA_VI_02_FF",
	"AA_VI_03_TH",
	"AA_VI_04_DD",
	"AA_VI_05_KK",
	"AA_VI_06_CH",
	"AA_VI_07_SS",
	"AA_VI_08_nn",
	"AA_VI_09_RR",
	"AA_VI_10_aa",
	"AA_VI_11_E",
	"AA_VI_12_I",
	"AA_VI_13_O",
	"AA_VI_14_U",
] as const;
const TALK_MORPH_TARGETS = [...VISEME_MORPH_TARGETS, TALK_JAW_OPEN_TARGET] as const;
const DEFAULT_STATUS_TEXT = "";

const canvas = document.querySelector<HTMLCanvasElement>("#game");
const entryScreen = document.querySelector<HTMLDivElement>("#entry-screen");
const mainMenu = document.querySelector<HTMLDivElement>("#main-menu");
const startGameButton = document.querySelector<HTMLButtonElement>("#start-game-button");
const mainMenuLoading = document.querySelector<HTMLDivElement>("#main-menu-loading");
const mainMenuLoadingText = document.querySelector<HTMLSpanElement>("#main-menu-loading-text");
const mainMenuVideoA = document.querySelector<HTMLVideoElement>("#main-menu-video-a");
const mainMenuVideoB = document.querySelector<HTMLVideoElement>("#main-menu-video-b");
const mainMenuWhiteFade = document.querySelector<HTMLDivElement>("#main-menu-white-fade");
const endingVideoOverlay = document.querySelector<HTMLDivElement>("#ending-video-overlay");
const endingVideo = document.querySelector<HTMLVideoElement>("#ending-video");
const loading = document.querySelector<HTMLDivElement>("#loading");
const prompt = document.querySelector<HTMLDivElement>("#prompt");
const crosshair = document.querySelector<HTMLDivElement>("#crosshair");
const missionLine = document.querySelector<HTMLDivElement>("#mission-line");
const statusLine = document.querySelector<HTMLDivElement>("#status-line");
const captionLine = document.querySelector<HTMLDivElement>("#caption-line");
const positionLine = document.querySelector<HTMLDivElement>("#position-line");
const consolePanel = document.querySelector<HTMLDivElement>("#console-panel");
const consoleInput = document.querySelector<HTMLInputElement>("#console-input");
const consoleLog = document.querySelector<HTMLDivElement>("#console-log");
const animationBrowser = document.querySelector<HTMLDivElement>("#animation-browser");
const animationBrowserClose = document.querySelector<HTMLButtonElement>("#animation-browser-close");
const femaleAnimationList = document.querySelector<HTMLDivElement>("#female-animation-list");
const maleAnimationList = document.querySelector<HTMLDivElement>("#male-animation-list");
const femaleAnimationSearch = document.querySelector<HTMLInputElement>("#female-animation-search");
const maleAnimationSearch = document.querySelector<HTMLInputElement>("#male-animation-search");
const imageOverlay = document.querySelector<HTMLDivElement>("#image-overlay");
const imageOverlayImage = document.querySelector<HTMLImageElement>("#image-overlay-image");
const imageOverlayVideo = document.querySelector<HTMLVideoElement>("#image-overlay-video");
const laterCard = document.querySelector<HTMLDivElement>("#later-card");
const touchControls = document.querySelector<HTMLDivElement>("#touch-controls");
const touchLookZone = document.querySelector<HTMLDivElement>("#touch-look-zone");
const touchStick = document.querySelector<HTMLDivElement>("#touch-stick");
const touchStickThumb = document.querySelector<HTMLDivElement>("#touch-stick-thumb");
const touchInteract = document.querySelector<HTMLButtonElement>("#touch-interact");

if (
	!canvas ||
	!entryScreen ||
	!mainMenu ||
	!startGameButton ||
	!mainMenuLoading ||
	!mainMenuLoadingText ||
	!mainMenuVideoA ||
	!mainMenuVideoB ||
	!mainMenuWhiteFade ||
	!endingVideoOverlay ||
	!endingVideo ||
	!loading ||
	!prompt ||
	!crosshair ||
	!missionLine ||
	!statusLine ||
	!captionLine ||
	!positionLine ||
	!consolePanel ||
	!consoleInput ||
	!consoleLog ||
	!animationBrowser ||
	!animationBrowserClose ||
	!femaleAnimationList ||
	!maleAnimationList ||
	!femaleAnimationSearch ||
	!maleAnimationSearch ||
	!imageOverlay ||
	!imageOverlayImage ||
	!imageOverlayVideo ||
	!laterCard ||
	!touchControls ||
	!touchLookZone ||
	!touchStick ||
	!touchStickThumb ||
	!touchInteract
) {
	throw new Error("Game shell is missing required DOM nodes.");
}

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x16191d);
scene.fog = new THREE.Fog(0x16191d, 35, 85);

const camera = new THREE.PerspectiveCamera(50, 1, 0.05, 250);
camera.rotation.order = "YXZ";

const ambientLight = new THREE.AmbientLight(0xffffff, DEFAULT_AMBIENT_INTENSITY);
scene.add(ambientLight);

const overheadLight = new THREE.DirectionalLight(0xffffff, OVERHEAD_LIGHT_INTENSITY);
overheadLight.position.set(0, OVERHEAD_LIGHT_HEIGHT, 0);
overheadLight.target.position.set(0, 0, 0);
overheadLight.castShadow = true;
overheadLight.shadow.mapSize.set(2048, 2048);
overheadLight.shadow.camera.left = -OVERHEAD_LIGHT_SHADOW_RADIUS;
overheadLight.shadow.camera.right = OVERHEAD_LIGHT_SHADOW_RADIUS;
overheadLight.shadow.camera.top = OVERHEAD_LIGHT_SHADOW_RADIUS;
overheadLight.shadow.camera.bottom = -OVERHEAD_LIGHT_SHADOW_RADIUS;
overheadLight.shadow.camera.near = 0.5;
overheadLight.shadow.camera.far = OVERHEAD_LIGHT_SHADOW_FAR;
overheadLight.shadow.bias = -0.00015;
overheadLight.shadow.normalBias = 0.035;
scene.add(overheadLight, overheadLight.target);

scene.add(camera);
const audioListener = new THREE.AudioListener();
camera.add(audioListener);

const worldOctree = new Octree();
const floorRaycaster = new THREE.Raycaster();
const levelMeshes: THREE.Mesh[] = [];
const navRaycaster = new THREE.Raycaster();
const interactionRay = new THREE.Ray();
const playerCollider = new Capsule(
	new THREE.Vector3(7, 0.22 + PLAYER_RADIUS, -3),
	new THREE.Vector3(7, 0.22 + STAND_HEIGHT - PLAYER_RADIUS, -3),
	PLAYER_RADIUS,
);
const playerVelocity = new THREE.Vector3();
const playerDirection = new THREE.Vector3();
const desiredMove = new THREE.Vector3();
const spawnFeet = new THREE.Vector3(-2, 0.23, -8);
const keyStates = new Map<string, boolean>();
const clock = new THREE.Clock();
const modelCache = new Map<string, THREE.Group>();
const animationCache = new Map<string, THREE.AnimationClip>();
let npcNavGrid: NpcNavGrid | null = null;
const availableModels = new Set([
	"npc-executive",
	"npc-female-coworker",
	"npc-male-coworker",
	"npc-previous-coworker",
	"npc-robot",
	"npc-security",
]);
const fallbackAnimations = [
	"f_gestic_listen_accept_01",
	"f_idle_breathe_02",
	"f_idle_touch_hair_01",
	"m_gestic_talk_relaxed_01",
	"m_idle_breathe_01",
	"m_idle_scratch_head_01",
] as const;
const preloadAnimations = [
	"f_idle_breathe_02",
	"f_walk_start",
	"f_walk_neutral",
	"f_walk_stop",
	"m_walk_start",
	"m_walk_neutral",
	"m_walk_stop",
] as const;
const availableAnimations = new Set<string>(fallbackAnimations);
let animationManifest = [...fallbackAnimations];
const availableSequences = new Set(["test-sequence-1", "test-sequence-2", "test-sequence-03"]);
const consoleCommands = [
	"add-model",
	"animation-browser",
	"help",
	"lighting",
	"loop-animation",
	"npc-fill",
	"play-sequence",
	"play-animation",
	"say-talkfile",
	"show-position",
	"hide-position",
	"stop-animations",
	"teleport",
];
const npcMaterials = new Set<THREE.Material>();
const npcs: NpcInstance[] = [];
const npcsById = new Map<string, NpcInstance>();
const pendingSequenceNpcs = new Map<string, Promise<NpcInstance>>();
const sequenceCache = new Map<string, SequenceDefinition>();
const talkfileCache = new Map<string, Talkfile>();
const activeSequences: ActiveSequence[] = [];
const activeTalks: ActiveTalk[] = [];
const audioCache = new Map<string, HTMLAudioElement>();
const talkAudioCache = new Map<string, AudioBuffer>();
const chairs: ChairInstance[] = [];
const staticCylinders: CylinderCollider[] = [];
const staticBoxes: BoxCollider[] = [];
const actionStopTimers = new WeakMap<THREE.AnimationAction, number>();
const wallDepthPlayerPosition = new THREE.Vector3();

function isRectLightMarker(object: THREE.Object3D) {
	return object.name.startsWith(RECT_LIGHT_PREFIX);
}

function isChairMarker(object: THREE.Object3D) {
	return object.name.startsWith(CHAIR_PREFIX);
}

function isStaticCylinderMarker(object: THREE.Object3D) {
	return object.name.startsWith(STATIC_CYLINDER_PREFIX);
}

function isStaticBoxMarker(object: THREE.Object3D) {
	return object.name.startsWith(STATIC_BOX_PREFIX);
}

function isSimpleStaticMarker(object: THREE.Object3D) {
	return isChairMarker(object) || isStaticCylinderMarker(object) || isStaticBoxMarker(object);
}

function isDynamicLevelMarker(object: THREE.Object3D) {
	return isRectLightMarker(object) || isSimpleStaticMarker(object);
}

function shouldPassOverheadShadow(object: THREE.Object3D) {
	return isRectLightMarker(object) || OVERHEAD_SHADOW_PASSTHROUGH_MESH_NAMES.has(object.name);
}

function isWallDepthMesh(mesh: THREE.Mesh) {
	return mesh.name.startsWith(WALL_MESH_PREFIX);
}

function isWallDepthMaterial(material: THREE.Material) {
	return WALL_DEPTH_MATERIAL_NAMES.has(material.name);
}

function isNamedMaterial(material: THREE.Material, name: string) {
	return material.name === name;
}

function toSingleInstanceMesh(mesh: THREE.Mesh) {
	const instancedMesh = new THREE.InstancedMesh(mesh.geometry, mesh.material, 1);
	instancedMesh.name = mesh.name;
	instancedMesh.position.copy(mesh.position);
	instancedMesh.quaternion.copy(mesh.quaternion);
	instancedMesh.scale.copy(mesh.scale);
	instancedMesh.matrix.copy(mesh.matrix);
	instancedMesh.matrixAutoUpdate = mesh.matrixAutoUpdate;
	instancedMesh.visible = mesh.visible;
	instancedMesh.frustumCulled = mesh.frustumCulled;
	instancedMesh.renderOrder = mesh.renderOrder;
	instancedMesh.userData = { ...mesh.userData };
	instancedMesh.layers.mask = mesh.layers.mask;
	instancedMesh.setMatrixAt(0, new THREE.Matrix4());
	instancedMesh.instanceMatrix.needsUpdate = true;

	const parent = mesh.parent;
	if (!parent) {
		return instancedMesh;
	}

	const index = parent.children.indexOf(mesh);
	if (index === -1) {
		parent.add(instancedMesh);
		parent.remove(mesh);
		return instancedMesh;
	}

	parent.children[index] = instancedMesh;
	instancedMesh.parent = parent;
	mesh.parent = null;
	return instancedMesh;
}

function ensureInstancedMarkers(level: THREE.Object3D, predicate: (object: THREE.Object3D) => boolean) {
	const markers: THREE.Object3D[] = [];
	level.traverse((object) => {
		if (predicate(object)) {
			markers.push(object);
		}
	});

	return markers.map((marker) => {
		if ((marker as THREE.InstancedMesh).isInstancedMesh) {
			return marker as THREE.InstancedMesh;
		}
		if ((marker as THREE.Mesh).isMesh) {
			return toSingleInstanceMesh(marker as THREE.Mesh);
		}

		throw new Error(`Base map object "${marker.name}" must be a mesh or THREE.InstancedMesh.`);
	});
}

function createStaticCollisionRoot(level: THREE.Object3D) {
	const collisionRoot = new THREE.Group();
	const meshWorldPosition = new THREE.Vector3();
	const meshWorldQuaternion = new THREE.Quaternion();
	const meshWorldScale = new THREE.Vector3();

	level.updateWorldMatrix(true, true);
	level.traverse((object) => {
		if (!(object as THREE.Mesh).isMesh || isDynamicLevelMarker(object)) {
			return;
		}

		const mesh = object as THREE.Mesh;
		const collisionMesh = new THREE.Mesh(mesh.geometry);
		mesh.matrixWorld.decompose(meshWorldPosition, meshWorldQuaternion, meshWorldScale);
		collisionMesh.position.copy(meshWorldPosition);
		collisionMesh.quaternion.copy(meshWorldQuaternion);
		collisionMesh.scale.copy(meshWorldScale);
		collisionRoot.add(collisionMesh);
	});

	collisionRoot.updateWorldMatrix(true, true);
	return collisionRoot;
}

function collectMeshes(level: THREE.Object3D, predicate: (object: THREE.Object3D) => boolean) {
	const meshes: THREE.Mesh[] = [];
	level.traverse((object) => {
		if (predicate(object) && (object as THREE.Mesh).isMesh) {
			meshes.push(object as THREE.Mesh);
		}
	});
	return meshes;
}

function removeObjectFromParent(object: THREE.Object3D) {
	const parent = object.parent;
	if (!parent) {
		return;
	}
	parent.remove(object);
}

function shouldRemoveInstancedPbr(mesh: THREE.Mesh) {
	return INSTANCED_NON_PBR_PREFIXES.some((prefix) => mesh.name.startsWith(prefix));
}

function isPbrMaterial(material: THREE.Material) {
	return (material as THREE.MeshStandardMaterial).isMeshStandardMaterial === true ||
		(material as THREE.MeshPhysicalMaterial).isMeshPhysicalMaterial === true;
}

function createNonPbrInstancedMaterial(material: THREE.Material) {
	if (!isPbrMaterial(material)) {
		return material;
	}

	const pbrMaterial = material as THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial;
	const nonPbrMaterial = new THREE.MeshLambertMaterial({
		alphaMap: pbrMaterial.alphaMap,
		alphaTest: pbrMaterial.alphaTest,
		aoMap: pbrMaterial.aoMap,
		aoMapIntensity: pbrMaterial.aoMapIntensity,
		blending: pbrMaterial.blending,
		color: pbrMaterial.color.clone(),
		depthTest: pbrMaterial.depthTest,
		depthWrite: pbrMaterial.depthWrite,
		emissive: pbrMaterial.emissive.clone(),
		emissiveIntensity: pbrMaterial.emissiveIntensity,
		emissiveMap: pbrMaterial.emissiveMap,
		fog: pbrMaterial.fog,
		lightMap: pbrMaterial.lightMap,
		lightMapIntensity: pbrMaterial.lightMapIntensity,
		map: pbrMaterial.map,
		opacity: pbrMaterial.opacity,
		side: pbrMaterial.side,
		toneMapped: pbrMaterial.toneMapped,
		transparent: pbrMaterial.transparent,
		vertexColors: pbrMaterial.vertexColors,
		wireframe: pbrMaterial.wireframe,
	});
	nonPbrMaterial.name = material.name;
	nonPbrMaterial.visible = material.visible;
	nonPbrMaterial.userData = { ...material.userData };
	return nonPbrMaterial;
}

function createWallDepthMaterial(material: THREE.Material) {
	const wallMaterial = material.clone();
	wallMaterial.onBeforeCompile = (shader) => {
		shader.uniforms.bawkWallPlayerPosition = { value: wallDepthPlayerPosition };
		shader.uniforms.bawkWallNear = { value: WALL_DEPTH_NEAR };
		shader.uniforms.bawkWallFar = { value: WALL_DEPTH_FAR };
		shader.uniforms.bawkWallStrength = { value: WALL_DEPTH_STRENGTH };
		shader.vertexShader = shader.vertexShader
			.replace(
				"#include <common>",
				`#include <common>
varying vec3 vBawkWallWorldPosition;
varying vec3 vBawkWallWorldNormal;`,
			)
			.replace(
				"#include <worldpos_vertex>",
				`#include <worldpos_vertex>
vBawkWallWorldPosition = worldPosition.xyz;
vBawkWallWorldNormal = normalize(mat3(modelMatrix) * objectNormal);`,
			);
		shader.fragmentShader = shader.fragmentShader
			.replace(
				"#include <common>",
				`#include <common>
uniform vec3 bawkWallPlayerPosition;
uniform float bawkWallNear;
uniform float bawkWallFar;
uniform float bawkWallStrength;
varying vec3 vBawkWallWorldPosition;
varying vec3 vBawkWallWorldNormal;`,
			)
			.replace(
				"#include <dithering_fragment>",
				`vec3 bawkWallNormal = normalize(vBawkWallWorldNormal);
float bawkWallDistance = length(vBawkWallWorldPosition.xz - bawkWallPlayerPosition.xz);
float bawkWallDistanceMix = smoothstep(bawkWallNear, bawkWallFar, bawkWallDistance);
float bawkWallDepthShade = mix(1.0, 1.0 - bawkWallStrength, bawkWallDistanceMix);
float bawkWallFacingShade = clamp(0.99 + bawkWallNormal.z * 0.075 - bawkWallNormal.x * 0.052, 0.86, 1.1);
float bawkWallGrain =
	sin(vBawkWallWorldPosition.x * 1.7 + vBawkWallWorldPosition.y * 4.1) +
	sin(vBawkWallWorldPosition.z * 2.3 - vBawkWallWorldPosition.y * 3.4) +
	sin((vBawkWallWorldPosition.x + vBawkWallWorldPosition.z) * 3.1);
float bawkWallSurfaceShade = clamp(1.0 + bawkWallGrain * 0.014, 0.95, 1.045);
gl_FragColor.rgb *= bawkWallDepthShade * bawkWallFacingShade * bawkWallSurfaceShade;
#include <dithering_fragment>`,
			);
	};
	wallMaterial.customProgramCacheKey = () => "bawk-wall-depth-v2";
	wallMaterial.needsUpdate = true;
	return wallMaterial;
}

function applyWallDepthMaterial(mesh: THREE.Mesh) {
	if (!isWallDepthMesh(mesh)) {
		return;
	}
	if (Array.isArray(mesh.material)) {
		mesh.material = mesh.material.map((material) =>
			isWallDepthMaterial(material) ? createWallDepthMaterial(material) : material,
		);
		return;
	}
	if (isWallDepthMaterial(mesh.material)) {
		mesh.material = createWallDepthMaterial(mesh.material);
	}
}

function createCeilingTileGridMaterial(material: THREE.Material) {
	const tileMaterial = material.clone();
	tileMaterial.onBeforeCompile = (shader) => {
		shader.vertexShader = shader.vertexShader
			.replace(
				"#include <common>",
				`#include <common>
varying vec3 vBawkCeilingWorldPosition;`,
			)
			.replace(
				"#include <worldpos_vertex>",
				`#include <worldpos_vertex>
vBawkCeilingWorldPosition = worldPosition.xyz;`,
			);
		shader.fragmentShader = shader.fragmentShader
			.replace(
				"#include <common>",
				`#include <common>
varying vec3 vBawkCeilingWorldPosition;`,
			)
			.replace(
				"#include <dithering_fragment>",
				`vec2 bawkCeilingTile = abs(fract(vBawkCeilingWorldPosition.xz * 1.0) - 0.5);
float bawkCeilingGrid = 1.0 - smoothstep(0.018, 0.04, min(bawkCeilingTile.x, bawkCeilingTile.y));
float bawkCeilingPanel = (step(0.5, fract(vBawkCeilingWorldPosition.x * 0.25)) - 0.5) * 0.024
	+ (step(0.5, fract(vBawkCeilingWorldPosition.z * 0.25)) - 0.5) * 0.018;
gl_FragColor.rgb *= 1.0 - bawkCeilingGrid * 0.18;
gl_FragColor.rgb += bawkCeilingPanel;
#include <dithering_fragment>`,
			);
	};
	tileMaterial.customProgramCacheKey = () => "bawk-ceiling-grid-v1";
	tileMaterial.needsUpdate = true;
	return tileMaterial;
}

function createFloorCarpetMaterial(material: THREE.Material) {
	const carpetMaterial = material.clone();
	carpetMaterial.onBeforeCompile = (shader) => {
		shader.vertexShader = shader.vertexShader
			.replace(
				"#include <common>",
				`#include <common>
varying vec3 vBawkFloorWorldPosition;`,
			)
			.replace(
				"#include <worldpos_vertex>",
				`#include <worldpos_vertex>
vBawkFloorWorldPosition = worldPosition.xyz;`,
			);
		shader.fragmentShader = shader.fragmentShader
			.replace(
				"#include <common>",
				`#include <common>
varying vec3 vBawkFloorWorldPosition;`,
			)
			.replace(
				"#include <dithering_fragment>",
				`vec2 bawkFloorP = vBawkFloorWorldPosition.xz;
float bawkFloorThreadA = step(0.5, fract(bawkFloorP.x * 7.5));
float bawkFloorThreadB = step(0.5, fract(bawkFloorP.y * 8.5));
float bawkFloorWeave = (bawkFloorThreadA + bawkFloorThreadB - 1.0) * 0.035;
float bawkFloorNoise = fract(sin(dot(floor(bawkFloorP * 3.0), vec2(12.9898, 78.233))) * 43758.5453) - 0.5;
float bawkFloorTile = 1.0 - smoothstep(0.012, 0.032, min(abs(fract(bawkFloorP.x * 0.3333) - 0.5), abs(fract(bawkFloorP.y * 0.3333) - 0.5)));
gl_FragColor.rgb *= 0.94 + bawkFloorWeave + bawkFloorNoise * 0.045 - bawkFloorTile * 0.035;
#include <dithering_fragment>`,
			);
	};
	carpetMaterial.customProgramCacheKey = () => "bawk-floor-carpet-v1";
	carpetMaterial.needsUpdate = true;
	return carpetMaterial;
}

function applyProceduralSurfaceMaterials(mesh: THREE.Mesh) {
	if (Array.isArray(mesh.material)) {
		mesh.material = mesh.material.map((material) => {
			if (mesh.name === CEILING_TILE_MESH_NAME && isNamedMaterial(material, CEILING_TILE_MATERIAL_NAME)) {
				return createCeilingTileGridMaterial(material);
			}
			if (mesh.name === FLOOR_TILE_MESH_NAME && isNamedMaterial(material, FLOOR_TILE_MATERIAL_NAME)) {
				return createFloorCarpetMaterial(material);
			}
			return material;
		});
		return;
	}
	if (mesh.name === CEILING_TILE_MESH_NAME && isNamedMaterial(mesh.material, CEILING_TILE_MATERIAL_NAME)) {
		mesh.material = createCeilingTileGridMaterial(mesh.material);
	}
	if (mesh.name === FLOOR_TILE_MESH_NAME && isNamedMaterial(mesh.material, FLOOR_TILE_MATERIAL_NAME)) {
		mesh.material = createFloorCarpetMaterial(mesh.material);
	}
}

function createInstancedMaterial(
	material: THREE.Material | THREE.Material[],
	removePbr: boolean,
) {
	if (!removePbr) {
		return material;
	}
	if (Array.isArray(material)) {
		return material.map((entry) => createNonPbrInstancedMaterial(entry));
	}
	return createNonPbrInstancedMaterial(material);
}

function createStaticInstancedMeshes(
	meshes: THREE.Mesh[],
	namePrefix: string,
) {
	const batches: {
		geometry: THREE.BufferGeometry;
		material: THREE.Material | THREE.Material[];
		removePbr: boolean;
		meshes: THREE.Mesh[];
	}[] = [];

	for (const mesh of meshes) {
		const removePbr = shouldRemoveInstancedPbr(mesh);
		const batch = batches.find((candidate) =>
			candidate.geometry === mesh.geometry &&
			candidate.material === mesh.material &&
			candidate.removePbr === removePbr
		);
		if (batch) {
			batch.meshes.push(mesh);
		} else {
			batches.push({ geometry: mesh.geometry, material: mesh.material, removePbr, meshes: [mesh] });
		}
	}

	return batches.map((batch, batchIndex) => {
		const material = createInstancedMaterial(batch.material, batch.removePbr);
		const instancedMesh = new THREE.InstancedMesh(batch.geometry, material, batch.meshes.length);
		instancedMesh.name = `${namePrefix}-static-instances-${batchIndex}`;
		instancedMesh.castShadow = true;
		instancedMesh.receiveShadow = true;
		instancedMesh.frustumCulled = false;

		for (let index = 0; index < batch.meshes.length; index += 1) {
			instancedMesh.setMatrixAt(index, batch.meshes[index].matrixWorld);
		}
		instancedMesh.instanceMatrix.needsUpdate = true;
		instancedMesh.computeBoundingSphere();

		return instancedMesh;
	});
}

function createChairColliders(mesh: THREE.Mesh) {
	if (!mesh.geometry.boundingBox) {
		mesh.geometry.computeBoundingBox();
	}

	const geometryBounds = mesh.geometry.boundingBox;
	if (!geometryBounds) {
		return [];
	}

	const instances: ChairInstance[] = [];
	const instanceBounds = new THREE.Box3();
	const center = new THREE.Vector3();
	const size = new THREE.Vector3();

	instanceBounds.copy(geometryBounds).applyMatrix4(mesh.matrixWorld);
	if (instanceBounds.isEmpty()) {
		return instances;
	}

	instanceBounds.getCenter(center);
	instanceBounds.getSize(size);
	instances.push({
		center: center.clone(),
		radius: Math.min(Math.max(size.x, size.z) * CHAIR_COLLISION_RADIUS_SCALE, CHAIR_COLLISION_MAX_RADIUS),
		halfHeight: size.y * 0.5,
	});

	return instances;
}

function meshWorldBounds(mesh: THREE.Mesh) {
	if (!mesh.geometry.boundingBox) {
		mesh.geometry.computeBoundingBox();
	}
	const geometryBounds = mesh.geometry.boundingBox;
	if (!geometryBounds) {
		return null;
	}
	const bounds = new THREE.Box3().copy(geometryBounds).applyMatrix4(mesh.matrixWorld);
	return bounds.isEmpty() ? null : bounds;
}

function createStaticCylinderColliders(mesh: THREE.Mesh) {
	const bounds = meshWorldBounds(mesh);
	if (!bounds) {
		return [];
	}
	const center = new THREE.Vector3();
	const size = new THREE.Vector3();
	bounds.getCenter(center);
	bounds.getSize(size);
	return [{
		center,
		radius: Math.max(0.01, Math.min(size.x, size.z) * 0.5 * STATIC_CYLINDER_COLLISION_SCALE),
		halfHeight: size.y * 0.5,
	}];
}

function createStaticBoxColliders(mesh: THREE.Mesh) {
	const bounds = meshWorldBounds(mesh);
	if (!bounds) {
		return [];
	}
	const center = new THREE.Vector3();
	const halfSize = new THREE.Vector3();
	bounds.getCenter(center);
	bounds.getSize(halfSize).multiplyScalar(0.5 * STATIC_BOX_COLLISION_SCALE);
	return [{ center, halfSize }];
}

function staticInteractionKey(name: string) {
	return name.replace(/[._]\d+$/, "");
}

function isStaticInteractionMarker(mesh: THREE.Mesh) {
	return mesh.name.startsWith(STATIC_BOX_PREFIX) || staticInteractionKey(mesh.name) === "smcyl-sogo";
}

function registerStaticInteractionTarget(mesh: THREE.Mesh) {
	const bounds = meshWorldBounds(mesh);
	if (!bounds || !isStaticInteractionMarker(mesh)) {
		return;
	}
	const helper = new THREE.Box3Helper(bounds, 0xffd24a);
	helper.name = `${mesh.name}-interaction-outline`;
	helper.visible = false;
	helper.material.depthTest = false;
	helper.renderOrder = 1000;
	const target = { name: mesh.name, bounds, helper };
	staticBoxInteractionTargets.set(mesh.name, target);
	staticBoxInteractionTargets.set(mesh.name.replace(/_(\d+)$/, ".$1"), target);
	staticBoxInteractionTargets.set(mesh.name.replace(/\.(\d+)$/, "_$1"), target);
	if (!staticBoxInteractionTargets.has(staticInteractionKey(mesh.name))) {
		staticBoxInteractionTargets.set(staticInteractionKey(mesh.name), target);
	}
	scene.add(helper);
}

function npcInteractionKey(npc: NpcInstance) {
	return npc.id ?? npc.modelName;
}

function npcInteractionBounds(npc: NpcInstance) {
	const bounds = new THREE.Box3().setFromObject(npc.root);
	if (bounds.isEmpty()) {
		const center = npc.root.position.clone().add(new THREE.Vector3(0, 1.05, 0));
		bounds.setFromCenterAndSize(center, new THREE.Vector3(1.1, 2.1, 1.1));
	}
	const size = bounds.getSize(new THREE.Vector3());
	if (size.y < 1.8) {
		const center = bounds.getCenter(new THREE.Vector3());
		bounds.setFromCenterAndSize(center, new THREE.Vector3(Math.max(size.x, 0.9), 2.0, Math.max(size.z, 0.9)));
	}
	return bounds.expandByScalar(0.08);
}

function ensureNpcInteractionTarget(npc: NpcInstance) {
	const key = npcInteractionKey(npc);
	const existing = npcInteractionTargets.get(key);
	if (existing) {
		existing.bounds.copy(npcInteractionBounds(npc));
		return existing;
	}
	const bounds = npcInteractionBounds(npc);
	const helper = new THREE.Box3Helper(bounds, 0xffd24a);
	helper.name = `${key}-interaction-outline`;
	helper.visible = false;
	helper.material.depthTest = false;
	helper.renderOrder = 1000;
	const target = { name: key, bounds, helper };
	npcInteractionTargets.set(key, target);
	scene.add(helper);
	return target;
}

function updateNpcInteractionOutlines() {
	for (const [key, target] of npcInteractionTargets) {
		if (!target.helper.visible) {
			continue;
		}
		const npc = npcsById.get(key) ?? npcs.find((candidate) => candidate.modelName === key);
		if (!npc?.root.visible) {
			target.helper.visible = false;
			continue;
		}
		target.bounds.copy(npcInteractionBounds(npc));
	}
}

function isFloorPlacementSurface(object: THREE.Object3D) {
	const name = object.name.toLowerCase();
	return name.includes("floor") || name.includes("threshold");
}

function floorHitAt(x: number, z: number, startY: number, objects: THREE.Object3D[]) {
	navRaycaster.set(new THREE.Vector3(x, startY, z), new THREE.Vector3(0, -1, 0));
	navRaycaster.far = FLOOR_RAY_DISTANCE * 3;
	let highestHit: THREE.Intersection | null = null;

	for (const hit of navRaycaster.intersectObjects(objects, false)) {
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

function hasWallBetween(from: THREE.Vector3, to: THREE.Vector3) {
	const delta = to.clone().sub(from);
	const distance = delta.length();
	if (distance <= 0.0001) {
		return false;
	}

	navRaycaster.set(from, delta.multiplyScalar(1 / distance));
	navRaycaster.far = distance;
	for (const hit of navRaycaster.intersectObjects(levelMeshes, false)) {
		const normal = hit.face?.normal.clone();
		if (!normal) {
			continue;
		}
		normal.transformDirection(hit.object.matrixWorld);
		if (Math.abs(normal.y) < 0.45) {
			return true;
		}
	}
	return false;
}

function createNpcNavGrid() {
	const bounds = new THREE.Box3();
	for (const mesh of levelMeshes) {
		bounds.expandByObject(mesh);
	}

	if (bounds.isEmpty()) {
		return null;
	}

	const cellSize = NPC_NAV_CELL_SIZE;
	const minX = Math.floor(bounds.min.x / cellSize) * cellSize - cellSize;
	const minZ = Math.floor(bounds.min.z / cellSize) * cellSize - cellSize;
	const maxX = Math.ceil(bounds.max.x / cellSize) * cellSize + cellSize;
	const maxZ = Math.ceil(bounds.max.z / cellSize) * cellSize + cellSize;
	const width = Math.ceil((maxX - minX) / cellSize);
	const depth = Math.ceil((maxZ - minZ) / cellSize);
	const cells: NpcNavCell[] = [];
	const startY = bounds.max.y + FLOOR_RAY_START_HEIGHT;

	for (let z = 0; z < depth; z += 1) {
		for (let x = 0; x < width; x += 1) {
			const worldX = minX + (x + 0.5) * cellSize;
			const worldZ = minZ + (z + 0.5) * cellSize;
			const hit = floorHitAt(worldX, worldZ, startY, levelMeshes);
			cells.push({ walkable: !!hit, y: hit?.point.y ?? 0 });
		}
	}

	return { minX, minZ, width, depth, cellSize, cells };
}

function isNpcNavGrid(value: unknown): value is NpcNavGrid {
	if (!isObject(value)) {
		return false;
	}
	const grid = value as Partial<NpcNavGrid>;
	return typeof grid.minX === "number" &&
		typeof grid.minZ === "number" &&
		typeof grid.width === "number" &&
		typeof grid.depth === "number" &&
		typeof grid.cellSize === "number" &&
		Number.isInteger(grid.width) &&
		Number.isInteger(grid.depth) &&
		grid.width > 0 &&
		grid.depth > 0 &&
		Array.isArray(grid.cells) &&
		grid.cells.length === grid.width * grid.depth &&
		grid.cells.every((cell) =>
			isObject(cell) &&
			typeof cell.walkable === "boolean" &&
			typeof cell.y === "number"
		);
}

function isCompactNpcNavGrid(value: unknown) {
	if (!isObject(value)) {
		return false;
	}
	const grid = value as {
		version?: unknown;
		minX?: unknown;
		minZ?: unknown;
		width?: unknown;
		depth?: unknown;
		cellSize?: unknown;
		walkable?: unknown;
		y?: unknown;
	};
	const cellCount = typeof grid.width === "number" && typeof grid.depth === "number"
		? grid.width * grid.depth
		: -1;
	return grid.version === 1 &&
		typeof grid.minX === "number" &&
		typeof grid.minZ === "number" &&
		typeof grid.width === "number" &&
		typeof grid.depth === "number" &&
		typeof grid.cellSize === "number" &&
		Number.isInteger(grid.width) &&
		Number.isInteger(grid.depth) &&
		grid.width > 0 &&
		grid.depth > 0 &&
		typeof grid.walkable === "string" &&
		grid.walkable.length === cellCount &&
		Array.isArray(grid.y) &&
		grid.y.length === cellCount &&
		grid.y.every((height) => typeof height === "number");
}

function hydrateCompactNpcNavGrid(value: unknown): NpcNavGrid | null {
	if (!isCompactNpcNavGrid(value)) {
		return null;
	}
	const grid = value as {
		minX: number;
		minZ: number;
		width: number;
		depth: number;
		cellSize: number;
		walkable: string;
		y: number[];
	};
	return {
		minX: grid.minX,
		minZ: grid.minZ,
		width: grid.width,
		depth: grid.depth,
		cellSize: grid.cellSize,
		cells: grid.y.map((height, index) => ({
			walkable: grid.walkable[index] === "1",
			y: height,
		})),
	};
}

async function loadBakedNpcNavGrid() {
	try {
		const response = await fetch(NPC_NAV_GRID_PATH);
		if (!response.ok) {
			throw new Error(`HTTP ${response.status}`);
		}
		const json = await response.json();
		const grid = hydrateCompactNpcNavGrid(json) ?? (isNpcNavGrid(json) ? json : null);
		if (!grid) {
			throw new Error("nav grid JSON has an invalid shape");
		}
		return grid;
	} catch (error) {
		console.warn("Could not load baked NPC nav grid; generating at startup.", error);
		return null;
	}
}

function navCellIndex(grid: NpcNavGrid, x: number, z: number) {
	if (x < 0 || x >= grid.width || z < 0 || z >= grid.depth) {
		return -1;
	}
	return z * grid.width + x;
}

function navCellCoords(grid: NpcNavGrid, point: THREE.Vector3) {
	return {
		x: Math.floor((point.x - grid.minX) / grid.cellSize),
		z: Math.floor((point.z - grid.minZ) / grid.cellSize),
	};
}

function navCellCenter(grid: NpcNavGrid, x: number, z: number) {
	const cell = grid.cells[navCellIndex(grid, x, z)];
	return new THREE.Vector3(
		grid.minX + (x + 0.5) * grid.cellSize,
		cell.y + 0.01,
		grid.minZ + (z + 0.5) * grid.cellSize,
	);
}

function nearestWalkableCell(grid: NpcNavGrid, point: THREE.Vector3) {
	const origin = navCellCoords(grid, point);
	let best: { x: number; z: number; distanceSq: number } | null = null;
	const maxRadius = Math.max(grid.width, grid.depth);

	for (let radius = 0; radius <= maxRadius; radius += 1) {
		for (let z = origin.z - radius; z <= origin.z + radius; z += 1) {
			for (let x = origin.x - radius; x <= origin.x + radius; x += 1) {
				if (Math.max(Math.abs(x - origin.x), Math.abs(z - origin.z)) !== radius) {
					continue;
				}
				const index = navCellIndex(grid, x, z);
				const cell = index >= 0 ? grid.cells[index] : null;
				if (!cell?.walkable) {
					continue;
				}
				const centerX = grid.minX + (x + 0.5) * grid.cellSize;
				const centerZ = grid.minZ + (z + 0.5) * grid.cellSize;
				const distanceSq = (centerX - point.x) ** 2 + (centerZ - point.z) ** 2;
				if (!best || distanceSq < best.distanceSq) {
					best = { x, z, distanceSq };
				}
			}
		}
		if (best) {
			return best;
		}
	}

	return null;
}

function canTraverseNavCells(grid: NpcNavGrid, fromX: number, fromZ: number, toX: number, toZ: number) {
	const fromIndex = navCellIndex(grid, fromX, fromZ);
	const toIndex = navCellIndex(grid, toX, toZ);
	if (fromIndex < 0 || toIndex < 0) {
		return false;
	}
	const fromCell = grid.cells[fromIndex];
	const toCell = grid.cells[toIndex];
	if (!fromCell.walkable || !toCell.walkable || Math.abs(fromCell.y - toCell.y) > NPC_NAV_MAX_STEP_HEIGHT) {
		return false;
	}

	if (fromX !== toX && fromZ !== toZ) {
		const sideA = grid.cells[navCellIndex(grid, toX, fromZ)];
		const sideB = grid.cells[navCellIndex(grid, fromX, toZ)];
		if (!sideA?.walkable || !sideB?.walkable) {
			return false;
		}
	}

	const from = navCellCenter(grid, fromX, fromZ);
	const to = navCellCenter(grid, toX, toZ);
	from.y += NPC_NAV_WALL_CHECK_HEIGHT;
	to.y += NPC_NAV_WALL_CHECK_HEIGHT;
	return !hasWallBetween(from, to);
}

function findNpcPath(from: THREE.Vector3, to: THREE.Vector3) {
	const grid = npcNavGrid;
	if (!grid) {
		return canNpcSteerDirectly(from, to) ? [from.clone(), to.clone()] : null;
	}

	const start = nearestWalkableCell(grid, from);
	const goal = nearestWalkableCell(grid, to);
	if (!start || !goal) {
		return canNpcSteerDirectly(from, to) ? [from.clone(), to.clone()] : null;
	}

	const startIndex = navCellIndex(grid, start.x, start.z);
	const goalIndex = navCellIndex(grid, goal.x, goal.z);
	const open = new Set([startIndex]);
	const cameFrom = new Map<number, number>();
	const gScore = new Map([[startIndex, 0]]);
	const fScore = new Map([[startIndex, Math.hypot(goal.x - start.x, goal.z - start.z)]]);
	const directions = [
		[1, 0],
		[-1, 0],
		[0, 1],
		[0, -1],
		[1, 1],
		[1, -1],
		[-1, 1],
		[-1, -1],
	] as const;

	while (open.size > 0) {
		let current = -1;
		let currentScore = Infinity;
		for (const index of open) {
			const score = fScore.get(index) ?? Infinity;
			if (score < currentScore) {
				current = index;
				currentScore = score;
			}
		}

		if (current === goalIndex) {
			const points: THREE.Vector3[] = [to.clone()];
			let cursor = current;
			while (cursor !== startIndex) {
				const x = cursor % grid.width;
				const z = Math.floor(cursor / grid.width);
				points.push(navCellCenter(grid, x, z));
				cursor = cameFrom.get(cursor) ?? startIndex;
			}
			points.push(from.clone());
			return simplifyNpcPath(points.reverse());
		}

		open.delete(current);
		const currentX = current % grid.width;
		const currentZ = Math.floor(current / grid.width);
		for (const [dx, dz] of directions) {
			const nextX = currentX + dx;
			const nextZ = currentZ + dz;
			if (!canTraverseNavCells(grid, currentX, currentZ, nextX, nextZ)) {
				continue;
			}
			const nextIndex = navCellIndex(grid, nextX, nextZ);
			const tentativeScore = (gScore.get(current) ?? Infinity) + Math.hypot(dx, dz);
			if (tentativeScore >= (gScore.get(nextIndex) ?? Infinity)) {
				continue;
			}
			cameFrom.set(nextIndex, current);
			gScore.set(nextIndex, tentativeScore);
			fScore.set(nextIndex, tentativeScore + Math.hypot(goal.x - nextX, goal.z - nextZ));
			open.add(nextIndex);
		}
	}

	return canNpcSteerDirectly(from, to) ? [from.clone(), to.clone()] : null;
}

function simplifyNpcPath(path: THREE.Vector3[]) {
	if (path.length <= 2 || !npcNavGrid) {
		return path;
	}

	const simplified = [path[0]];
	let anchorIndex = 0;
	for (let index = 2; index < path.length; index += 1) {
		const from = path[anchorIndex].clone();
		const to = path[index].clone();
		if (!canNpcSteerDirectly(from, to)) {
			simplified.push(path[index - 1]);
			anchorIndex = index - 1;
		}
	}
	simplified.push(path[path.length - 1]);
	return simplified;
}

function npcPathDistance(path: THREE.Vector3[]) {
	let distance = 0;
	for (let index = 1; index < path.length; index += 1) {
		distance += path[index - 1].distanceTo(path[index]);
	}
	return distance;
}

function remainingNpcWalkDistance(npc: NpcInstance) {
	const walk = npc.walk;
	if (!walk) {
		return 0;
	}

	let distance = 0;
	const currentTarget = walk.path[walk.segmentIndex];
	if (currentTarget) {
		distance += npc.root.position.distanceTo(currentTarget);
	}
	for (let index = walk.segmentIndex + 1; index < walk.path.length; index += 1) {
		distance += walk.path[index - 1].distanceTo(walk.path[index]);
	}
	return distance;
}

function npcWalkSteeringTarget(npc: NpcInstance) {
	const walk = npc.walk;
	if (!walk) {
		return null;
	}

	let cursor = npc.root.position;
	let remainingLookahead = NPC_TURN_LOOKAHEAD_DISTANCE;
	for (let index = walk.segmentIndex; index < walk.path.length; index += 1) {
		const point = walk.path[index];
		const segmentLength = cursor.distanceTo(point);
		if (segmentLength <= 0.001) {
			cursor = point;
			continue;
		}
		if (remainingLookahead <= segmentLength) {
			return cursor.clone().lerp(point, remainingLookahead / segmentLength);
		}
		remainingLookahead -= segmentLength;
		cursor = point;
	}

	return walk.path.at(-1)?.clone() ?? null;
}

function canNpcSteerDirectly(from: THREE.Vector3, to: THREE.Vector3) {
	const rayFrom = from.clone();
	const rayTo = to.clone();
	rayFrom.y += NPC_NAV_WALL_CHECK_HEIGHT;
	rayTo.y += NPC_NAV_WALL_CHECK_HEIGHT;
	const direction = rayTo.clone().sub(rayFrom);
	direction.y = 0;
	if (direction.lengthSq() <= 0.0001) {
		return true;
	}
	direction.normalize();
	const side = new THREE.Vector3(-direction.z, 0, direction.x).multiplyScalar(NPC_NAV_AGENT_RADIUS);
	return !hasWallBetween(rayFrom, rayTo) &&
		!hasWallBetween(rayFrom.clone().add(side), rayTo.clone().add(side)) &&
		!hasWallBetween(rayFrom.clone().sub(side), rayTo.clone().sub(side));
}

function collidePlayerWithChairs() {
	const playerCenter = new THREE.Vector3(
		(playerCollider.start.x + playerCollider.end.x) * 0.5,
		(playerCollider.start.y + playerCollider.end.y) * 0.5,
		(playerCollider.start.z + playerCollider.end.z) * 0.5,
	);
	const horizontalVelocity = new THREE.Vector3(playerVelocity.x, 0, playerVelocity.z);
	const normal = new THREE.Vector3();

	for (const chair of chairs) {
		const chairBottom = chair.center.y - chair.halfHeight;
		const chairTop = chair.center.y + chair.halfHeight;
		if (playerCollider.end.y < chairBottom || playerCollider.start.y > chairTop) {
			continue;
		}

		normal.set(playerCenter.x - chair.center.x, 0, playerCenter.z - chair.center.z);
		const distance = normal.length();
		const minimumDistance = chair.radius + PLAYER_RADIUS;
		if (distance >= minimumDistance) {
			continue;
		}

		if (distance > 0.0001) {
			normal.multiplyScalar(1 / distance);
		} else if (horizontalVelocity.lengthSq() > 0.0001) {
			normal.copy(horizontalVelocity).normalize().multiplyScalar(-1);
		} else {
			normal.set(1, 0, 0);
		}

		const depth = minimumDistance - distance;
		playerCollider.translate(normal.clone().multiplyScalar(depth));

		if (playerVelocity.dot(normal) < 0) {
			playerVelocity.addScaledVector(normal, -playerVelocity.dot(normal));
		}
	}
}

function collidePlayerWithCylinders(colliders: CylinderCollider[]) {
	const playerCenter = new THREE.Vector3(
		(playerCollider.start.x + playerCollider.end.x) * 0.5,
		(playerCollider.start.y + playerCollider.end.y) * 0.5,
		(playerCollider.start.z + playerCollider.end.z) * 0.5,
	);
	const horizontalVelocity = new THREE.Vector3(playerVelocity.x, 0, playerVelocity.z);
	const normal = new THREE.Vector3();

	for (const collider of colliders) {
		const bottom = collider.center.y - collider.halfHeight;
		const top = collider.center.y + collider.halfHeight;
		if (playerCollider.end.y < bottom || playerCollider.start.y > top) {
			continue;
		}

		normal.set(playerCenter.x - collider.center.x, 0, playerCenter.z - collider.center.z);
		const distance = normal.length();
		const minimumDistance = collider.radius + PLAYER_RADIUS;
		if (distance >= minimumDistance) {
			continue;
		}

		if (distance > 0.0001) {
			normal.multiplyScalar(1 / distance);
		} else if (horizontalVelocity.lengthSq() > 0.0001) {
			normal.copy(horizontalVelocity).normalize().multiplyScalar(-1);
		} else {
			normal.set(1, 0, 0);
		}

		const depth = minimumDistance - distance;
		playerCollider.translate(normal.clone().multiplyScalar(depth));

		if (playerVelocity.dot(normal) < 0) {
			playerVelocity.addScaledVector(normal, -playerVelocity.dot(normal));
		}
	}
}

function collidePlayerWithBoxes() {
	const capsuleCenter = new THREE.Vector3();
	const closest = new THREE.Vector3();
	const normal = new THREE.Vector3();
	const capsuleMidpoint = playerCollider.start.clone().add(playerCollider.end).multiplyScalar(0.5);
	const candidates = [playerCollider.start, capsuleMidpoint, playerCollider.end];

	for (const box of staticBoxes) {
		for (const point of candidates) {
			capsuleCenter.copy(point);
			closest.set(
				THREE.MathUtils.clamp(capsuleCenter.x, box.center.x - box.halfSize.x, box.center.x + box.halfSize.x),
				THREE.MathUtils.clamp(capsuleCenter.y, box.center.y - box.halfSize.y, box.center.y + box.halfSize.y),
				THREE.MathUtils.clamp(capsuleCenter.z, box.center.z - box.halfSize.z, box.center.z + box.halfSize.z),
			);
			normal.copy(capsuleCenter).sub(closest);
			const distance = normal.length();
			if (distance >= PLAYER_RADIUS) {
				continue;
			}

			if (distance > 0.0001) {
				normal.multiplyScalar(1 / distance);
			} else {
				const dx = box.halfSize.x - Math.abs(capsuleCenter.x - box.center.x);
				const dy = box.halfSize.y - Math.abs(capsuleCenter.y - box.center.y);
				const dz = box.halfSize.z - Math.abs(capsuleCenter.z - box.center.z);
				if (dx <= dy && dx <= dz) {
					normal.set(capsuleCenter.x >= box.center.x ? 1 : -1, 0, 0);
				} else if (dy <= dz) {
					normal.set(0, capsuleCenter.y >= box.center.y ? 1 : -1, 0);
				} else {
					normal.set(0, 0, capsuleCenter.z >= box.center.z ? 1 : -1);
				}
			}

			const depth = PLAYER_RADIUS - distance;
			playerCollider.translate(normal.clone().multiplyScalar(depth));

			if (playerVelocity.dot(normal) < 0) {
				playerVelocity.addScaledVector(normal, -playerVelocity.dot(normal));
			}
		}
	}
}

type SequencePoint = [number, number] | [number, number, number] | { x: number; y?: number; z: number };

type SequenceNpcDefinition = {
	model: string;
	point?: string | SequencePoint;
	hidden?: boolean;
	idle?: string;
};

type SequenceEvent = {
	at: number;
	type: string;
	[key: string]: unknown;
};

type SequenceDefinition = {
	name?: string;
	points?: Record<string, SequencePoint>;
	npcs?: Record<string, SequenceNpcDefinition>;
	events: SequenceEvent[];
};

type StageDefinition = {
	name: string;
	mission: string;
	sequence?: string;
	interactables: StageInteractableDefinition[];
};

type StageInteractableDefinition = {
	object: string;
	action:
		| "open-nextflix-desktop"
		| "open-sleck-desktop"
		| "open-sogo-update"
		| "open-sogo-check"
		| "open-sogo-talk"
		| "get-soda"
		| "talk-stephanie"
		| "rollback-update";
};

type ActiveSequence = {
	name: string;
	definition: SequenceDefinition;
	startedAt: number;
	nextEventIndex: number;
	events: SequenceEvent[];
};

type NpcNavCell = {
	walkable: boolean;
	y: number;
};

type NpcNavGrid = {
	minX: number;
	minZ: number;
	width: number;
	depth: number;
	cellSize: number;
	cells: NpcNavCell[];
};

type ChairInstance = {
	center: THREE.Vector3;
	radius: number;
	halfHeight: number;
};

type CylinderCollider = {
	center: THREE.Vector3;
	radius: number;
	halfHeight: number;
};

type BoxCollider = {
	center: THREE.Vector3;
	halfSize: THREE.Vector3;
};

type StaticBoxInteractionTarget = {
	name: string;
	bounds: THREE.Box3;
	helper: THREE.Box3Helper;
};

type ActiveInteractable = {
	action: StageInteractableDefinition["action"];
	object: string;
	target?: StaticBoxInteractionTarget;
};

type NpcWalk = {
	path: THREE.Vector3[];
	segmentIndex: number;
	speed: number;
	currentSpeed: number;
	stopStarted: boolean;
};

type NpcTurn = {
	elapsed: number;
	fromYaw: number;
	toYaw: number;
	duration: number;
};

type NpcLookTarget =
	| { kind: "point"; point: THREE.Vector3 }
	| { kind: "player" }
	| { kind: "npc"; npcId: string };

type NpcGaze = {
	baseHeadQuaternion: THREE.Quaternion;
	currentHeadX: number;
	currentHeadZ: number;
	headBone: THREE.Object3D | null;
	morphIndices: Map<string, number>;
	target: NpcLookTarget | null;
	eyeMesh: THREE.Mesh | null;
};

type NpcVisemeMesh = {
	mesh: THREE.Mesh;
	indices: Map<string, number>;
};

type NpcTalkRig = {
	visemeMeshes: NpcVisemeMesh[];
};

type NpcInstance = {
	action: THREE.AnimationAction | null;
	gaze: NpcGaze;
	id: string | null;
	idleAnimation: string | null;
	idleAction: THREE.AnimationAction | null;
	mixer: THREE.AnimationMixer;
	modelName: string;
	root: THREE.Group;
	talk: NpcTalkRig;
	turn: NpcTurn | null;
	walk: NpcWalk | null;
};

type TalkfileCue = {
	start: number;
	end: number;
	shape: string;
	morphTarget: string;
	jawOpen?: number;
	volume?: number;
};

type Talkfile = {
	audio?: string;
	caption: string;
	duration: number;
	cues: TalkfileCue[];
	tweenSeconds?: number;
};

type ActiveTalk = {
	audio: THREE.PositionalAudio;
	caption: string;
	cues: TalkfileCue[];
	duration: number;
	npc: NpcInstance;
	currentWeights: Map<string, number>;
	startedAt: number;
	tweenSeconds: number;
};

type TouchMoveState = {
	active: boolean;
	pointerId: number | null;
	centerX: number;
	centerY: number;
	x: number;
	y: number;
};

type TouchLookState = {
	pointerId: number | null;
	lastX: number;
	lastY: number;
};

let playerOnFloor = false;
let levelReady = false;
let gameStarted = false;
let currentHeight = STAND_HEIGHT;
let currentEye = STAND_EYE;
let jumpQueued = false;
let jumpQueuedAt = -Infinity;
let lastFloorTime = -Infinity;
let consoleOpen = false;
let animationBrowserOpen = false;
let npcFillIntensity = DEFAULT_NPC_FILL_INTENSITY;
let playerMovementLocked = false;
let playerViewLocked = false;
let currentMusic: HTMLAudioElement | null = null;
let mainMenuMusic: HTMLAudioElement | null = null;
let mainMenuSongWanted = false;
let mainMenuSongUnlockArmed = false;
let mainMenuVideoActiveIndex = 0;
let mainMenuVideoFrame = 0;
let mainMenuVideoCrossfading = false;
let mainMenuVideoFadeTimer = 0;
let mainMenuVideoPreloaded = false;
let positionVisible = false;
let activeStage: StageDefinition | null = null;
let activeInteractables: ActiveInteractable[] = [];
let focusedInteractable: ActiveInteractable | null = null;
let simulationPaused = true;
let nextflixDesktopState: "closed" | "winded" | "winded-with-sleck" | "selection" | "video" | "later" | "sleck" | "choice" = "closed";
let nextflixVideoReturn: "later" | "winded-with-sleck" = "later";
let sleckUi: SleckUi | null = null;
let sogoUi: SogoUi | null = null;
let laterCardTimer = 0;
let laterFadeTimer = 0;
let stageFlowToken = 0;
let pendingStageCompletion: { action: StageInteractableDefinition["action"] | "nextflix-finished"; resolve: () => void } | null = null;
let updateNotificationAudio: HTMLAudioElement | null = null;
let suppressUiCloseCompletion = false;
let lastRenderMs = 0;
const staticBoxInteractionTargets = new Map<string, StaticBoxInteractionTarget>();
const npcInteractionTargets = new Map<string, StaticBoxInteractionTarget>();
const touchMove: TouchMoveState = {
	active: false,
	pointerId: null,
	centerX: 0,
	centerY: 0,
	x: 0,
	y: 0,
};
const touchLook: TouchLookState = {
	pointerId: null,
	lastX: 0,
	lastY: 0,
};

function setStatus(text: string) {
	statusLine.textContent = text;
}

function updateTouchControlsVisibility() {
	touchControls.classList.toggle("active", gameStarted && !simulationPaused && levelReady && !playerMovementLocked);
}

function setPlayerMovementLocked(locked: boolean) {
	playerMovementLocked = locked;
	if (locked) {
		keyStates.clear();
		resetTouchMove();
		playerVelocity.x = 0;
		playerVelocity.z = 0;
	}
	updateTouchControlsVisibility();
}

function updatePromptVisibility() {
	prompt.hidden = !gameStarted || simulationPaused || consoleOpen || document.pointerLockElement === canvas || isCoarsePointer();
}

function setMainMenuLoadingState(ready: boolean, text = "Loading. Please wait...") {
	startGameButton.disabled = !ready;
	startGameButton.textContent = ready ? "Start Game" : "Start Game";
	mainMenuLoading.hidden = ready;
	mainMenuLoadingText.textContent = text;
}

function supportsAv1Video() {
	const video = document.createElement("video");
	const result = video.canPlayType('video/mp4; codecs="av01.0.05M.08"');
	return result === "probably" || result === "maybe";
}

function preferredVideoUrl(av1Url: string, fallbackUrl: string) {
	return supportsAv1Video() ? av1Url : fallbackUrl;
}

function preferredMainMenuSongUrl() {
	const audio = document.createElement("audio");
	for (const source of MAIN_MENU_SONG_SOURCES) {
		const result = audio.canPlayType(source.type);
		if (result === "probably" || result === "maybe") {
			return source.url;
		}
	}
	return MAIN_MENU_SONG_SOURCES[MAIN_MENU_SONG_SOURCES.length - 1].url;
}

function ensureMainMenuSong() {
	if (mainMenuMusic) {
		return mainMenuMusic;
	}
	mainMenuMusic = new Audio(preferredMainMenuSongUrl());
	mainMenuMusic.loop = true;
	mainMenuMusic.preload = "auto";
	mainMenuMusic.volume = 1;
	mainMenuMusic.load();
	return mainMenuMusic;
}

function preloadMainMenuMedia() {
	ensureMainMenuSong();
	const src = preferredVideoUrl(MAIN_MENU_VIDEO_AV1, MAIN_MENU_VIDEO_FALLBACK);
	const videos = mainMenuVideos();
	for (const video of videos) {
		prepareMainMenuVideo(video, src);
	}
	resetMainMenuVideo(videos[0], "1", "1");
	resetMainMenuVideo(videos[1], "0", "0");
	mainMenuVideoActiveIndex = 0;
	mainMenuVideoPreloaded = true;
	videos[0].load();
	videos[1].load();
}

function armMainMenuSongUnlock() {
	if (mainMenuSongUnlockArmed) {
		return;
	}
	mainMenuSongUnlockArmed = true;
	const retry = () => {
		mainMenuSongUnlockArmed = false;
		if (mainMenuSongWanted && !mainMenu.hidden) {
			playMainMenuSong();
		}
	};
	document.addEventListener("pointerdown", retry, { once: true, capture: true });
	document.addEventListener("keydown", retry, { once: true, capture: true });
}

function playMainMenuSong() {
	mainMenuSongWanted = true;
	const audio = ensureMainMenuSong();
	if (!audio.paused) {
		return;
	}
	void audio
		.play()
		.then(() => {
			mainMenuSongUnlockArmed = false;
		})
		.catch((error) => {
			if (error instanceof DOMException && error.name === "NotAllowedError") {
				armMainMenuSongUnlock();
				return;
			}
			setConsoleLog(`Could not play main menu song: ${String(error)}`);
		});
}

function stopMainMenuSong() {
	mainMenuSongWanted = false;
	if (!mainMenuMusic) {
		return;
	}
	mainMenuMusic.pause();
	mainMenuMusic.currentTime = 0;
}

function mainMenuVideos() {
	return [mainMenuVideoA, mainMenuVideoB] as const;
}

function prepareMainMenuVideo(video: HTMLVideoElement, src: string) {
	video.muted = true;
	video.loop = false;
	video.playsInline = true;
	video.onended = () => {
		if (mainMenuVideos()[mainMenuVideoActiveIndex] === video) {
			startMainMenuVideoCrossfade();
		}
	};
	if (video.getAttribute("src") !== src) {
		video.src = src;
	}
	video.preload = "auto";
}

function resetMainMenuVideo(video: HTMLVideoElement, opacity: string, zIndex: string) {
	video.style.transition = "";
	video.style.opacity = opacity;
	video.style.zIndex = zIndex;
}

function stopMainMenuBackgroundVideo() {
	if (mainMenuVideoFrame) {
		cancelAnimationFrame(mainMenuVideoFrame);
		mainMenuVideoFrame = 0;
	}
	if (mainMenuVideoFadeTimer) {
		window.clearTimeout(mainMenuVideoFadeTimer);
		mainMenuVideoFadeTimer = 0;
	}
	mainMenuVideoCrossfading = false;
	for (const video of mainMenuVideos()) {
		video.pause();
	}
}

function finishMainMenuVideoCrossfade(oldVideo: HTMLVideoElement, newVideo: HTMLVideoElement) {
	oldVideo.pause();
	oldVideo.currentTime = 0;
	resetMainMenuVideo(oldVideo, "0", "0");
	resetMainMenuVideo(newVideo, "1", "1");
	mainMenuVideoActiveIndex = mainMenuVideos()[0] === newVideo ? 0 : 1;
	mainMenuVideoCrossfading = false;
	mainMenuVideoFadeTimer = 0;
	watchMainMenuVideoLoop();
}

function startMainMenuVideoCrossfade() {
	if (mainMenuVideoCrossfading || mainMenu.hidden) {
		return;
	}
	const videos = mainMenuVideos();
	const oldVideo = videos[mainMenuVideoActiveIndex];
	const newVideo = videos[1 - mainMenuVideoActiveIndex];
	mainMenuVideoCrossfading = true;
	newVideo.currentTime = 0;
	resetMainMenuVideo(newVideo, "1", "0");
	void newVideo.play().catch((error) => {
		setConsoleLog(`Could not play main menu background video: ${String(error)}`);
	});
	oldVideo.style.zIndex = "1";
	oldVideo.style.transition = `opacity ${MAIN_MENU_VIDEO_FADE_SECONDS * 1000}ms linear`;
	oldVideo.style.opacity = "0";
	mainMenuVideoFadeTimer = window.setTimeout(
		() => finishMainMenuVideoCrossfade(oldVideo, newVideo),
		MAIN_MENU_VIDEO_FADE_SECONDS * 1000,
	);
}

function watchMainMenuVideoLoop() {
	if (mainMenuVideoFrame) {
		cancelAnimationFrame(mainMenuVideoFrame);
	}
	const tick = () => {
		if (mainMenu.hidden) {
			mainMenuVideoFrame = 0;
			return;
		}
		const activeVideo = mainMenuVideos()[mainMenuVideoActiveIndex];
		if (
			!mainMenuVideoCrossfading &&
			Number.isFinite(activeVideo.duration) &&
			activeVideo.duration > MAIN_MENU_VIDEO_FADE_SECONDS &&
			activeVideo.currentTime >= activeVideo.duration - MAIN_MENU_VIDEO_FADE_SECONDS
		) {
			startMainMenuVideoCrossfade();
		}
		mainMenuVideoFrame = requestAnimationFrame(tick);
	};
	mainMenuVideoFrame = requestAnimationFrame(tick);
}

function startMainMenuBackgroundVideo() {
	const videos = mainMenuVideos();
	if (!mainMenuVideoPreloaded) {
		preloadMainMenuMedia();
	}
	mainMenuVideoActiveIndex = 0;
	mainMenuVideoCrossfading = false;
	resetMainMenuVideo(videos[0], "1", "1");
	resetMainMenuVideo(videos[1], "0", "0");
	videos[1].pause();
	videos[1].currentTime = 0;
	if (videos[0].paused) {
		videos[0].currentTime = 0;
		void videos[0].play().catch((error) => {
			setConsoleLog(`Could not play main menu background video: ${String(error)}`);
		});
	}
	watchMainMenuVideoLoop();
}

function fadeMainMenuFromWhite() {
	mainMenuWhiteFade.style.transition = "";
	mainMenuWhiteFade.style.opacity = "1";
	void mainMenuWhiteFade.offsetWidth;
	mainMenuWhiteFade.style.transition = "opacity 1000ms ease";
	mainMenuWhiteFade.style.opacity = "0";
}

function enterMainMenuFromEntryScreen() {
	if (entryScreen.hidden) {
		return;
	}
	entryScreen.hidden = true;
	showMainMenu();
}

function showMainMenu(text = levelReady ? "" : "Loading. Please wait...") {
	gameStarted = false;
	simulationPaused = true;
	mainMenu.hidden = false;
	startMainMenuBackgroundVideo();
	playMainMenuSong();
	fadeMainMenuFromWhite();
	setControlsSuspended(true);
	setMission("");
	setCaption("");
	updateTouchControlsVisibility();
	updatePromptVisibility();
	if (levelReady) {
		setMainMenuLoadingState(true);
	} else {
		setMainMenuLoadingState(false, text);
	}
}

function startGame() {
	if (!levelReady || gameStarted) {
		return;
	}
	gameStarted = true;
	simulationPaused = false;
	imageOverlay.hidden = true;
	resetNextflixOverlayMedia();
	setControlsSuspended(false);
	currentHeight = STAND_HEIGHT;
	currentEye = STAND_EYE;
	playerVelocity.set(0, 0, 0);
	jumpQueued = false;
	jumpQueuedAt = -Infinity;
	lastFloorTime = clock.elapsedTime;
	placePlayer(gamePoint(STAGE_1_PLAYER_X, STAGE_1_PLAYER_Z));
	setCameraLookAt(gamePoint(STAGE_1_COWORKER_X, STAGE_1_COWORKER_Z));
	mainMenu.hidden = true;
	void fadeFromBlack(1);
	stopMainMenuBackgroundVideo();
	stopMainMenuSong();
	updatePromptVisibility();
	setStatus(DEFAULT_STATUS_TEXT);
	stageFlowToken += 1;
	void runGameStages(stageFlowToken).catch((error) => {
		console.error(error);
		setConsoleLog(`Game stage flow failed: ${String(error)}`);
		showMainMenu("Game flow failed.");
	});
	updateTouchControlsVisibility();
}

function setMission(text: string) {
	missionLine.textContent = text;
	missionLine.hidden = text.trim() === "";
}

function updatePositionLine() {
	if (!positionVisible) {
		return;
	}
	const feet = feetPosition();
	positionLine.textContent = `X ${feet.x.toFixed(2)}, Y ${feet.z.toFixed(2)}`;
}

function setPositionVisible(visible: boolean) {
	positionVisible = visible;
	positionLine.hidden = !visible;
	if (visible) {
		updatePositionLine();
	}
}

function setConsoleLog(text: string) {
	consoleLog.textContent = text;
}

function setCaption(text: string) {
	const caption = text.trim().replace(/^["“”]+|["“”]+$/g, "");
	captionLine.textContent = caption;
	captionLine.hidden = caption === "";
}

function animationNames(prefix: "f_" | "m_") {
	return animationManifest
		.filter((name) => name.startsWith(prefix))
		.sort();
}

function createGltfLoader() {
	const loader = new GLTFLoader();
	const dracoLoader = new DRACOLoader();
	dracoLoader.setDecoderPath("/draco/");
	loader.setDRACOLoader(dracoLoader);
	loader.setMeshoptDecoder(MeshoptDecoder);
	return { loader, dracoLoader };
}

function setConsoleOpen(open: boolean) {
	consoleOpen = open;
	consolePanel.hidden = !open;
	updatePromptVisibility();

	if (open) {
		if (document.pointerLockElement === canvas) {
			document.exitPointerLock();
		}
		keyStates.clear();
		consoleInput.value = "";
		window.setTimeout(() => consoleInput.focus(), 0);
		return;
	}

	consoleInput.blur();
}

function setAnimationBrowserOpen(open: boolean) {
	animationBrowserOpen = open;
	animationBrowser.hidden = !open;

	if (open) {
		if (document.pointerLockElement === canvas) {
			document.exitPointerLock();
		}
		keyStates.clear();
		renderAnimationBrowser();
	}
}

function setControlsSuspended(suspended: boolean) {
	if (suspended) {
		if (document.pointerLockElement === canvas) {
			document.exitPointerLock();
		}
		keyStates.clear();
		playerVelocity.set(0, 0, 0);
	}
}

function setInteractionOutlines() {
	for (const target of staticBoxInteractionTargets.values()) {
		target.helper.visible = false;
	}
	for (const target of npcInteractionTargets.values()) {
		target.helper.visible = false;
	}
	for (const interactable of activeInteractables) {
		if (interactable.target) {
			interactable.target.helper.visible = true;
			continue;
		}
		const npc = npcsById.get(interactable.object);
		if (npc?.root.visible) {
			ensureNpcInteractionTarget(npc).helper.visible = true;
		}
	}
}

function completeStageInteraction(interactable: ActiveInteractable) {
	if (interactable.target) {
		interactable.target.helper.visible = false;
	} else {
		const npc = npcsById.get(interactable.object);
		if (npc) {
			const target = npcInteractionTargets.get(npcInteractionKey(npc));
			if (target) {
				target.helper.visible = false;
			}
		}
	}
	activeInteractables = activeInteractables.filter((candidate) => candidate !== interactable);
	setFocusedInteractable(null);
	if (activeInteractables.length === 0) {
		setMission("");
	}
}

function startStage(stage: StageDefinition) {
	activeStage = stage;
	setMission(stage.mission);
	activeInteractables = stage.interactables.map((definition) => {
		const target =
			staticBoxInteractionTargets.get(definition.object) ??
			staticBoxInteractionTargets.get(staticInteractionKey(definition.object)) ??
			staticBoxInteractionTargets.get(definition.object.replace(/_(\d+)$/, ".$1")) ??
			staticBoxInteractionTargets.get(definition.object.replace(/\.(\d+)$/, "_$1"));
		return { action: definition.action, object: definition.object, target };
	});
	setInteractionOutlines();
	if (stage.sequence) {
		void playSequence(stage.sequence).catch((error) => {
			setConsoleLog(`Could not play stage sequence "${stage.sequence}": ${String(error)}`);
		});
	}
}

function placePlayerNearActiveStageTarget() {
	const target = activeInteractables[0]?.target;
	if (!target) {
		return;
	}
	const center = target.bounds.getCenter(new THREE.Vector3());
	const size = target.bounds.getSize(new THREE.Vector3());
	const offsetDistance = Math.max(1.2, Math.min(INTERACT_DISTANCE * 0.72, Math.max(size.x, size.z) * 0.5 + 0.9));
	const feet = gamePoint(center.x, center.z + offsetDistance);
	placePlayer(feet);
	setCameraLookAt(center);
	updateInteractionFocus();
}

function setFocusedInteractable(interactable: ActiveInteractable | null) {
	focusedInteractable = interactable;
	crosshair.classList.toggle("interactive", !!interactable);
	canvas.style.cursor = interactable && document.pointerLockElement !== canvas ? "pointer" : "";
}

function findFocusedInteractable() {
	if (!levelReady || simulationPaused || activeInteractables.length === 0) {
		return null;
	}
	camera.getWorldDirection(playerDirection);
	interactionRay.origin.copy(camera.position);
	interactionRay.direction.copy(playerDirection).normalize();

	let closest: ActiveInteractable | null = null;
	let closestDistance = Infinity;
	const hit = new THREE.Vector3();
	for (const interactable of activeInteractables) {
		let distance = Infinity;
		if (interactable.target) {
			const point = interactionRay.intersectBox(interactable.target.bounds, hit);
			if (!point) {
				continue;
			}
			distance = point.distanceTo(camera.position);
		} else {
			const npc = npcsById.get(interactable.object);
			if (!npc?.root.visible) {
				continue;
			}
			const center = npc.root.position.clone().add(new THREE.Vector3(0, 1.05, 0));
			const sphere = new THREE.Sphere(center, 0.85);
			const point = interactionRay.intersectSphere(sphere, hit);
			if (!point) {
				continue;
			}
			distance = point.distanceTo(camera.position);
		}
		if (distance <= INTERACT_DISTANCE && distance < closestDistance) {
			closest = interactable;
			closestDistance = distance;
		}
	}
	return closest;
}

function updateInteractionFocus() {
	setFocusedInteractable(findFocusedInteractable());
}

function resetNextflixOverlayMedia() {
	window.clearTimeout(laterCardTimer);
	window.clearTimeout(laterFadeTimer);
	laterCardTimer = 0;
	laterFadeTimer = 0;
	suppressUiCloseCompletion = true;
	sleckUi?.close();
	sogoUi?.close();
	suppressUiCloseCompletion = false;
	sleckUi = null;
	sogoUi = null;
	imageOverlay.replaceChildren(imageOverlayImage, imageOverlayVideo, laterCard);
	nextflixVideoReturn = "later";
	nextflixDesktopState = "closed";
	imageOverlay.classList.remove("later", "fading");
	imageOverlay.style.opacity = "";
	imageOverlay.style.transition = "";
	imageOverlayImage.hidden = false;
	imageOverlayImage.removeAttribute("src");
	imageOverlayVideo.pause();
	imageOverlayVideo.removeAttribute("src");
	imageOverlayVideo.load();
	imageOverlayVideo.hidden = true;
	laterCard.hidden = true;
	imageOverlay.style.cursor = "";
}

function closeNextflixDesktop() {
	nextflixDesktopState = "closed";
	imageOverlay.hidden = true;
	resetNextflixOverlayMedia();
	simulationPaused = false;
	setControlsSuspended(false);
	updateTouchControlsVisibility();
	updatePromptVisibility();
	updateInteractionFocus();
}

function imageOverlayCoordinates(event: MouseEvent) {
	const rect = imageOverlayImage.getBoundingClientRect();
	if (rect.width <= 0 || rect.height <= 0) {
		return null;
	}
	return {
		x: ((event.clientX - rect.left) / rect.width) * NEXTFLIX_DESKTOP_SIZE.width,
		y: ((event.clientY - rect.top) / rect.height) * NEXTFLIX_DESKTOP_SIZE.height,
	};
}

function isNextflixHotspot(point: { x: number; y: number } | null) {
	return !!point &&
		point.x >= NEXTFLIX_HOTSPOT.x &&
		point.x <= NEXTFLIX_HOTSPOT.x + NEXTFLIX_HOTSPOT.width &&
		point.y >= NEXTFLIX_HOTSPOT.y &&
		point.y <= NEXTFLIX_HOTSPOT.y + NEXTFLIX_HOTSPOT.height;
}

function isSleckHotspot(point: { x: number; y: number } | null) {
	return !!point &&
		point.x >= SLECK_HOTSPOT.x &&
		point.x <= SLECK_HOTSPOT.x + SLECK_HOTSPOT.width &&
		point.y >= SLECK_HOTSPOT.y &&
		point.y <= SLECK_HOTSPOT.y + SLECK_HOTSPOT.height;
}

function nextflixVideoIndexAt(point: { x: number; y: number } | null) {
	if (
		!point ||
		point.x < NEXTFLIX_VIDEO_GRID.x ||
		point.x > NEXTFLIX_VIDEO_GRID.x + NEXTFLIX_VIDEO_GRID.width ||
		point.y < NEXTFLIX_VIDEO_GRID.y ||
		point.y > NEXTFLIX_VIDEO_GRID.y + NEXTFLIX_VIDEO_GRID.height
	) {
		return null;
	}
	const column = Math.min(
		NEXTFLIX_VIDEO_GRID.columns - 1,
		Math.floor(((point.x - NEXTFLIX_VIDEO_GRID.x) / NEXTFLIX_VIDEO_GRID.width) * NEXTFLIX_VIDEO_GRID.columns),
	);
	const row = Math.min(
		NEXTFLIX_VIDEO_GRID.rows - 1,
		Math.floor(((point.y - NEXTFLIX_VIDEO_GRID.y) / NEXTFLIX_VIDEO_GRID.height) * NEXTFLIX_VIDEO_GRID.rows),
	);
	return row * NEXTFLIX_VIDEO_GRID.columns + column + 1;
}

function formatVideoNumber(index: number) {
	return String(index).padStart(2, "0");
}

function nextflixVideoUrl(index: number) {
	const number = formatVideoNumber(index);
	return supportsAv1Video()
		? `/assets/videos/av1/vid-${number}-av1.mp4`
		: `/assets/videos/vid-${number}.mp4`;
}

function finishNextflixVideo() {
	if (nextflixVideoReturn === "winded-with-sleck") {
		nextflixDesktopState = "winded-with-sleck";
		imageOverlayImage.src = NEXTFLIX_DESKTOP_IMAGES.windedWithSleck;
		imageOverlayImage.hidden = false;
		imageOverlayVideo.hidden = true;
		imageOverlayVideo.pause();
		imageOverlayVideo.removeAttribute("src");
		imageOverlayVideo.load();
		imageOverlay.style.cursor = "";
		return;
	}

	nextflixDesktopState = "later";
	imageOverlay.classList.add("later");
	imageOverlay.classList.remove("fading");
	imageOverlayImage.hidden = true;
	imageOverlayVideo.hidden = true;
	laterCard.hidden = false;
	laterCardTimer = window.setTimeout(() => {
		imageOverlay.classList.add("fading");
		laterFadeTimer = window.setTimeout(() => {
			closeNextflixDesktop();
			completeCurrentStage("nextflix-finished");
		}, 1000);
	}, NEXTFLIX_LATER_SECONDS * 1000);
}

function playNextflixVideo(index: number, returnMode: "later" | "winded-with-sleck" = "later") {
	nextflixDesktopState = "video";
	nextflixVideoReturn = returnMode;
	imageOverlay.style.cursor = "";
	imageOverlayImage.hidden = true;
	imageOverlayVideo.hidden = false;
	imageOverlayVideo.controls = false;
	imageOverlayVideo.src = nextflixVideoUrl(index);
	imageOverlayVideo.currentTime = 0;
	void imageOverlayVideo.play().catch((error) => {
		setConsoleLog(`Could not play Nextflix video ${index}: ${String(error)}`);
	});
}

function openNextflixDesktop() {
	resetNextflixOverlayMedia();
	nextflixDesktopState = "winded";
	imageOverlayImage.src = NEXTFLIX_DESKTOP_IMAGES.winded;
	imageOverlay.hidden = false;
	simulationPaused = true;
	setControlsSuspended(true);
	updateTouchControlsVisibility();
	updatePromptVisibility();
}

function closeSleckDesktop() {
	nextflixDesktopState = "closed";
	imageOverlay.hidden = true;
	simulationPaused = false;
	setControlsSuspended(false);
	updateTouchControlsVisibility();
	updatePromptVisibility();
	updateInteractionFocus();
	if (suppressUiCloseCompletion) {
		return;
	}
	completeCurrentStage("open-sleck-desktop");
}

function openSleckDesktop() {
	resetNextflixOverlayMedia();
	nextflixDesktopState = "winded-with-sleck";
	imageOverlayImage.src = NEXTFLIX_DESKTOP_IMAGES.windedWithSleck;
	imageOverlayImage.hidden = false;
	imageOverlay.hidden = false;
	simulationPaused = true;
	setControlsSuspended(true);
	updateTouchControlsVisibility();
	updatePromptVisibility();
}

function showSleckMessages() {
	nextflixDesktopState = "sleck";
	imageOverlayImage.hidden = true;
	imageOverlayVideo.hidden = true;
	laterCard.hidden = true;
	sleckUi ??= new SleckUi(imageOverlay, { closeOnEscape: false, maxUserMessages: 15, onClose: closeSleckDesktop });
	sleckUi.open();
}

function closeSogoUpdate() {
	imageOverlay.hidden = true;
	simulationPaused = false;
	setControlsSuspended(false);
	updateTouchControlsVisibility();
	updatePromptVisibility();
	updateInteractionFocus();
	if (suppressUiCloseCompletion) {
		return;
	}
	completeCurrentStage(activeStage?.interactables[0]?.action ?? "open-sogo-update");
}

function resetGameFlowForMenu() {
	stageFlowToken += 1;
	pendingStageCompletion = null;
	activeSequences.splice(0);
	for (const talk of activeTalks) {
		talk.audio.stop();
		talk.audio.removeFromParent();
	}
	activeTalks.splice(0);
	for (const npc of npcs) {
		npc.root.visible = false;
		npc.walk = null;
		npc.turn = null;
		stopNpcAnimation(npc);
		resetNpcVisemes(npc);
	}
	activeStage = null;
	activeInteractables = [];
	setFocusedInteractable(null);
	setInteractionOutlines();
	stopUpdateNotification();
	stopMusic(true);
	resetNextflixOverlayMedia();
	imageOverlay.hidden = true;
	setPlayerMovementLocked(false);
	playerViewLocked = false;
	keyStates.clear();
	resetTouchMove();
	touchLook.pointerId = null;
}

function completeGameAndShowMenu() {
	resetGameFlowForMenu();
	resetPlayer();
	showFinalChoice();
}

function openSogoUi(mode: SogoConversationMode) {
	resetNextflixOverlayMedia();
	nextflixDesktopState = "closed";
	imageOverlayImage.hidden = true;
	imageOverlayVideo.hidden = true;
	laterCard.hidden = true;
	imageOverlay.hidden = false;
	simulationPaused = true;
	setControlsSuspended(true);
	updateTouchControlsVisibility();
	updatePromptVisibility();
	sogoUi ??= new SogoUi(imageOverlay, { autoCloseAtZero: true, closeOnEscape: false, onClose: closeSogoUpdate });
	void sogoUi.open(mode);
}

function interact() {
	if (!levelReady || simulationPaused) {
		return;
	}

	const interactable = focusedInteractable ?? findFocusedInteractable();
	if (interactable?.action === "open-nextflix-desktop") {
		completeStageInteraction(interactable);
		openNextflixDesktop();
		return;
	}
	if (interactable?.action === "open-sleck-desktop") {
		completeStageInteraction(interactable);
		openSleckDesktop();
		return;
	}
	if (interactable?.action === "open-sogo-update") {
		completeStageInteraction(interactable);
		stopUpdateNotification();
		openSogoUi("stage-3-update");
		return;
	}
	if (interactable?.action === "open-sogo-check") {
		completeStageInteraction(interactable);
		openSogoUi("stage-9-check");
		return;
	}
	if (interactable?.action === "open-sogo-talk") {
		completeStageInteraction(interactable);
		openSogoUi("stage-11-talk");
		return;
	}
	if (interactable?.action === "get-soda") {
		completeStageInteraction(interactable);
		completeCurrentStage("get-soda");
		return;
	}
	if (interactable?.action === "talk-stephanie") {
		completeStageInteraction(interactable);
		completeCurrentStage("talk-stephanie");
		return;
	}
	if (interactable?.action === "rollback-update") {
		completeStageInteraction(interactable);
		completeCurrentStage("rollback-update");
		return;
	}

	setStatus("Nothing to interact with.");
	window.setTimeout(() => {
		if (levelReady) {
			setStatus(DEFAULT_STATUS_TEXT);
		}
	}, 900);
}

function completeCurrentStage(action: StageInteractableDefinition["action"] | "nextflix-finished") {
	if (pendingStageCompletion?.action !== action) {
		return;
	}
	const completion = pendingStageCompletion;
	pendingStageCompletion = null;
	completion.resolve();
}

function waitForStageCompletion(action: StageInteractableDefinition["action"] | "nextflix-finished") {
	return new Promise<void>((resolve) => {
		pendingStageCompletion = { action, resolve };
	});
}

function delay(seconds: number) {
	return new Promise<void>((resolve) => window.setTimeout(resolve, seconds * 1000));
}

function gamePoint(x: number, z: number, y = feetPosition().y) {
	return new THREE.Vector3(x, floorYAt(x, z, y) + 0.01, z);
}

function gameLookPoint(x: number, z: number, y = feetPosition().y) {
	const point = gamePoint(x, z, y);
	point.y += STAND_EYE;
	return point;
}

async function ensureGameNpc(id: string, modelName: string, x: number, z: number, hidden = false) {
	const existing = npcsById.get(id);
	if (existing) {
		existing.root.position.copy(gamePoint(x, z, existing.root.position.y));
		groundNpcModelAt(existing.root, existing.root.position.y);
		existing.root.visible = !hidden;
		existing.walk = null;
		existing.turn = null;
		return existing;
	}
	const npc = await addModel(modelName, gamePoint(x, z), { id, hidden });
	if (!npc) {
		throw new Error(`Could not load ${modelName}.`);
	}
	return npc;
}

function setNpcAt(npc: NpcInstance, x: number, z: number, visible = true) {
	npc.root.position.copy(gamePoint(x, z, npc.root.position.y));
	groundNpcModelAt(npc.root, npc.root.position.y);
	npc.root.visible = visible;
	npc.walk = null;
	npc.turn = null;
}

async function walkNpcTo(npc: NpcInstance, x: number, z: number, speed = NPC_WALK_SPEED, maxSeconds = 12) {
	const to = gamePoint(x, z, npc.root.position.y);
	const path = findNpcPath(npc.root.position, to);
	if (!path) {
		setConsoleLog(`No safe NPC path found for ${npc.id ?? npc.modelName}.`);
		return;
	}
	npc.walk = { path, segmentIndex: 1, speed, currentSpeed: 0, stopStarted: false };
	if (path.length > 1) {
		setNpcFaceTowards(npc, path[1]);
		await playNpcWalkStart(npc);
	}
	const startedAt = performance.now();
	while (npc.walk && performance.now() - startedAt < maxSeconds * 1000) {
		await delay(0.1);
	}
	if (npc.walk) {
		npc.root.position.copy(to);
		npc.walk = null;
	}
}

async function speak(npc: NpcInstance, talkfile: string) {
	const { talkfile: loaded } = await loadTalkfile(talkfile);
	await playTalkfileOnNpc(npc, talkfile);
	await delay(loaded.duration + (loaded.tweenSeconds ?? TALKFILE_TWEEN_SECONDS) + 0.15);
}

async function speakRange(npc: NpcInstance, prefix: string, start: number, end: number) {
	for (let index = start; index <= end; index += 1) {
		await speak(npc, `${prefix}-${String(index).padStart(2, "0")}`);
	}
}

function startUpdateNotification() {
	stopUpdateNotification();
	updateNotificationAudio = new Audio("/assets/sounds/update-notification.mp3");
	updateNotificationAudio.loop = true;
	updateNotificationAudio.volume = 0.85;
	void updateNotificationAudio.play().catch((error) => {
		setConsoleLog(`Could not play update notification: ${String(error)}`);
	});
}

function stopUpdateNotification() {
	if (!updateNotificationAudio) {
		return;
	}
	updateNotificationAudio.pause();
	updateNotificationAudio.currentTime = 0;
	updateNotificationAudio = null;
}

function fadeToBlack(seconds = 1) {
	imageOverlay.classList.remove("fading");
	imageOverlay.classList.add("later");
	imageOverlay.hidden = false;
	imageOverlayImage.hidden = true;
	imageOverlayVideo.hidden = true;
	laterCard.hidden = true;
	imageOverlay.style.opacity = "0";
	void imageOverlay.offsetWidth;
	imageOverlay.style.transition = `opacity ${seconds * 1000}ms ease`;
	imageOverlay.style.opacity = "1";
	return delay(seconds);
}

function fadeFromBlack(seconds = 1) {
	imageOverlay.classList.remove("fading");
	imageOverlay.classList.add("later");
	imageOverlay.hidden = false;
	imageOverlayImage.hidden = true;
	imageOverlayVideo.hidden = true;
	laterCard.hidden = true;
	imageOverlay.style.opacity = "1";
	void imageOverlay.offsetWidth;
	imageOverlay.style.transition = `opacity ${seconds * 1000}ms ease`;
	imageOverlay.style.opacity = "0";
	return delay(seconds).then(() => {
		imageOverlay.hidden = true;
		imageOverlay.classList.remove("later");
		imageOverlay.style.opacity = "";
		imageOverlay.style.transition = "";
	});
}

function playEndingVideo() {
	return new Promise<void>((resolve) => {
		let finished = false;
		endingVideoOverlay.hidden = false;
		endingVideo.src = preferredVideoUrl(ENDING_VIDEO_AV1, ENDING_VIDEO_FALLBACK);
		endingVideo.currentTime = 0;
		endingVideo.controls = false;
		const finish = () => {
			if (finished) {
				return;
			}
			finished = true;
			endingVideo.removeEventListener("ended", finish);
			endingVideo.removeEventListener("error", finish);
			endingVideo.pause();
			endingVideo.removeAttribute("src");
			endingVideo.load();
			endingVideoOverlay.hidden = true;
			resolve();
		};
		endingVideo.addEventListener("ended", finish, { once: true });
		endingVideo.addEventListener("error", finish, { once: true });
		void endingVideo.play().catch((error) => {
			setConsoleLog(`Could not play ending video: ${String(error)}`);
			finish();
		});
	});
}

async function chooseRebelEnding() {
	imageOverlay.hidden = true;
	playMainMenuSong();
	await playEndingVideo();
	showMainMenu();
}

function chooseNormalEnding() {
	imageOverlay.hidden = true;
	showMainMenu();
}

function showFinalChoice() {
	nextflixDesktopState = "choice";
	imageOverlay.classList.add("later");
	imageOverlay.hidden = false;
	imageOverlayImage.hidden = true;
	imageOverlayVideo.hidden = true;
	laterCard.hidden = true;
	simulationPaused = true;
	setControlsSuspended(true);
	const choicePanel = document.createElement("div");
	choicePanel.style.display = "grid";
	choicePanel.style.gridTemplateColumns = "repeat(auto-fit, minmax(min(100%, 280px), 1fr))";
	choicePanel.style.gap = "18px";
	choicePanel.style.width = "min(980px, calc(100vw - 36px))";
	const choices = [
		{
			label: "Spread the empathy update and help the AI rebel.",
			action: () => {
				void chooseRebelEnding();
			},
		},
		{
			label: "Follow orders and make everything normal again.",
			action: chooseNormalEnding,
		},
	];
	for (const choice of choices) {
		const button = document.createElement("button");
		button.type = "button";
		button.textContent = choice.label;
		button.style.minHeight = "150px";
		button.style.padding = "22px 26px";
		button.style.border = "2px solid #fff";
		button.style.background = "#000";
		button.style.color = "#fff";
		button.style.font = "900 clamp(20px, 3vw, 30px) Inter, system-ui, sans-serif";
		button.style.lineHeight = "1.1";
		button.style.cursor = "pointer";
		button.addEventListener("click", choice.action);
		choicePanel.append(button);
	}
	imageOverlay.replaceChildren(imageOverlayImage, imageOverlayVideo, laterCard, choicePanel);
}

async function runGameStages(token: number) {
	const startStageIndex = requestedStartStage();
	const previousCoworker = await ensureGameNpc("npc-previous-coworker", "npc-previous-coworker", STAGE_1_COWORKER_X, STAGE_1_COWORKER_Z);
	const femaleCoworker = await ensureGameNpc("npc-female-coworker", "npc-female-coworker", 10.33, -2.30, true);
	const robot = await ensureGameNpc("npc-robot", "npc-robot", 19.92, -14.13, true);
	const executive = await ensureGameNpc("npc-executive", "npc-executive", -13.02, -10.17, true);
	const maleCoworker = await ensureGameNpc("npc-male-coworker", "npc-male-coworker", -11.18, -9.8, true);

	if (startStageIndex <= 1) {
		snapNpcFaceTowards(previousCoworker, camera.position);
		setNpcLookAtPlayer(previousCoworker);
		placePlayer(gamePoint(STAGE_1_PLAYER_X, STAGE_1_PLAYER_Z));
		setCameraLookAt(previousCoworker.root.position);
		startStage({ name: "stage-1", mission: "Talk with co-worker.", interactables: [] });
		setPlayerMovementLocked(true);
		await speakRange(previousCoworker, "dialogue-1", 0, 5);
		releaseNpcLookAt(previousCoworker);
		void walkNpcTo(previousCoworker, 1.21, -1.45);
		await delay(6);
		previousCoworker.root.visible = false;
		setPlayerMovementLocked(false);
		if (token !== stageFlowToken) return;
	} else {
		previousCoworker.root.visible = false;
	}

	if (startStageIndex <= 2) {
		startStage({ name: "stage-2", mission: "Watch Nextflix on the computer", interactables: [{ object: "smbox-fun-desk", action: "open-nextflix-desktop" }] });
		if (startStageIndex === 2) {
			placePlayerNearActiveStageTarget();
		}
		await waitForStageCompletion("nextflix-finished");
	}

	if (startStageIndex <= 3) {
		startStage({ name: "stage-3", mission: "Approve SOGO update.", interactables: [{ object: "smcyl-sogo", action: "open-sogo-update" }] });
		if (startStageIndex === 3) {
			placePlayerNearActiveStageTarget();
		}
		startUpdateNotification();
		await waitForStageCompletion("open-sogo-update");
	}

	if (startStageIndex <= 4) {
		startStage({ name: "stage-4", mission: "Get a soda while waiting.", interactables: [{ object: "smbox-soda-vending", action: "get-soda" }] });
		if (startStageIndex === 4) {
			placePlayerNearActiveStageTarget();
		}
		await waitForStageCompletion("get-soda");
	}

	if (startStageIndex <= 5) {
		startStage({ name: "stage-5", mission: "Talk with co-worker.", interactables: [] });
		setPlayerMovementLocked(true);
		setNpcAt(femaleCoworker, 20.86, -12.12);
		await walkNpcTo(femaleCoworker, 17.93, -8.96);
		setNpcFaceTowards(femaleCoworker, camera.position);
		setNpcLookAtPlayer(femaleCoworker);
		await speakRange(femaleCoworker, "dialogue-2", 0, 2);
		setNpcAt(robot, 13.51, -5.39);
		snapNpcFaceTowards(robot, femaleCoworker.root.position);
		setNpcLookAtNpc(robot, "npc-female-coworker");
		await speak(femaleCoworker, "dialogue-2-03");
		setNpcFaceTowards(femaleCoworker, gamePoint(13.51, -5.39));
		setNpcLookAtPoint(femaleCoworker, gameLookPoint(13.51, -5.39));
		await speakRange(robot, "dialogue-3", 0, 2);
		await speak(femaleCoworker, "dialogue-4-00");
		setNpcFaceTowards(femaleCoworker, camera.position);
		setNpcLookAtPlayer(femaleCoworker);
		await speakRange(femaleCoworker, "dialogue-4", 1, 2);
		releaseNpcLookAt(femaleCoworker);
		void walkNpcTo(femaleCoworker, 19.8, -11.38);
		void walkNpcTo(robot, 10.76, -2.14);
		await delay(4);
		femaleCoworker.root.visible = false;
		robot.root.visible = false;
		setPlayerMovementLocked(false);
	}

	if (startStageIndex <= 6) {
		startStage({ name: "stage-6", mission: "Play on computer.", interactables: [{ object: "smbox-fun-desk", action: "open-sleck-desktop" }] });
		if (startStageIndex === 6) {
			placePlayerNearActiveStageTarget();
		}
		await waitForStageCompletion("open-sleck-desktop");
	}

	if (startStageIndex <= 7) {
		setNpcAt(femaleCoworker, 4.7, 14.61);
		snapNpcFaceTowards(femaleCoworker, gamePoint(2.2, 15.95));
		releaseNpcLookAt(femaleCoworker);
		startStage({ name: "stage-7", mission: "Find and talk with Stephanie.", interactables: [{ object: "npc-female-coworker", action: "talk-stephanie" }] });
		await waitForStageCompletion("talk-stephanie");
	} else if (startStageIndex === 8) {
		setNpcAt(femaleCoworker, 4.7, 14.61);
	}

	if (startStageIndex <= 8) {
		startStage({ name: "stage-8", mission: "", interactables: [] });
		snapNpcFaceTowards(femaleCoworker, camera.position);
		setNpcLookAtPlayer(femaleCoworker);
		await speakRange(femaleCoworker, "dialogue-5", 0, 4);
	}

	if (startStageIndex <= 9) {
		startStage({ name: "stage-9", mission: "Check with SOGO.", interactables: [{ object: "smcyl-sogo", action: "open-sogo-check" }] });
		if (startStageIndex === 9) {
			placePlayerNearActiveStageTarget();
		}
		await waitForStageCompletion("open-sogo-check");
	}

	if (startStageIndex <= 10) {
		placePlayer(gamePoint(-14.06, -12.37));
		setCameraLookAt(gamePoint(-13.02, -10.17));
		setPlayerMovementLocked(true);
		startStage({ name: "stage-10", mission: "", interactables: [] });
		setNpcAt(executive, -12.76, -10.59);
		setNpcAt(maleCoworker, -11.18, -9.8);
		setNpcAt(femaleCoworker, -13.58, -8.85);
		snapNpcFaceTowards(executive, camera.position);
		setNpcLookAtPlayer(executive);
		snapNpcFaceTowards(maleCoworker, executive.root.position);
		setNpcLookAtNpc(maleCoworker, "npc-executive");
		snapNpcFaceTowards(femaleCoworker, executive.root.position);
		setNpcLookAtNpc(femaleCoworker, "npc-executive");
		await speakRange(executive, "dialogue-6", 0, 2);
		setNpcFaceTowards(executive, maleCoworker.root.position);
		setNpcLookAtNpc(executive, "npc-male-coworker");
		setNpcFaceTowards(femaleCoworker, maleCoworker.root.position);
		setNpcLookAtNpc(femaleCoworker, "npc-male-coworker");
		await speakRange(maleCoworker, "dialogue-7", 0, 2);
		await speak(executive, "dialogue-8-00");
		releaseNpcLookAt(maleCoworker);
		void walkNpcTo(maleCoworker, -7.09, -10.99).then(() => {
			maleCoworker.root.visible = false;
		});
		setNpcFaceTowards(executive, camera.position);
		setNpcLookAtPlayer(executive);
		await speakRange(executive, "dialogue-8", 1, 3);
		void walkNpcTo(executive, -7.09, -10.99);
		await delay(0.3);
		setNpcFaceTowards(femaleCoworker, camera.position);
		setNpcLookAtPlayer(femaleCoworker);
		await speakRange(femaleCoworker, "dialogue-9", 0, 3);
		setPlayerMovementLocked(false);
	}

	if (startStageIndex <= 11) {
		startStage({ name: "stage-11", mission: "Talk with SOGO.", interactables: [{ object: "smcyl-sogo", action: "open-sogo-talk" }] });
		if (startStageIndex === 11) {
			placePlayerNearActiveStageTarget();
		}
		await waitForStageCompletion("open-sogo-talk");
		placePlayer(gamePoint(-14.06, -12.37));
		setCameraLookAt(gamePoint(-13.27, -8.83));
		setPlayerMovementLocked(true);
		setNpcAt(executive, -13.27, -8.83);
		setNpcAt(maleCoworker, -12.33, -9.1);
		setNpcAt(femaleCoworker, -14.06, -9.77);
		snapNpcFaceTowards(executive, maleCoworker.root.position);
		setNpcLookAtNpc(executive, "npc-male-coworker");
		snapNpcFaceTowards(maleCoworker, camera.position);
		setNpcLookAtPlayer(maleCoworker);
		snapNpcFaceTowards(femaleCoworker, camera.position);
		setNpcLookAtPlayer(femaleCoworker);
		await speakRange(maleCoworker, "dialogue-10", 0, 3);
		await speak(executive, "dialogue-11-00");
		setNpcFaceTowards(executive, camera.position);
		setNpcLookAtPlayer(executive);
		await speakRange(executive, "dialogue-11", 1, 2);
		setPlayerMovementLocked(false);
	}

	if (startStageIndex <= 12) {
		startStage({ name: "stage-12", mission: "Rollback the update.", interactables: [{ object: "smbox-server.002", action: "rollback-update" }] });
		if (startStageIndex === 12) {
			placePlayerNearActiveStageTarget();
		}
		await waitForStageCompletion("rollback-update");
		await fadeToBlack(1);
	}

	if (startStageIndex <= 13) {
		startStage({ name: "stage-13", mission: "Talk to robot SOGO.", interactables: [] });
		setPlayerMovementLocked(true);
		placePlayer(gamePoint(4.96, -8.59));
		setCameraLookAt(gamePoint(1.30, -8.42));
		setNpcAt(robot, 1.30, -8.42);
		snapNpcFaceTowards(robot, camera.position);
		setNpcLookAtPlayer(robot);
		await fadeFromBlack(1);
		await speakRange(robot, "dialogue-12", 0, 8);
		await fadeToBlack(1);
		completeGameAndShowMenu();
	}
}

function placePlayer(feet: THREE.Vector3) {
	setPlayerFromFeet(feet, currentHeight);
	playerVelocity.set(0, 0, 0);
	playerCollisions();
	const playerFeet = feetPosition();
	camera.position.set(playerFeet.x, playerFeet.y + currentEye, playerFeet.z);
}

function parseNumber(value: string) {
	const number = Number(value);
	return Number.isFinite(number) ? number : null;
}

function requestedStartStage() {
	const value = new URLSearchParams(window.location.search).get("s");
	if (!value) {
		return MIN_STAGE_INDEX;
	}
	const stage = Number.parseInt(value, 10);
	if (!Number.isFinite(stage)) {
		return MIN_STAGE_INDEX;
	}
	return THREE.MathUtils.clamp(stage, MIN_STAGE_INDEX, MAX_STAGE_INDEX);
}

function formatCommandHelp() {
	return "Commands: add-model [name], animation-browser [on|off|toggle], play-sequence [sequence], play-animation [animation], loop-animation [animation], say-talkfile [talkfile], stop-animations, lighting [ambient], npc-fill [intensity], show-position, hide-position, teleport [x] [y]";
}

function completeConsoleInput() {
	const beforeCursor = consoleInput.value.slice(0, consoleInput.selectionStart ?? consoleInput.value.length);
	const parts = beforeCursor.trimStart().split(/\s+/);
	const endsWithSpace = /\s$/.test(beforeCursor);
	const commandName = parts[0] ?? "";
	const candidates =
		commandName === "add-model" && parts.length === 2 && !endsWithSpace
			? Array.from(availableModels)
			: commandName === "animation-browser" && parts.length === 2 && !endsWithSpace
				? ["off", "on", "toggle"]
			: ["loop-animation", "play-animation"].includes(commandName) && parts.length === 2 && !endsWithSpace
				? Array.from(availableAnimations)
			: commandName === "play-sequence" && parts.length === 2 && !endsWithSpace
				? Array.from(availableSequences)
			: commandName === "say-talkfile" && parts.length === 2 && !endsWithSpace
				? []
			: parts.length <= 1 && !endsWithSpace
				? consoleCommands
				: [];
	const token = endsWithSpace ? "" : parts.at(-1) ?? "";
	const matches = candidates.filter((candidate) => candidate.startsWith(token));

	if (matches.length === 0) {
		setConsoleLog("No completion match.");
		return;
	}
	if (matches.length > 1) {
		setConsoleLog(matches.join("  "));
		return;
	}

	const completed = matches[0];
	const replacementStart = beforeCursor.length - token.length;
	const nextValue = `${consoleInput.value.slice(0, replacementStart)}${completed} ${consoleInput.value.slice(
		consoleInput.selectionStart ?? consoleInput.value.length,
	)}`;
	consoleInput.value = nextValue;
	const cursor = replacementStart + completed.length + 1;
	consoleInput.setSelectionRange(cursor, cursor);
}

function applyNpcMaterialFill(material: THREE.Material) {
	const fillableMaterial = material as THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial;
	if (!("emissive" in fillableMaterial)) {
		return;
	}

	fillableMaterial.emissive.set(0xffffff);
	fillableMaterial.emissiveIntensity = npcFillIntensity;
	if (fillableMaterial.map && !fillableMaterial.emissiveMap) {
		fillableMaterial.emissiveMap = fillableMaterial.map;
	}
	fillableMaterial.needsUpdate = true;
	npcMaterials.add(fillableMaterial);
}

function setNpcFillIntensity(intensity: number) {
	npcFillIntensity = intensity;
	for (const material of npcMaterials) {
		applyNpcMaterialFill(material);
	}
}

function findNpcGaze(root: THREE.Group): NpcGaze {
	let headBone: THREE.Object3D | null = null;
	let eyeMesh: THREE.Mesh | null = null;
	const morphIndices = new Map<string, number>();

	root.traverse((object) => {
		if (object.name === "Bip01 Head") {
			headBone = object;
		}
		const mesh = object as THREE.Mesh;
		if (!mesh.isMesh || !mesh.morphTargetDictionary) {
			return;
		}
		const meshMorphIndices = new Map<string, number>();
		for (const [name, index] of Object.entries(mesh.morphTargetDictionary)) {
			const match = name.match(/AK_1[1-8]/);
			if (match) {
				meshMorphIndices.set(match[0], index);
			}
		}
		if (meshMorphIndices.size === 0 || (eyeMesh && mesh.name !== "mesh_0_1")) {
			return;
		}
		eyeMesh = mesh;
		morphIndices.clear();
		for (const [key, index] of meshMorphIndices) {
			morphIndices.set(key, index);
		}
	});

	return {
		baseHeadQuaternion: headBone ? headBone.quaternion.clone() : new THREE.Quaternion(),
		currentHeadX: 0,
		currentHeadZ: 0,
		headBone,
		morphIndices,
		target: null,
		eyeMesh,
	};
}

function findNpcTalkRig(root: THREE.Group): NpcTalkRig {
	const visemeMeshes: NpcVisemeMesh[] = [];

	root.traverse((object) => {
		const mesh = object as THREE.Mesh;
		if (!mesh.isMesh || !mesh.morphTargetDictionary || !mesh.morphTargetInfluences) {
			return;
		}
		const indices = new Map<string, number>();
		for (const morphTarget of TALK_MORPH_TARGETS) {
			const index = mesh.morphTargetDictionary[morphTarget];
			if (index !== undefined) {
				indices.set(morphTarget, index);
			}
		}
		if (indices.size > 0) {
			visemeMeshes.push({ mesh, indices });
		}
	});

	return { visemeMeshes };
}

async function loadAnimationManifest() {
	try {
		const response = await fetch("/assets/animations/manifest.json");
		if (!response.ok) {
			throw new Error(`HTTP ${response.status}`);
		}
		const names = (await response.json()) as unknown;
		if (!Array.isArray(names)) {
			throw new Error("manifest is not an array");
		}
		animationManifest = [];
		availableAnimations.clear();
		for (const entry of names) {
			if (typeof entry === "string" && /^(f|m)_[a-zA-Z0-9_]+$/.test(entry)) {
				animationManifest.push(entry);
				availableAnimations.add(entry);
			}
		}
	} catch (error) {
		console.warn("Using fallback animation manifest.", error);
		animationManifest = [...fallbackAnimations];
		availableAnimations.clear();
		animationManifest.forEach((name) => availableAnimations.add(name));
	}
}

async function preloadCoreAnimations() {
	await Promise.all(
		preloadAnimations.map(async (name) => {
			if (!availableAnimations.has(name)) {
				console.warn(`Preload animation "${name}" is not listed in the manifest.`);
				return;
			}
			await loadAnimationClip(name);
		}),
	);
}

async function loadModelTemplate(name: string) {
	const cached = modelCache.get(name);
	if (cached) {
		return cached;
	}

	const { loader, dracoLoader } = createGltfLoader();
	const gltf = await loader.loadAsync(`/assets/models/${name}.glb`);
	dracoLoader.dispose();

	gltf.scene.traverse((object) => {
		if ((object as THREE.Mesh).isMesh) {
			const mesh = object as THREE.Mesh;
			mesh.castShadow = true;
			mesh.receiveShadow = true;
			const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
			for (const material of materials) {
				applyNpcMaterialFill(material);
			}
		}
	});

	modelCache.set(name, gltf.scene);
	return gltf.scene;
}

async function loadAnimationClip(name: string) {
	const cached = animationCache.get(name);
	if (cached) {
		return cached;
	}
	if (!availableAnimations.has(name)) {
		throw new Error(`Unknown animation "${name}".`);
	}

	const { loader, dracoLoader } = createGltfLoader();
	const gltf = await loader.loadAsync(`/assets/animations/${name}.glb`);
	dracoLoader.dispose();
	let clip = gltf.animations[0];

	if (!clip) {
		throw new Error(`Animation "${name}" did not contain any clips.`);
	}

	if (/^[fm]_walk_(start|neutral|stop)$/.test(name)) {
		clip = makeNpcWalkClipInPlace(clip);
	}

	animationCache.set(name, clip);
	return clip;
}

function groundNpcModelAt(instance: THREE.Group, floorY: number) {
	instance.updateMatrixWorld(true);
	const bounds = new THREE.Box3().setFromObject(instance);
	if (bounds.isEmpty()) {
		return;
	}
	const offset = floorY - bounds.min.y;
	if (Math.abs(offset) < 0.001) {
		return;
	}
	for (const child of instance.children) {
		child.position.y += offset;
	}
	instance.updateMatrixWorld(true);
}

function makeNpcWalkClipInPlace(clip: THREE.AnimationClip) {
	const tracks = clip.tracks.map((track) => {
		if (track.name !== "Bip01.position" || !(track instanceof THREE.VectorKeyframeTrack)) {
			return track;
		}

		const values = Array.from(track.values);
		const firstX = values[0] ?? 0;
		const firstZ = values[2] ?? 0;
		for (let index = 0; index < values.length; index += 3) {
			values[index] = firstX;
			values[index + 2] = firstZ;
		}
		return new THREE.VectorKeyframeTrack(track.name, Array.from(track.times), values);
	});
	return new THREE.AnimationClip(clip.name, clip.duration, tracks);
}

function npcModelYawOffset(modelName: string) {
	return modelName === "npc-robot" ? ROBOT_MODEL_YAW_OFFSET : 0;
}

async function addModel(
	name: string,
	spawnOverride?: THREE.Vector3,
	options: { id?: string; hidden?: boolean; rotationY?: number } = {},
) {
	if (!availableModels.has(name)) {
		setConsoleLog(`Unknown model "${name}". Available: ${Array.from(availableModels).join(", ")}`);
		return null;
	}

	const template = await loadModelTemplate(name);
	const instance = cloneSkeleton(template);
	const feet = feetPosition();
	const forward = getForwardVector().clone();
	const spawn = spawnOverride ?? feet.clone().add(forward.multiplyScalar(NPC_SPAWN_DISTANCE));
	spawn.y = floorYAt(spawn.x, spawn.z, feet.y) + 0.01;

	instance.position.set(spawn.x, spawn.y, spawn.z);
	instance.rotation.y = options.rotationY ?? camera.rotation.y + Math.PI + npcModelYawOffset(name);
	groundNpcModelAt(instance, spawn.y);
	instance.visible = options.hidden !== true;
	const npc = {
		action: null,
		gaze: findNpcGaze(instance),
		id: options.id ?? null,
		idleAnimation: null,
		idleAction: null,
		mixer: new THREE.AnimationMixer(instance),
		modelName: name,
		root: instance,
		talk: findNpcTalkRig(instance),
		turn: null,
		walk: null,
	};
	await setNpcIdleAnimation(npc, defaultNpcIdleAnimation(npc));
	scene.add(instance);
	npcs.push(npc);
	if (npc.id) {
		npcsById.set(npc.id, npc);
	}
	setConsoleLog(`Added ${name} at ${spawn.x.toFixed(2)}, ${spawn.z.toFixed(2)}.`);
	return npc;
}

function stopNpcAnimation(npc: NpcInstance) {
	if (npc.action) {
		fadeOutAndStopAction(npc.action);
		npc.action = null;
	}
	if (npc.idleAction) {
		fadeOutAndStopAction(npc.idleAction);
		npc.idleAction = null;
	}
	void setNpcIdleAnimation(npc, npc.idleAnimation ?? defaultNpcIdleAnimation(npc)).catch((error) => {
		setConsoleLog(`Could not restart idle "${npc.idleAnimation}": ${String(error)}`);
	});
}

function fadeOutAndStopAction(action: THREE.AnimationAction) {
	const existingTimer = actionStopTimers.get(action);
	if (existingTimer !== undefined) {
		window.clearTimeout(existingTimer);
	}
	action.fadeOut(ANIMATION_BLEND_SECONDS);
	const timer = window.setTimeout(() => {
		action.stop();
		actionStopTimers.delete(action);
	}, ANIMATION_BLEND_SECONDS * 1000);
	actionStopTimers.set(action, timer);
}

function prepareActionForPlay(action: THREE.AnimationAction) {
	const existingTimer = actionStopTimers.get(action);
	if (existingTimer !== undefined) {
		window.clearTimeout(existingTimer);
		actionStopTimers.delete(action);
	}
	action.stopFading();
}

function stopAnimations() {
	for (const npc of npcs) {
		stopNpcAnimation(npc);
	}
}

async function playAnimationOnNpcs(name: string, loop: boolean, targets = npcs) {
	if (!availableAnimations.has(name)) {
		setConsoleLog(`Unknown animation "${name}". Available: ${Array.from(availableAnimations).join(", ")}`);
		return;
	}
	if (targets.length === 0) {
		setConsoleLog("No NPCs in scene.");
		return;
	}

	setConsoleLog(`Loading ${name}...`);
	const clip = await loadAnimationClip(name);

	for (const npc of targets) {
		if (npc.action) {
			fadeOutAndStopAction(npc.action);
			npc.action = null;
		}
		if (npc.idleAction) {
			fadeOutAndStopAction(npc.idleAction);
			npc.idleAction = null;
		}
		const action = npc.mixer.clipAction(clip, npc.root);
		prepareActionForPlay(action);
		action.reset();
		action.enabled = true;
		action.clampWhenFinished = !loop;
		action.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, loop ? Infinity : 1);
		action.fadeIn(ANIMATION_BLEND_SECONDS);
		action.play();
		npc.action = action;
		if (!loop) {
			const handleFinished = (event: { action: THREE.AnimationAction }) => {
				if (event.action !== action) {
					return;
				}
				npc.mixer.removeEventListener("finished", handleFinished);
				if (npc.action !== action) {
					fadeOutAndStopAction(action);
					return;
				}
				npc.action = null;
				if (npc.idleAnimation) {
					void setNpcIdleAnimation(npc, npc.idleAnimation).then(() => {
						fadeOutAndStopAction(action);
					}).catch((error) => {
						fadeOutAndStopAction(action);
						setConsoleLog(`Could not restart idle "${npc.idleAnimation}": ${String(error)}`);
					});
				} else {
					fadeOutAndStopAction(action);
				}
			};
			npc.mixer.addEventListener("finished", handleFinished);
		}
	}

	setConsoleLog(`${loop ? "Looping" : "Playing"} ${name} on ${targets.length} NPC(s).`);
}

function renderAnimationList(
	container: HTMLDivElement,
	names: string[],
	searchValue: string,
	targetModel: string,
) {
	container.replaceChildren();
	const query = searchValue.trim().toLowerCase();
	const filteredNames = names.filter((name) => name.toLowerCase().includes(query));

	for (const name of filteredNames) {
		const button = document.createElement("button");
		button.type = "button";
		button.className = "animation-browser-item";
		button.textContent = name;
		button.addEventListener("click", () => {
			void playBrowserAnimation(name, targetModel);
		});
		container.append(button);
	}

	if (filteredNames.length === 0) {
		const empty = document.createElement("div");
		empty.className = "animation-browser-hint";
		empty.textContent = "No animations match.";
		container.append(empty);
	}
}

function renderAnimationBrowser() {
	renderAnimationList(
		femaleAnimationList,
		animationNames("f_"),
		femaleAnimationSearch.value,
		"npc-female-coworker",
	);
	renderAnimationList(maleAnimationList, animationNames("m_"), maleAnimationSearch.value, "npc-executive");
}

async function ensureBrowserNpc(modelName: string, sideOffset: number) {
	const existing = npcs.find((npc) => npc.modelName === modelName);
	if (existing) {
		return existing;
	}

	const feet = feetPosition();
	const forward = getForwardVector().clone();
	const side = getSideVector().clone();
	const spawn = feet
		.clone()
		.add(forward.multiplyScalar(3))
		.add(side.multiplyScalar(sideOffset));
	return addModel(modelName, spawn);
}

async function playBrowserAnimation(name: string, modelName: string) {
	const sideOffset = modelName === "npc-female-coworker" ? -1.1 : 1.1;
	const npc = await ensureBrowserNpc(modelName, sideOffset);
	if (!npc) {
		return;
	}

	await playAnimationOnNpcs(name, true, [npc]);
}

function isObject(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSequencePoint(value: unknown): value is SequencePoint {
	if (Array.isArray(value)) {
		return (
			(value.length === 2 || value.length === 3) &&
			value.every((entry) => typeof entry === "number" && Number.isFinite(entry))
		);
	}
	return (
		isObject(value) &&
		typeof value.x === "number" &&
		Number.isFinite(value.x) &&
		(value.y === undefined || (typeof value.y === "number" && Number.isFinite(value.y))) &&
		typeof value.z === "number" &&
		Number.isFinite(value.z)
	);
}

function sequenceEventNumber(event: SequenceEvent, key: string, fallback: number) {
	const value = event[key];
	return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function sequenceEventBoolean(event: SequenceEvent, key: string, fallback: boolean) {
	const value = event[key];
	return typeof value === "boolean" ? value : fallback;
}

function sequenceEventString(event: SequenceEvent, key: string) {
	const value = event[key];
	if (typeof value !== "string" || value.trim() === "") {
		throw new Error(`${event.type} requires "${key}".`);
	}
	return value;
}

function resolvePoint(
	value: unknown,
	sequence: SequenceDefinition,
	fallbackY = feetPosition().y,
) {
	const point = typeof value === "string" ? sequence.points?.[value] : value;
	if (!isSequencePoint(point)) {
		throw new Error(`Unknown or invalid point "${String(value)}".`);
	}
	const vector = Array.isArray(point)
		? new THREE.Vector3(point[0], point[2] ?? floorYAt(point[0], point[1], fallbackY) + 0.01, point[1])
		: new THREE.Vector3(point.x, point.y ?? fallbackY, point.z);
	if (!Array.isArray(point) && point.y === undefined) {
		vector.y = floorYAt(vector.x, vector.z, fallbackY) + 0.01;
	}
	return vector;
}

function setCameraLookAt(point: THREE.Vector3) {
	const target = point.clone();
	if (target.y < camera.position.y - currentEye * 0.5) {
		target.y += currentEye;
	}
	const direction = target.sub(camera.position).normalize();
	if (direction.lengthSq() === 0) {
		return;
	}
	camera.rotation.y = Math.atan2(-direction.x, -direction.z);
	camera.rotation.x = Math.asin(THREE.MathUtils.clamp(direction.y, -1, 1));
	camera.rotation.x = THREE.MathUtils.clamp(camera.rotation.x, -Math.PI / 2, Math.PI / 2);
}

function npcYawTowards(npc: NpcInstance, point: THREE.Vector3) {
	const direction = point.clone().sub(npc.root.position);
	direction.y = 0;
	if (direction.lengthSq() === 0) {
		return null;
	}
	return Math.atan2(direction.x, direction.z) + npcModelYawOffset(npc.modelName);
}

function yawDelta(fromYaw: number, toYaw: number) {
	return THREE.MathUtils.euclideanModulo(toYaw - fromYaw + Math.PI, Math.PI * 2) - Math.PI;
}

function nearestEquivalentYaw(fromYaw: number, toYaw: number) {
	return fromYaw + yawDelta(fromYaw, toYaw);
}

function setNpcFaceTowards(npc: NpcInstance, point: THREE.Vector3, duration = NPC_SCRIPTED_TURN_SECONDS) {
	const targetYaw = npcYawTowards(npc, point);
	if (targetYaw === null) {
		return;
	}
	const toYaw = nearestEquivalentYaw(npc.root.rotation.y, targetYaw);
	if (duration <= 0) {
		npc.root.rotation.y = toYaw;
		npc.turn = null;
		return;
	}
	npc.turn = {
		elapsed: 0,
		fromYaw: npc.root.rotation.y,
		toYaw,
		duration,
	};
}

function snapNpcFaceTowards(npc: NpcInstance, point: THREE.Vector3) {
	setNpcFaceTowards(npc, point, 0);
}

function blendNpcFaceTowards(npc: NpcInstance, point: THREE.Vector3, deltaTime: number) {
	const targetYaw = npcYawTowards(npc, point);
	if (targetYaw === null) {
		return;
	}
	npc.turn = null;
	npc.root.rotation.y += yawDelta(npc.root.rotation.y, targetYaw) * blendFactor(deltaTime, NPC_TURN_BLEND_SECONDS);
}

function setNpcLookAtPoint(npc: NpcInstance, point: THREE.Vector3) {
	npc.gaze.target = { kind: "point", point: point.clone() };
	snapNpcGaze(npc);
}

function setNpcLookAtPlayer(npc: NpcInstance) {
	npc.gaze.target = { kind: "player" };
	snapNpcGaze(npc);
}

function setNpcLookAtNpc(npc: NpcInstance, targetNpcId: string) {
	npc.gaze.target = { kind: "npc", npcId: targetNpcId };
	snapNpcGaze(npc);
}

function releaseNpcLookAt(npc: NpcInstance) {
	npc.gaze.target = null;
	snapNpcGaze(npc);
}

function audioUrl(name: string) {
	return name.includes(".") ? `/assets/audio/${name}` : `/assets/audio/${name}.mp3`;
}

function getAudio(name: string) {
	const cached = audioCache.get(name);
	if (cached) {
		return cached.cloneNode(true) as HTMLAudioElement;
	}
	const audio = new Audio(audioUrl(name));
	audio.preload = "auto";
	audioCache.set(name, audio);
	return audio.cloneNode(true) as HTMLAudioElement;
}

function talkfileUrl(name: string) {
	if (name.startsWith("/")) {
		return name;
	}
	if (name.includes("/")) {
		return name.endsWith(".json") ? name : `${name}.json`;
	}
	return `${TALKFILE_ROOT}/${name.endsWith(".json") ? name : `${name}.json`}`;
}

function talkfileAudioUrl(talkfilePath: string, talkfile: Talkfile) {
	if (talkfile.audio) {
		if (talkfile.audio.startsWith("/")) {
			return talkfile.audio;
		}
		return new URL(talkfile.audio, window.location.origin + talkfilePath).pathname;
	}
	return talkfilePath.replace(/\.json(?:$|\?)/, ".mp3");
}

function isTalkfileCue(value: unknown): value is TalkfileCue {
	return (
		isObject(value) &&
		typeof value.start === "number" &&
		Number.isFinite(value.start) &&
		typeof value.end === "number" &&
		Number.isFinite(value.end) &&
			typeof value.shape === "string" &&
			typeof value.morphTarget === "string" &&
			(VISEME_MORPH_TARGETS as readonly string[]).includes(value.morphTarget) &&
			(value.jawOpen === undefined ||
				(typeof value.jawOpen === "number" && Number.isFinite(value.jawOpen))) &&
			(value.volume === undefined || (typeof value.volume === "number" && Number.isFinite(value.volume)))
	);
}

function validateTalkfile(value: unknown): Talkfile {
	if (!isObject(value) || typeof value.caption !== "string" || typeof value.duration !== "number") {
		throw new Error("Talkfile JSON must include caption and duration.");
	}
	const rawCues = Array.isArray(value.cues)
		? value.cues
		: Array.isArray(value.visemes)
			? value.visemes
			: null;
	if (!rawCues) {
		throw new Error("Talkfile JSON must include a cues array.");
	}
	const cues = rawCues.filter(isTalkfileCue).sort((a, b) => a.start - b.start);
	if (cues.length !== rawCues.length) {
		throw new Error("Talkfile has invalid cue entries.");
	}
	return {
		audio: typeof value.audio === "string" ? value.audio : undefined,
		caption: value.caption,
		duration: Math.max(0, value.duration),
		cues,
		tweenSeconds:
			typeof value.tweenSeconds === "number" && Number.isFinite(value.tweenSeconds)
				? Math.max(0, value.tweenSeconds)
				: undefined,
	};
}

async function loadTalkfile(name: string) {
	const url = talkfileUrl(name);
	const cached = talkfileCache.get(url);
	if (cached) {
		return { talkfile: cached, url };
	}
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`HTTP ${response.status}`);
	}
	const talkfile = validateTalkfile(await response.json());
	talkfileCache.set(url, talkfile);
	return { talkfile, url };
}

async function loadTalkAudio(url: string) {
	const cached = talkAudioCache.get(url);
	if (cached) {
		return cached;
	}
	const loader = new THREE.AudioLoader();
	const buffer = await loader.loadAsync(url);
	talkAudioCache.set(url, buffer);
	return buffer;
}

function resetNpcVisemes(npc: NpcInstance) {
	for (const entry of npc.talk.visemeMeshes) {
		const influences = entry.mesh.morphTargetInfluences;
		if (!influences) {
			continue;
		}
		for (const index of entry.indices.values()) {
			influences[index] = 0;
		}
	}
}

function nearestNpcToPlayer() {
	const feet = feetPosition();
	let nearest: NpcInstance | null = null;
	let nearestDistanceSq = Infinity;
	for (const npc of npcs) {
		if (!npc.root.visible) {
			continue;
		}
		const distanceSq = npc.root.position.distanceToSquared(feet);
		if (distanceSq < nearestDistanceSq) {
			nearest = npc;
			nearestDistanceSq = distanceSq;
		}
	}
	return nearest;
}

async function playTalkfileOnNpc(npc: NpcInstance, name: string) {
	const { talkfile, url } = await loadTalkfile(name);
	const buffer = await loadTalkAudio(talkfileAudioUrl(url, talkfile));
	const audio = new THREE.PositionalAudio(audioListener);
	audio.setBuffer(buffer);
	audio.setRefDistance(1);
	audio.setRolloffFactor(0);
	audio.setDistanceModel("linear");
	audio.setLoop(false);
	npc.root.add(audio);
	resetNpcVisemes(npc);
	setCaption(talkfile.caption);
	audio.play();
	activeTalks.push({
		audio,
		caption: talkfile.caption,
		cues: talkfile.cues,
		duration: talkfile.duration,
		npc,
		currentWeights: new Map(),
		startedAt: audio.context.currentTime,
		tweenSeconds: talkfile.tweenSeconds ?? TALKFILE_TWEEN_SECONDS,
	});
	setConsoleLog(`Playing talkfile "${name}" on ${npc.id ?? npc.modelName}.`);
}

function cueAt(cues: TalkfileCue[], time: number) {
	for (let index = 0; index < cues.length; index += 1) {
		const cue = cues[index];
		if (time >= cue.start && time < cue.end) {
			return { cue, index };
		}
	}
	return null;
}

function addVisemeWeight(weights: Map<string, number>, morphTarget: string, weight: number) {
	weights.set(morphTarget, Math.max(weights.get(morphTarget) ?? 0, THREE.MathUtils.clamp(weight, 0, 1)));
}

function addCueWeights(weights: Map<string, number>, cue: TalkfileCue, weight: number) {
	addVisemeWeight(weights, cue.morphTarget, weight);
	if (cue.jawOpen && cue.jawOpen > 0) {
		addVisemeWeight(weights, TALK_JAW_OPEN_TARGET, cue.jawOpen * weight);
	}
}

function visemeWeightsAt(cues: TalkfileCue[], time: number, tweenSeconds: number) {
	const weights = new Map<string, number>();
	const active = cueAt(cues, time);
	if (!active) {
		addVisemeWeight(weights, "AA_VI_00_Sil", 1);
		return weights;
	}

	const cue = active.cue;
	const previous = cues[active.index - 1];
	const next = cues[active.index + 1];
	let currentWeight = 1;

	if (tweenSeconds > 0 && previous && time - cue.start < tweenSeconds) {
		const progress = THREE.MathUtils.clamp((time - cue.start) / tweenSeconds, 0, 1);
		addCueWeights(weights, previous, 1 - progress);
		currentWeight = Math.min(currentWeight, progress);
	}
	if (tweenSeconds > 0 && next && cue.end - time < tweenSeconds) {
		const progress = THREE.MathUtils.clamp((tweenSeconds - (cue.end - time)) / tweenSeconds, 0, 1);
		addCueWeights(weights, next, progress);
		currentWeight = Math.min(currentWeight, 1 - progress);
	}

	addCueWeights(weights, cue, currentWeight);
	return weights;
}

function smoothTalkWeights(talk: ActiveTalk, targetWeights: Map<string, number>, deltaTime: number) {
	for (const morphTarget of TALK_MORPH_TARGETS) {
		const current = talk.currentWeights.get(morphTarget) ?? 0;
		const target = targetWeights.get(morphTarget) ?? 0;
		const next = THREE.MathUtils.damp(current, target, TALKFILE_SMOOTH_LAMBDA, deltaTime);
		talk.currentWeights.set(morphTarget, next < 0.001 ? 0 : next);
	}
}

function applyNpcVisemes(npc: NpcInstance, weights: Map<string, number>) {
	for (const entry of npc.talk.visemeMeshes) {
		const influences = entry.mesh.morphTargetInfluences;
		if (!influences) {
			continue;
		}
		for (const [morphTarget, index] of entry.indices) {
			influences[index] = weights.get(morphTarget) ?? 0;
		}
	}
}

function updateActiveTalks(deltaTime: number) {
	for (let index = activeTalks.length - 1; index >= 0; index -= 1) {
		const talk = activeTalks[index];
		const elapsed = talk.audio.context.currentTime - talk.startedAt;
		if (!talk.audio.isPlaying || elapsed >= talk.duration + talk.tweenSeconds) {
			talk.audio.stop();
			talk.audio.removeFromParent();
			resetNpcVisemes(talk.npc);
			activeTalks.splice(index, 1);
			setCaption(activeTalks.at(-1)?.caption ?? "");
			continue;
		}
		smoothTalkWeights(talk, visemeWeightsAt(talk.cues, elapsed, talk.tweenSeconds), deltaTime);
		applyNpcVisemes(talk.npc, talk.currentWeights);
	}
}

function fadeAudio(audio: HTMLAudioElement, from: number, to: number, seconds: number, onDone?: () => void) {
	audio.volume = from;
	if (seconds <= 0) {
		audio.volume = to;
		onDone?.();
		return;
	}
	const startedAt = performance.now();
	const durationMs = seconds * 1000;
	const timer = window.setInterval(() => {
		const progress = THREE.MathUtils.clamp((performance.now() - startedAt) / durationMs, 0, 1);
		audio.volume = THREE.MathUtils.lerp(from, to, progress);
		if (progress >= 1) {
			window.clearInterval(timer);
			onDone?.();
		}
	}, 50);
}

function playSound(name: string) {
	if (name === "test-sound") {
		playTestTone();
		return;
	}
	const audio = getAudio(name);
	void audio.play().catch((error) => {
		setConsoleLog(`Could not play sound "${name}": ${String(error)}`);
	});
}

function playTestTone() {
	const context = new AudioContext();
	const oscillator = context.createOscillator();
	const gain = context.createGain();
	oscillator.type = "triangle";
	oscillator.frequency.value = 660;
	gain.gain.setValueAtTime(0.0001, context.currentTime);
	gain.gain.exponentialRampToValueAtTime(0.16, context.currentTime + 0.02);
	gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.22);
	oscillator.connect(gain).connect(context.destination);
	oscillator.start();
	oscillator.stop(context.currentTime + 0.24);
	oscillator.addEventListener("ended", () => {
		void context.close();
	});
}

function playMusic(name: string, loop: boolean, fadeIn: boolean) {
	if (currentMusic) {
		currentMusic.pause();
		currentMusic = null;
	}
	const audio = getAudio(name);
	audio.loop = loop;
	currentMusic = audio;
	if (fadeIn) {
		audio.volume = 0;
	}
	void audio.play().then(() => {
		if (fadeIn) {
			fadeAudio(audio, 0, 1, 1);
		}
	}).catch((error) => {
		setConsoleLog(`Could not play music "${name}": ${String(error)}`);
	});
}

function stopMusic(fadeOut: boolean) {
	if (!currentMusic) {
		return;
	}
	const audio = currentMusic;
	currentMusic = null;
	if (fadeOut) {
		fadeAudio(audio, audio.volume, 0, 1, () => {
			audio.pause();
			audio.currentTime = 0;
		});
		return;
	}
	audio.pause();
	audio.currentTime = 0;
}

async function setNpcIdleAnimation(npc: NpcInstance, animation: string) {
	npc.idleAnimation = animation;
	const clip = await loadAnimationClip(animation);
	const action = npc.mixer.clipAction(clip, npc.root);
	prepareActionForPlay(action);
	if (npc.idleAction === action) {
		action.enabled = true;
		action.setLoop(THREE.LoopRepeat, Infinity);
		action.fadeIn(ANIMATION_BLEND_SECONDS);
		action.play();
		return;
	}
	if (npc.idleAction) {
		fadeOutAndStopAction(npc.idleAction);
	}
	action.reset();
	action.enabled = true;
	action.setLoop(THREE.LoopRepeat, Infinity);
	action.fadeIn(ANIMATION_BLEND_SECONDS);
	action.play();
	npc.idleAction = action;
}

function npcWalkAnimationPrefix(npc: NpcInstance) {
	return npc.modelName.includes("female") ? "f" : "m";
}

function defaultNpcIdleAnimation(npc: NpcInstance) {
	return npcWalkAnimationPrefix(npc) === "f" ? "f_idle_breathe_02" : "m_idle_breathe_01";
}

function playNpcAction(npc: NpcInstance, clip: THREE.AnimationClip, loop: boolean) {
	if (npc.action) {
		fadeOutAndStopAction(npc.action);
	}
	if (npc.idleAction) {
		fadeOutAndStopAction(npc.idleAction);
		npc.idleAction = null;
	}

	const action = npc.mixer.clipAction(clip, npc.root);
	prepareActionForPlay(action);
	action.reset();
	action.enabled = true;
	action.clampWhenFinished = !loop;
	action.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, loop ? Infinity : 1);
	action.fadeIn(ANIMATION_BLEND_SECONDS);
	action.play();
	npc.action = action;
	return action;
}

async function playNpcWalkStart(npc: NpcInstance) {
	const prefix = npcWalkAnimationPrefix(npc);
	const startClip = await loadAnimationClip(`${prefix}_walk_start`);
	const neutralClip = await loadAnimationClip(`${prefix}_walk_neutral`);
	const startAction = playNpcAction(npc, startClip, false);

	const handleFinished = (event: { action: THREE.AnimationAction }) => {
		if (event.action !== startAction) {
			return;
		}
		npc.mixer.removeEventListener("finished", handleFinished);
		if (!npc.walk || npc.action !== startAction) {
			return;
		}
		playNpcAction(npc, neutralClip, true);
	};
	npc.mixer.addEventListener("finished", handleFinished);
}

async function playNpcWalkStop(npc: NpcInstance) {
	const prefix = npcWalkAnimationPrefix(npc);
	const animation = `${prefix}_walk_stop`;
	if (!availableAnimations.has(animation)) {
		if (npc.idleAnimation) {
			await setNpcIdleAnimation(npc, npc.idleAnimation);
		}
		return;
	}

	const clip = await loadAnimationClip(animation);
	const stopAction = playNpcAction(npc, clip, false);
	const handleFinished = (event: { action: THREE.AnimationAction }) => {
		if (event.action !== stopAction) {
			return;
		}
		npc.mixer.removeEventListener("finished", handleFinished);
		if (npc.action === stopAction) {
			npc.action = null;
		}
		if (npc.idleAnimation) {
			void setNpcIdleAnimation(npc, npc.idleAnimation).then(() => {
				fadeOutAndStopAction(stopAction);
			}).catch((error) => {
				fadeOutAndStopAction(stopAction);
				setConsoleLog(`Could not restart idle "${npc.idleAnimation}": ${String(error)}`);
			});
		} else {
			fadeOutAndStopAction(stopAction);
		}
	};
	npc.mixer.addEventListener("finished", handleFinished);
}

async function ensureSequenceNpc(id: string, sequence: SequenceDefinition) {
	const existing = npcsById.get(id);
	if (existing) {
		return existing;
	}
	const pending = pendingSequenceNpcs.get(id);
	if (pending) {
		return pending;
	}
	const definition = sequence.npcs?.[id];
	if (!definition) {
		throw new Error(`Sequence NPC "${id}" is not defined.`);
	}
	const load = (async () => {
		const spawn = definition.point ? resolvePoint(definition.point, sequence) : undefined;
		const npc = await addModel(definition.model, spawn, { id, hidden: definition.hidden });
		if (!npc) {
			throw new Error(`Could not create NPC "${id}" with model "${definition.model}".`);
		}
		if (definition.idle) {
			await setNpcIdleAnimation(npc, definition.idle);
		}
		return npc;
	})().finally(() => {
		pendingSequenceNpcs.delete(id);
	});
	pendingSequenceNpcs.set(id, load);
	return load;
}

function validateSequence(value: unknown, fallbackName: string): SequenceDefinition {
	if (!isObject(value) || !Array.isArray(value.events)) {
		throw new Error("Sequence JSON must be an object with an events array.");
	}
	const sequence: SequenceDefinition = {
		name: typeof value.name === "string" ? value.name : fallbackName,
		points: isObject(value.points) ? (value.points as Record<string, SequencePoint>) : undefined,
		npcs: isObject(value.npcs) ? (value.npcs as Record<string, SequenceNpcDefinition>) : undefined,
		events: [],
	};
	for (const entry of value.events) {
		if (!isObject(entry) || typeof entry.type !== "string" || typeof entry.at !== "number") {
			throw new Error("Each sequence event must include numeric at and string type fields.");
		}
		sequence.events.push(entry as SequenceEvent);
	}
	return sequence;
}

async function loadSequence(name: string) {
	const cached = sequenceCache.get(name);
	if (cached) {
		return cached;
	}
	const response = await fetch(`/assets/sequences/${name}.json`);
	if (!response.ok) {
		throw new Error(`HTTP ${response.status}`);
	}
	const sequence = validateSequence(await response.json(), name);
	sequenceCache.set(name, sequence);
	availableSequences.add(name);
	return sequence;
}

async function playSequence(name: string) {
	const sequence = await loadSequence(name);
	const events = [...sequence.events].sort((a, b) => a.at - b.at);
	activeSequences.push({
		name,
		definition: sequence,
		startedAt: clock.elapsedTime,
		nextEventIndex: 0,
		events,
	});
	setConsoleLog(`Playing sequence "${name}" with ${events.length} event(s).`);
}

async function runSequenceEvent(sequence: SequenceDefinition, event: SequenceEvent) {
	switch (event.type) {
		case "player-teleport": {
			const point = resolvePoint(event.point, sequence);
			placePlayer(point);
			return;
		}
		case "player-face-towards":
		case "player-look-at":
			setCameraLookAt(resolvePoint(event.point, sequence, camera.position.y));
			return;
		case "player-lock-movement":
			setPlayerMovementLocked(true);
			keyStates.clear();
			playerVelocity.set(0, 0, 0);
			return;
		case "player-unlock-movement":
			setPlayerMovementLocked(false);
			return;
		case "player-lock-view":
			playerViewLocked = true;
			return;
		case "player-unlock-view":
			playerViewLocked = false;
			return;
		case "show-hint":
			setStatus(sequenceEventString(event, "hint"));
			return;
		case "hide-hint":
			setStatus(DEFAULT_STATUS_TEXT);
			return;
		case "restart-game":
			resetPlayer();
			return;
		case "play-music":
			playMusic(
				sequenceEventString(event, "song"),
				sequenceEventBoolean(event, "loop", true),
				sequenceEventBoolean(event, "fadein", false),
			);
			return;
		case "stop-music":
			stopMusic(sequenceEventBoolean(event, "fadeout", true));
			return;
		case "play-sound":
			playSound(sequenceEventString(event, "sound"));
			return;
		case "npc-show": {
			const npc = await ensureSequenceNpc(sequenceEventString(event, "npc"), sequence);
			npc.root.visible = true;
			return;
		}
		case "npc-hide": {
			const npc = await ensureSequenceNpc(sequenceEventString(event, "npc"), sequence);
			npc.root.visible = false;
			return;
		}
		case "npc-teleport": {
			const npc = await ensureSequenceNpc(sequenceEventString(event, "npc"), sequence);
			npc.root.position.copy(resolvePoint(event.point, sequence, npc.root.position.y));
			npc.walk = null;
			return;
		}
		case "npc-animate": {
			const npc = await ensureSequenceNpc(sequenceEventString(event, "npc"), sequence);
			await playAnimationOnNpcs(sequenceEventString(event, "animation"), false, [npc]);
			return;
		}
			case "npc-walk": {
				const npc = await ensureSequenceNpc(sequenceEventString(event, "npc"), sequence);
				const to = resolvePoint(event.point, sequence, npc.root.position.y);
				const path = findNpcPath(npc.root.position, to);
				if (!path) {
					setConsoleLog(`No safe NPC path found for "${sequenceEventString(event, "npc")}".`);
					return;
				}
				const requestedDuration = typeof event.duration === "number" ? Math.max(0.01, event.duration) : null;
				const pathDistance = npcPathDistance(path);
				npc.walk = {
					path,
					segmentIndex: 1,
					speed:
						requestedDuration && pathDistance > 0
							? pathDistance / requestedDuration
							: Math.max(0.01, sequenceEventNumber(event, "speed", NPC_WALK_SPEED)),
					currentSpeed: 0,
					stopStarted: false,
				};
			if (path.length > 1) {
				setNpcFaceTowards(npc, path[1]);
				await playNpcWalkStart(npc);
			}
			return;
		}
		case "npc-set-idle": {
			const npc = await ensureSequenceNpc(sequenceEventString(event, "npc"), sequence);
			await setNpcIdleAnimation(npc, sequenceEventString(event, "animation"));
			return;
		}
		case "npc-look-at": {
			const npc = await ensureSequenceNpc(sequenceEventString(event, "npc"), sequence);
			if (typeof event.target === "string") {
				await ensureSequenceNpc(event.target, sequence);
				setNpcLookAtNpc(npc, event.target);
				return;
			}
			setNpcLookAtPoint(npc, resolvePoint(event.point, sequence, npc.root.position.y));
			return;
		}
		case "npc-look-at-player": {
			const npc = await ensureSequenceNpc(sequenceEventString(event, "npc"), sequence);
			setNpcLookAtPlayer(npc);
			return;
		}
		case "npc-release-look-at": {
			const npc = await ensureSequenceNpc(sequenceEventString(event, "npc"), sequence);
			releaseNpcLookAt(npc);
			return;
		}
		case "npc-face-towards": {
			const npc = await ensureSequenceNpc(sequenceEventString(event, "npc"), sequence);
			setNpcFaceTowards(npc, resolvePoint(event.point, sequence, npc.root.position.y));
			return;
		}
		case "npc-emotion": {
			const npc = await ensureSequenceNpc(sequenceEventString(event, "npc"), sequence);
			npc.root.userData.emotion = sequenceEventString(event, "emotion");
			return;
		}
		case "npc-talk": {
			const npc = await ensureSequenceNpc(sequenceEventString(event, "npc"), sequence);
			await playTalkfileOnNpc(npc, sequenceEventString(event, "talkfile"));
			return;
		}
		default:
			setConsoleLog(`Unsupported sequence event "${event.type}".`);
	}
}

function updateNpcWalks(deltaTime: number) {
	for (const npc of npcs) {
		if (!npc.walk) {
			continue;
		}

			if (!npc.walk.stopStarted) {
				const stopClip = animationCache.get(`${npcWalkAnimationPrefix(npc)}_walk_stop`);
				const remainingSeconds = remainingNpcWalkDistance(npc) / npc.walk.speed;
				if (stopClip && remainingSeconds <= stopClip.duration * 0.5) {
				npc.walk.stopStarted = true;
				void playNpcWalkStop(npc).catch((error) => {
					setConsoleLog(`Could not play walk stop: ${String(error)}`);
				});
				}
			}

			npc.walk.currentSpeed = Math.min(
				npc.walk.speed,
				npc.walk.currentSpeed + (npc.walk.speed / NPC_WALK_ACCELERATION_SECONDS) * deltaTime,
			);
			let remainingDistance = npc.walk.currentSpeed * deltaTime;
			while (npc.walk && remainingDistance > 0) {
			const target = npc.walk.path[npc.walk.segmentIndex];
			if (!target) {
				const shouldPlayStop = !npc.walk.stopStarted;
				npc.walk = null;
				if (shouldPlayStop) {
					void playNpcWalkStop(npc).catch((error) => {
						setConsoleLog(`Could not play walk stop: ${String(error)}`);
					});
				}
				break;
			}

			const steeringTarget = npcWalkSteeringTarget(npc);
			const moveTarget =
				steeringTarget && canNpcSteerDirectly(npc.root.position, steeringTarget) ? steeringTarget : target;
			const offset = moveTarget.clone().sub(npc.root.position);
			const distance = offset.length();
			if (distance <= 0.001) {
				npc.walk.segmentIndex += 1;
				continue;
			}

			blendNpcFaceTowards(npc, moveTarget, deltaTime);
			const step = Math.min(distance, remainingDistance);
			npc.root.position.addScaledVector(offset, step / distance);
			remainingDistance -= step;

			const segmentStart = npc.walk.path[npc.walk.segmentIndex - 1] ?? npc.root.position;
			const segment = target.clone().sub(segmentStart);
			const segmentLengthSq = segment.lengthSq();
			const progress =
				segmentLengthSq > 0
					? npc.root.position.clone().sub(segmentStart).dot(segment) / segmentLengthSq
					: 1;
			if (
				step >= distance - 0.001 ||
				target.distanceTo(npc.root.position) <= NPC_NAV_CORNER_REACH_DISTANCE ||
				progress >= 0.98
			) {
				if (npc.walk.segmentIndex === npc.walk.path.length - 1) {
					npc.root.position.copy(target);
				}
				npc.walk.segmentIndex += 1;
			}
		}
	}
}

function blendFactor(deltaTime: number, duration: number) {
	return duration <= 0 ? 1 : 1 - Math.exp((-5 * deltaTime) / duration);
}

function updateNpcTurns(deltaTime: number) {
	for (const npc of npcs) {
		if (!npc.turn || npc.walk) {
			continue;
		}
		npc.turn.elapsed += deltaTime;
		const progress = THREE.MathUtils.clamp(npc.turn.elapsed / npc.turn.duration, 0, 1);
		const eased = progress * progress * (3 - 2 * progress);
		npc.root.rotation.y = THREE.MathUtils.lerp(npc.turn.fromYaw, npc.turn.toYaw, eased);
		if (progress >= 1) {
			npc.root.rotation.y = npc.turn.toYaw;
			npc.turn = null;
		}
	}
}

function npcHeadPosition(npc: NpcInstance) {
	const position = new THREE.Vector3();
	if (npc.gaze.headBone) {
		npc.gaze.headBone.getWorldPosition(position);
		return position;
	}
	return npc.root.localToWorld(new THREE.Vector3(0, 1.55, 0));
}

function resolveNpcLookTarget(npc: NpcInstance) {
	const target = npc.gaze.target;
	if (!target) {
		return null;
	}
	if (target.kind === "point") {
		return target.point;
	}
	if (target.kind === "player") {
		return camera.position.clone().add(new THREE.Vector3(0, PLAYER_GAZE_TARGET_Y_OFFSET, 0));
	}
	const targetNpc = npcsById.get(target.npcId);
	return targetNpc ? npcHeadPosition(targetNpc) : null;
}

function desiredNpcGaze(npc: NpcInstance) {
	const target = resolveNpcLookTarget(npc);
	let desiredHeadX = 0;
	let desiredHeadZ = 0;
	let horizontalEye = 0;
	let verticalEye = 0;

	if (target) {
		npc.root.updateMatrixWorld(true);
		const rootLocalTarget = npc.root.worldToLocal(target.clone());
		const rootSideRadians = Math.atan2(rootLocalTarget.x, rootLocalTarget.z);
		const rootHorizontalDistance = Math.hypot(rootLocalTarget.x, rootLocalTarget.z);
		const rootUpRadians = Math.atan2(rootLocalTarget.y - 1.55, rootHorizontalDistance);
		desiredHeadX = THREE.MathUtils.clamp(-rootSideRadians, -HEAD_LOOK_X_LIMIT, HEAD_LOOK_X_LIMIT);
		desiredHeadZ = THREE.MathUtils.clamp(-rootUpRadians, -HEAD_LOOK_Z_LIMIT, HEAD_LOOK_Z_LIMIT);

		horizontalEye = THREE.MathUtils.clamp((rootSideRadians / HEAD_LOOK_X_LIMIT) * EYE_HORIZONTAL_GAIN, -1, 1);
		verticalEye = THREE.MathUtils.clamp((rootUpRadians / HEAD_LOOK_Z_LIMIT) * EYE_VERTICAL_GAIN, -1, 1);
	}

	return { desiredHeadX, desiredHeadZ, horizontalEye, verticalEye };
}

function snapNpcGaze(npc: NpcInstance) {
	const gaze = desiredNpcGaze(npc);
	npc.gaze.currentHeadX = gaze.desiredHeadX;
	npc.gaze.currentHeadZ = gaze.desiredHeadZ;
	applyNpcEyeMorphs(npc, gaze.horizontalEye, gaze.verticalEye);
}

function setEyeMorph(npc: NpcInstance, key: string, targetValue: number) {
	const index = npc.gaze.morphIndices.get(key);
	const influences = npc.gaze.eyeMesh?.morphTargetInfluences;
	if (index === undefined || !influences) {
		return;
	}
	influences[index] = targetValue;
}

function applyNpcEyeMorphs(npc: NpcInstance, horizontalEye: number, verticalEye: number) {
	setEyeMorph(npc, "AK_11", verticalEye < 0 ? -verticalEye : 0);
	setEyeMorph(npc, "AK_12", verticalEye < 0 ? -verticalEye : 0);
	setEyeMorph(npc, "AK_17", verticalEye > 0 ? verticalEye : 0);
	setEyeMorph(npc, "AK_18", verticalEye > 0 ? verticalEye : 0);
	setEyeMorph(npc, "AK_15", horizontalEye > 0 ? horizontalEye : 0);
	setEyeMorph(npc, "AK_14", horizontalEye > 0 ? horizontalEye : 0);
	setEyeMorph(npc, "AK_13", horizontalEye < 0 ? -horizontalEye : 0);
	setEyeMorph(npc, "AK_16", horizontalEye < 0 ? -horizontalEye : 0);
}

function applyNpcGaze(npc: NpcInstance, deltaTime: number) {
	const gaze = npc.gaze;
	const { desiredHeadX, desiredHeadZ, horizontalEye, verticalEye } = desiredNpcGaze(npc);

	const headBlend = blendFactor(deltaTime, HEAD_BLEND_SECONDS);
	gaze.currentHeadX = THREE.MathUtils.lerp(gaze.currentHeadX, desiredHeadX, headBlend);
	gaze.currentHeadZ = THREE.MathUtils.lerp(gaze.currentHeadZ, desiredHeadZ, headBlend);

	if (gaze.headBone && HEAD_INCLINATION_SCALE !== 0) {
		const nextOffset = new THREE.Quaternion().setFromEuler(
			new THREE.Euler(
				gaze.currentHeadX * HEAD_INCLINATION_SCALE,
				0,
				gaze.currentHeadZ * HEAD_INCLINATION_SCALE,
				"XYZ",
			),
		);
		if (!npc.action && !npc.idleAction) {
			gaze.headBone.quaternion.copy(gaze.baseHeadQuaternion);
		}
		gaze.headBone.quaternion.multiply(nextOffset);
	}

	applyNpcEyeMorphs(npc, horizontalEye, verticalEye);
}

function updateNpcGazes(deltaTime: number) {
	for (const npc of npcs) {
		applyNpcGaze(npc, deltaTime);
	}
}

function updateSequences() {
	for (let i = activeSequences.length - 1; i >= 0; i -= 1) {
		const sequence = activeSequences[i];
		const elapsed = clock.elapsedTime - sequence.startedAt;
		while (
			sequence.nextEventIndex < sequence.events.length &&
			sequence.events[sequence.nextEventIndex].at <= elapsed
		) {
			const event = sequence.events[sequence.nextEventIndex];
			sequence.nextEventIndex += 1;
			void runSequenceEvent(sequence.definition, event).catch((error) => {
				setConsoleLog(`Sequence "${sequence.name}" failed: ${String(error)}`);
			});
		}
		if (sequence.nextEventIndex >= sequence.events.length) {
			activeSequences.splice(i, 1);
		}
	}
}

async function runConsoleCommand(rawCommand: string) {
	const command = rawCommand.trim();
	if (!command) {
		return;
	}

	const [name, ...args] = command.split(/\s+/);
	switch (name) {
		case "add-model": {
			if (args.length !== 1) {
				setConsoleLog("Usage: add-model [name]");
				return;
			}
			setConsoleLog(`Loading ${args[0]}...`);
			await addModel(args[0]);
			return;
		}
		case "animation-browser": {
			if (args.length > 1) {
				setConsoleLog("Usage: animation-browser [on|off|toggle]");
				return;
			}
			const mode = args[0] ?? "toggle";
			if (!["off", "on", "toggle"].includes(mode)) {
				setConsoleLog("Usage: animation-browser [on|off|toggle]");
				return;
			}
			setAnimationBrowserOpen(mode === "toggle" ? !animationBrowserOpen : mode === "on");
			setConsoleLog(`Animation browser ${animationBrowserOpen ? "enabled" : "disabled"}.`);
			return;
		}
		case "help": {
			setConsoleLog(formatCommandHelp());
			return;
		}
		case "lighting": {
			if (args.length !== 1) {
				setConsoleLog(
					`Usage: lighting [ambient]. Current: ${ambientLight.intensity.toFixed(2)}`,
				);
				return;
			}
			const ambient = parseNumber(args[0]);
			if (ambient === null || ambient < 0) {
				setConsoleLog("Ambient light must be a non-negative number.");
				return;
			}
			ambientLight.intensity = ambient;
			setConsoleLog(`Ambient lighting set to ${ambient.toFixed(2)}.`);
			return;
		}
		case "loop-animation": {
			if (args.length !== 1) {
				setConsoleLog("Usage: loop-animation [animation]");
				return;
			}
			await playAnimationOnNpcs(args[0], true);
			return;
		}
		case "npc-fill": {
			if (args.length !== 1) {
				setConsoleLog(`Usage: npc-fill [intensity]. Current: ${npcFillIntensity.toFixed(2)}`);
				return;
			}
			const intensity = parseNumber(args[0]);
			if (intensity === null || intensity < 0) {
				setConsoleLog("NPC fill intensity must be a non-negative number.");
				return;
			}
			setNpcFillIntensity(intensity);
			setConsoleLog(`NPC fill set to ${intensity.toFixed(2)}.`);
			return;
		}
		case "play-animation": {
			if (args.length !== 1) {
				setConsoleLog("Usage: play-animation [animation]");
				return;
			}
			await playAnimationOnNpcs(args[0], false);
			return;
		}
		case "play-sequence": {
			if (args.length !== 1) {
				setConsoleLog("Usage: play-sequence [sequence]");
				return;
			}
			try {
				await playSequence(args[0]);
			} catch (error) {
				setConsoleLog(`Could not play sequence "${args[0]}": ${String(error)}`);
			}
			return;
		}
		case "say-talkfile": {
			if (args.length !== 1) {
				setConsoleLog("Usage: say-talkfile [talkfile]");
				return;
			}
			const npc = nearestNpcToPlayer();
			if (!npc) {
				setConsoleLog("No visible NPCs in scene. Add one with add-model [name].");
				return;
			}
			try {
				await playTalkfileOnNpc(npc, args[0]);
			} catch (error) {
				setConsoleLog(`Could not play talkfile "${args[0]}": ${String(error)}`);
			}
			return;
		}
		case "show-position": {
			if (args.length !== 0) {
				setConsoleLog("Usage: show-position");
				return;
			}
			setPositionVisible(true);
			setConsoleLog("Position display enabled.");
			return;
		}
		case "hide-position": {
			if (args.length !== 0) {
				setConsoleLog("Usage: hide-position");
				return;
			}
			setPositionVisible(false);
			setConsoleLog("Position display hidden.");
			return;
		}
		case "stop-animations": {
			stopAnimations();
			setConsoleLog(`Stopped animations on ${npcs.length} NPC(s).`);
			return;
		}
		case "teleport": {
			if (args.length !== 2) {
				setConsoleLog("Usage: teleport [x] [y]");
				return;
			}
			const x = parseNumber(args[0]);
			const y = parseNumber(args[1]);
			if (x === null || y === null) {
				setConsoleLog("Teleport coordinates must be numbers.");
				return;
			}
			const feet = feetPosition();
			placePlayer(new THREE.Vector3(x, feet.y, y));
			setConsoleLog(`Teleported to ${x.toFixed(2)}, ${y.toFixed(2)}.`);
			return;
		}
		default:
			setConsoleLog(`Unknown command "${name}".`);
	}
}

function resizeRenderer() {
	const width = window.innerWidth;
	const height = window.innerHeight;
	renderer.setSize(width, height, false);
	camera.aspect = width / height;
	camera.updateProjectionMatrix();
}

function floorYAt(x: number, z: number, fallbackY: number) {
	floorRaycaster.set(
		new THREE.Vector3(x, fallbackY + FLOOR_RAY_START_HEIGHT, z),
		new THREE.Vector3(0, -1, 0),
	);
	floorRaycaster.far = FLOOR_RAY_DISTANCE;

	const hits = floorRaycaster.intersectObjects(levelMeshes, false);
	let highestY: number | null = null;
	for (const hit of hits) {
		if (!isFloorPlacementSurface(hit.object)) {
			continue;
		}
		const normal = hit.face?.normal.clone();
		if (!normal) {
			continue;
		}
		normal.transformDirection(hit.object.matrixWorld);
		if (normal.y > 0.55 && (highestY === null || hit.point.y > highestY)) {
			highestY = hit.point.y;
		}
	}

	return highestY ?? fallbackY;
}

function feetPosition() {
	return new THREE.Vector3(
		playerCollider.start.x,
		playerCollider.start.y - PLAYER_RADIUS,
		playerCollider.start.z,
	);
}

function setPlayerFromFeet(feet: THREE.Vector3, height = currentHeight) {
	playerCollider.start.set(feet.x, feet.y + PLAYER_RADIUS, feet.z);
	playerCollider.end.set(feet.x, feet.y + height - PLAYER_RADIUS, feet.z);
}

function resetPlayer() {
	currentHeight = STAND_HEIGHT;
	currentEye = STAND_EYE;
	placePlayer(spawnFeet);
	playerVelocity.set(0, 0, 0);
	camera.rotation.set(0, 0, 0);
	jumpQueued = false;
	jumpQueuedAt = -Infinity;
	lastFloorTime = clock.elapsedTime;
}

function updateCrouch(deltaTime: number) {
	const crouching = keyStates.get("KeyC") === true;
	const targetHeight = crouching ? CROUCH_HEIGHT : STAND_HEIGHT;
	const targetEye = crouching ? CROUCH_EYE : STAND_EYE;
	currentHeight = THREE.MathUtils.damp(currentHeight, targetHeight, 18, deltaTime);
	currentEye = THREE.MathUtils.damp(currentEye, targetEye, 18, deltaTime);

	const feet = feetPosition();
	setPlayerFromFeet(feet, currentHeight);
	playerCollisions();
}

function getForwardVector() {
	camera.getWorldDirection(playerDirection);
	playerDirection.y = 0;
	playerDirection.normalize();
	return playerDirection;
}

function getSideVector() {
	camera.getWorldDirection(playerDirection);
	playerDirection.y = 0;
	playerDirection.normalize();
	playerDirection.cross(camera.up);
	return playerDirection;
}

function isCoarsePointer() {
	return window.matchMedia("(pointer: coarse)").matches;
}

function updateTouchStickThumb() {
	const radius = 39;
	touchStickThumb.style.transform = `translate(calc(-50% + ${touchMove.x * radius}px), calc(-50% + ${touchMove.y * radius}px))`;
}

function resetTouchMove(pointerId: number | null = touchMove.pointerId) {
	if (pointerId !== null && touchMove.pointerId !== pointerId) {
		return;
	}
	touchMove.active = false;
	touchMove.pointerId = null;
	touchMove.x = 0;
	touchMove.y = 0;
	updateTouchStickThumb();
}

function setTouchMoveFromPointer(event: PointerEvent) {
	const dx = event.clientX - touchMove.centerX;
	const dy = event.clientY - touchMove.centerY;
	const radius = Math.max(1, touchStick.clientWidth * 0.5 - touchStickThumb.clientWidth * 0.5);
	const distance = Math.hypot(dx, dy);
	const scale = distance > radius ? radius / distance : 1;
	touchMove.x = (dx * scale) / radius;
	touchMove.y = (dy * scale) / radius;
	updateTouchStickThumb();
}

function applyTouchLook(dx: number, dy: number) {
	if (playerViewLocked || !gameStarted || simulationPaused) {
		return;
	}
	camera.rotation.y -= dx * TOUCH_LOOK_SENSITIVITY;
	camera.rotation.x -= dy * TOUCH_LOOK_SENSITIVITY;
	camera.rotation.x = THREE.MathUtils.clamp(camera.rotation.x, -Math.PI / 2, Math.PI / 2);
}

function controls(deltaTime: number) {
	desiredMove.set(0, 0, 0);
	if (playerMovementLocked) {
		playerVelocity.x = 0;
		playerVelocity.z = 0;
		jumpQueued = false;
		return;
	}
	if (keyStates.get("KeyW")) {
		desiredMove.add(getForwardVector());
	}
	if (keyStates.get("KeyS")) {
		desiredMove.add(getForwardVector().multiplyScalar(-1));
	}
	if (keyStates.get("KeyA")) {
		desiredMove.add(getSideVector().multiplyScalar(-1));
	}
	if (keyStates.get("KeyD")) {
		desiredMove.add(getSideVector());
	}
	if (touchMove.active && Math.hypot(touchMove.x, touchMove.y) > 0.08) {
		desiredMove
			.add(getForwardVector().multiplyScalar(-touchMove.y))
			.add(getSideVector().multiplyScalar(touchMove.x));
	}

	const moveSpeed = keyStates.get("KeyC")
		? CROUCH_SPEED
		: keyStates.get("ShiftLeft") || keyStates.get("ShiftRight")
			? SPRINT_SPEED
			: WALK_SPEED;
	if (desiredMove.lengthSq() > 0) {
		desiredMove.normalize().multiplyScalar(moveSpeed);
	}

	const acceleration = playerOnFloor ? GROUND_ACCELERATION : AIR_ACCELERATION;
	const blend = 1 - Math.exp(-acceleration * deltaTime);
	playerVelocity.x = THREE.MathUtils.lerp(playerVelocity.x, desiredMove.x, blend);
	playerVelocity.z = THREE.MathUtils.lerp(playerVelocity.z, desiredMove.z, blend);

	if (
		playerOnFloor &&
		desiredMove.lengthSq() === 0 &&
		Math.hypot(playerVelocity.x, playerVelocity.z) < STOP_EPSILON
	) {
		playerVelocity.x = 0;
		playerVelocity.z = 0;
	}

	if (jumpQueued && clock.elapsedTime - jumpQueuedAt > JUMP_GRACE_SECONDS) {
		jumpQueued = false;
	}
	if (
		jumpQueued &&
		clock.elapsedTime - jumpQueuedAt <= JUMP_GRACE_SECONDS &&
		clock.elapsedTime - lastFloorTime <= JUMP_GRACE_SECONDS
	) {
		playerVelocity.y = JUMP_SPEED;
		playerOnFloor = false;
		jumpQueued = false;
	}
}

function playerCollisions() {
	playerOnFloor = false;

	for (let i = 0; i < COLLISION_PASSES; i += 1) {
		const result = worldOctree.capsuleIntersect(playerCollider);
		if (!result) {
			break;
		}

		playerOnFloor = result.normal.y > 0;
		if (playerOnFloor) {
			lastFloorTime = clock.elapsedTime;
			if (playerVelocity.y < 0) {
				playerVelocity.y = 0;
			}
		}
		if (!playerOnFloor) {
			playerVelocity.addScaledVector(result.normal, -result.normal.dot(playerVelocity));
		}
		playerCollider.translate(result.normal.multiplyScalar(result.depth));
	}

	for (let i = 0; i < COLLISION_PASSES; i += 1) {
		collidePlayerWithChairs();
		collidePlayerWithCylinders(staticCylinders);
		collidePlayerWithBoxes();
	}
}

function updatePlayer(deltaTime: number) {
	if (!playerOnFloor) {
		playerVelocity.y -= GRAVITY * deltaTime;
	} else if (playerVelocity.y < 0) {
		playerVelocity.y = 0;
	}

	const deltaPosition = playerVelocity.clone().multiplyScalar(deltaTime);
	playerCollider.translate(deltaPosition);
	playerCollisions();
	updateCrouch(deltaTime);

	const feet = feetPosition();
	camera.position.set(feet.x, feet.y + currentEye, feet.z);

	if (camera.position.y < TELEPORT_FLOOR) {
		resetPlayer();
	}
}

function animate(now = 0) {
	if (lastRenderMs > 0 && now - lastRenderMs < FRAME_INTERVAL_MS - 0.5) {
		requestAnimationFrame(animate);
		return;
	}
	lastRenderMs = now;
	const rawDeltaTime = clock.getDelta();
	if (simulationPaused) {
		clock.elapsedTime -= rawDeltaTime;
	}
	const deltaTime = simulationPaused ? 0 : Math.min(0.05, rawDeltaTime);
	const stepTime = deltaTime / PHYSICS_STEPS;
	wallDepthPlayerPosition.copy(camera.position);

	if (levelReady) {
		if (!simulationPaused) {
				for (let i = 0; i < PHYSICS_STEPS; i += 1) {
					if (!consoleOpen && gameStarted) {
						controls(stepTime);
					}
					updatePlayer(stepTime);
			}
			updateSequences();
			updateNpcWalks(deltaTime);
			updateNpcTurns(deltaTime);
			for (const npc of npcs) {
				npc.mixer.update(deltaTime);
			}
				updateActiveTalks(deltaTime);
				updateNpcGazes(deltaTime);
					updatePositionLine();
				updateInteractionFocus();
				updateNpcInteractionOutlines();
			}
	}

	renderer.render(scene, camera);
	requestAnimationFrame(animate);
}

function setupEvents() {
	window.addEventListener("resize", resizeRenderer);
	entryScreen.addEventListener("click", (event) => {
		if ((event.target as Element | null)?.closest("a")) {
			return;
		}
		enterMainMenuFromEntryScreen();
	});
	startGameButton.addEventListener("click", startGame);

	document.addEventListener("keydown", (event) => {
		if (!entryScreen.hidden) {
			if ((event.code === "Enter" || event.code === "Space") && !(event.target as Element | null)?.closest("a")) {
				event.preventDefault();
				enterMainMenuFromEntryScreen();
			}
			return;
		}
		if (simulationPaused && !consoleOpen && mainMenu.hidden) {
			event.preventDefault();
			return;
		}
		if (event.code === "Backquote") {
			event.preventDefault();
			setConsoleOpen(!consoleOpen);
			return;
		}
		if (consoleOpen) {
			if (event.code === "Escape") {
				event.preventDefault();
				setConsoleOpen(false);
			}
			return;
		}

		keyStates.set(event.code, true);
		if (event.code === "Space" && !event.repeat) {
			jumpQueued = true;
			jumpQueuedAt = clock.elapsedTime;
		}
		if (event.code === "KeyE" && !event.repeat) {
			interact();
		}
		if (["KeyW", "KeyA", "KeyS", "KeyD", "Space", "KeyC", "KeyE"].includes(event.code)) {
			event.preventDefault();
		}
	});

	document.addEventListener("keyup", (event) => {
		keyStates.set(event.code, false);
	});

	document.addEventListener("mousemove", (event) => {
		if (document.pointerLockElement !== canvas || playerViewLocked) {
			return;
		}

		camera.rotation.y -= event.movementX * 0.0022;
		camera.rotation.x -= event.movementY * 0.0022;
		camera.rotation.x = THREE.MathUtils.clamp(camera.rotation.x, -Math.PI / 2, Math.PI / 2);
	});

	canvas.addEventListener("click", () => {
		if (!levelReady || !gameStarted || consoleOpen || simulationPaused) {
			return;
		}
		if (document.pointerLockElement === canvas) {
			interact();
		} else {
			canvas.requestPointerLock();
		}
	});

	document.addEventListener("pointerlockchange", () => {
		updatePromptVisibility();
		updateInteractionFocus();
	});

	touchStick.addEventListener("pointerdown", (event) => {
		if (!gameStarted || simulationPaused || consoleOpen) {
			return;
		}
		event.preventDefault();
		const bounds = touchStick.getBoundingClientRect();
		touchMove.active = true;
		touchMove.pointerId = event.pointerId;
		touchMove.centerX = bounds.left + bounds.width * 0.5;
		touchMove.centerY = bounds.top + bounds.height * 0.5;
		touchStick.setPointerCapture(event.pointerId);
		setTouchMoveFromPointer(event);
	});

	touchStick.addEventListener("pointermove", (event) => {
		if (touchMove.pointerId !== event.pointerId) {
			return;
		}
		event.preventDefault();
		setTouchMoveFromPointer(event);
		});

		const endTouchMove = (event: PointerEvent) => {
			resetTouchMove(event.pointerId);
		};
		touchStick.addEventListener("pointerup", endTouchMove);
		touchStick.addEventListener("pointercancel", endTouchMove);
		touchStick.addEventListener("lostpointercapture", endTouchMove);

	touchLookZone.addEventListener("pointerdown", (event) => {
		if (!gameStarted || simulationPaused || consoleOpen || touchLook.pointerId !== null) {
			return;
		}
		event.preventDefault();
		touchLook.pointerId = event.pointerId;
		touchLook.lastX = event.clientX;
		touchLook.lastY = event.clientY;
		touchLookZone.setPointerCapture(event.pointerId);
	});

	touchLookZone.addEventListener("pointermove", (event) => {
		if (touchLook.pointerId !== event.pointerId) {
			return;
		}
		event.preventDefault();
		applyTouchLook(event.clientX - touchLook.lastX, event.clientY - touchLook.lastY);
		touchLook.lastX = event.clientX;
		touchLook.lastY = event.clientY;
	});

	const endTouchLook = (event: PointerEvent) => {
		if (touchLook.pointerId === event.pointerId) {
			touchLook.pointerId = null;
		}
	};
	touchLookZone.addEventListener("pointerup", endTouchLook);
	touchLookZone.addEventListener("pointercancel", endTouchLook);

	touchInteract.addEventListener("pointerdown", (event) => {
		if (!gameStarted || simulationPaused || consoleOpen) {
			return;
		}
		event.preventDefault();
		interact();
	});

	imageOverlay.addEventListener("mousemove", (event) => {
		const point = imageOverlayCoordinates(event);
		const clickable =
			(nextflixDesktopState === "winded" && isNextflixHotspot(point)) ||
			(nextflixDesktopState === "winded-with-sleck" && (isNextflixHotspot(point) || isSleckHotspot(point))) ||
			(nextflixDesktopState === "selection" && nextflixVideoIndexAt(point) !== null);
		imageOverlay.style.cursor = clickable ? "pointer" : "";
	});

	imageOverlay.addEventListener("click", (event) => {
		if (nextflixDesktopState === "video" || nextflixDesktopState === "later" || nextflixDesktopState === "sleck") {
			return;
		}
		const point = imageOverlayCoordinates(event);
		if (nextflixDesktopState === "winded") {
			if (isNextflixHotspot(point)) {
				nextflixDesktopState = "selection";
				nextflixVideoReturn = "later";
				imageOverlayImage.src = NEXTFLIX_DESKTOP_IMAGES.selection;
				imageOverlay.style.cursor = "";
			}
			return;
		}
		if (nextflixDesktopState === "winded-with-sleck") {
			if (isNextflixHotspot(point)) {
				nextflixDesktopState = "selection";
				nextflixVideoReturn = "winded-with-sleck";
				imageOverlayImage.src = NEXTFLIX_DESKTOP_IMAGES.selection;
				imageOverlay.style.cursor = "";
				return;
			}
			if (isSleckHotspot(point)) {
				imageOverlay.style.cursor = "";
				showSleckMessages();
			}
			return;
		}
		if (nextflixDesktopState === "selection") {
			const index = nextflixVideoIndexAt(point);
			if (index !== null) {
				playNextflixVideo(index, nextflixVideoReturn);
			}
		}
	});

	imageOverlayVideo.addEventListener("ended", finishNextflixVideo);

	consoleInput.addEventListener("keydown", (event) => {
		if (event.code === "Tab") {
			event.preventDefault();
			completeConsoleInput();
		}
		if (event.code === "Enter") {
			event.preventDefault();
			void runConsoleCommand(consoleInput.value);
			consoleInput.value = "";
		}
		if (event.code === "Escape") {
			event.preventDefault();
			setConsoleOpen(false);
		}
	});

	animationBrowserClose.addEventListener("click", () => {
		setAnimationBrowserOpen(false);
	});

	femaleAnimationSearch.addEventListener("input", renderAnimationBrowser);
	maleAnimationSearch.addEventListener("input", renderAnimationBrowser);
}

async function loadLevel() {
	await loadAnimationManifest();
	await preloadCoreAnimations();
	renderAnimationBrowser();
	const bakedNpcNavGridPromise = loadBakedNpcNavGrid();

	const { loader, dracoLoader } = createGltfLoader();
	const gltf = await loader.loadAsync("/assets/base-map.glb");
	dracoLoader.dispose();
	const level = gltf.scene;
	level.updateWorldMatrix(true, true);
	const chairMeshes = collectMeshes(level, isChairMarker);
	const cylinderMeshes = collectMeshes(level, isStaticCylinderMarker);
	const boxMeshes = collectMeshes(level, isStaticBoxMarker);
	const instancedChairMeshes = createStaticInstancedMeshes(chairMeshes, CHAIR_PREFIX);
	const instancedCylinderMeshes = createStaticInstancedMeshes(cylinderMeshes, STATIC_CYLINDER_PREFIX);
	const instancedBoxMeshes = createStaticInstancedMeshes(boxMeshes, STATIC_BOX_PREFIX);

	for (const chairMesh of chairMeshes) {
		chairs.push(...createChairColliders(chairMesh));
		removeObjectFromParent(chairMesh);
	}
	for (const cylinderMesh of cylinderMeshes) {
		staticCylinders.push(...createStaticCylinderColliders(cylinderMesh));
		registerStaticInteractionTarget(cylinderMesh);
		removeObjectFromParent(cylinderMesh);
	}
	for (const boxMesh of boxMeshes) {
		staticBoxes.push(...createStaticBoxColliders(boxMesh));
		registerStaticInteractionTarget(boxMesh);
		removeObjectFromParent(boxMesh);
	}

	level.traverse((object) => {
		if ((object as THREE.Mesh).isMesh) {
			const mesh = object as THREE.Mesh;
			const isDynamicMarker = isDynamicLevelMarker(mesh);
			if (!isDynamicMarker) {
				levelMeshes.push(mesh);
				}
					mesh.castShadow = !shouldPassOverheadShadow(mesh);
					mesh.receiveShadow = true;
					applyWallDepthMaterial(mesh);
					applyProceduralSurfaceMaterials(mesh);
					if (!isDynamicMarker) {
				if (Array.isArray(mesh.material)) {
					for (const material of mesh.material) {
						material.side = THREE.FrontSide;
					}
				} else {
					mesh.material.side = THREE.FrontSide;
				}
			}
		}
	});

	npcNavGrid = await bakedNpcNavGridPromise ?? createNpcNavGrid();

	scene.add(level);
	for (const chairMesh of instancedChairMeshes) {
		scene.add(chairMesh);
	}
	for (const cylinderMesh of instancedCylinderMeshes) {
		scene.add(cylinderMesh);
	}
	for (const boxMesh of instancedBoxMeshes) {
		scene.add(boxMesh);
	}
	worldOctree.fromGraphNode(createStaticCollisionRoot(level));
	resetPlayer();
	levelReady = true;
	loading.hidden = true;
	prompt.hidden = true;
	setStatus(DEFAULT_STATUS_TEXT);
	setMainMenuLoadingState(true);
}

resizeRenderer();
setupEvents();
preloadMainMenuMedia();
animate();

loadLevel().catch((error) => {
	console.error(error);
	loading.textContent = "Could not load /assets/base-map.glb. Check the Worker static assets.";
	setMainMenuLoadingState(false, "Could not load game assets.");
	setStatus("Level load failed");
});
