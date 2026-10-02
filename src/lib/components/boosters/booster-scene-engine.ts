import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import type { BoosterVisual } from './booster-visuals';

/** Rendering only: the acquisition controller and the DOM timeline own every decision. */
export function createBoosterScene(
	canvas: HTMLCanvasElement,
	options: {
		artwork: string;
		back: string;
		visual: BoosterVisual;
		onFallback: () => void;
		onReady: () => void;
	}
) {
	const renderer = new THREE.WebGLRenderer({
		canvas,
		alpha: true,
		antialias: navigator.hardwareConcurrency > 4,
		powerPreference: 'low-power'
	});
	renderer.setPixelRatio(
		Math.min(window.devicePixelRatio, navigator.hardwareConcurrency <= 4 ? 1 : 1.5)
	);
	renderer.outputColorSpace = THREE.SRGBColorSpace;
	renderer.toneMapping = THREE.ACESFilmicToneMapping;
	const scene = new THREE.Scene();
	const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 40);
	camera.position.set(0, 0.1, 7.6);
	const pmrem = new THREE.PMREMGenerator(renderer);
	const room = new RoomEnvironment();
	const environment = pmrem.fromScene(room);
	scene.environment = environment.texture;
	scene.environmentIntensity = 0.65;
	room.dispose();
	pmrem.dispose();
	const key = new THREE.DirectionalLight('#ffffff', 2);
	key.position.set(-3, 3, 5);
	scene.add(key);
	const rim = new THREE.PointLight('#e8ef42', 3, 12);
	rim.position.set(2, 1, 3);
	scene.add(rim);
	const pack = new THREE.Group();
	scene.add(pack);
	const textures: THREE.Texture[] = [];
	const images: HTMLImageElement[] = [];
	let disposed = false;
	const foil = new THREE.MeshPhysicalMaterial({
		color: '#ffffff',
		metalness: options.visual === 'signal' ? 0 : 0.62,
		roughness: options.visual === 'signal' ? 1 : 0.42,
		clearcoat: options.visual === 'prism' ? 0.8 : 0,
		envMapIntensity: options.visual === 'signal' ? 0.15 : 1,
		iridescence: options.visual === 'prism' ? 0.3 : 0,
		side: THREE.DoubleSide
	});
	const deckMaterial = new THREE.MeshStandardMaterial({
		color: '#ffffff',
		roughness: 0.6,
		side: THREE.DoubleSide
	});
	function texture(svg: string, material: THREE.MeshStandardMaterial) {
		const image = new Image();
		images.push(image);
		image.onload = () => {
			if (disposed) return;
			const map = new THREE.Texture(image);
			map.colorSpace = THREE.SRGBColorSpace;
			map.needsUpdate = true;
			textures.push(map);
			material.map = map;
			material.needsUpdate = true;
			draw();
			if (material === foil) options.onReady();
		};
		image.onerror = () => {
			if (!disposed) options.onFallback();
		};
		image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
	}
	texture(options.artwork, foil);
	texture(options.back, deckMaterial);
	const hull = new THREE.MeshStandardMaterial({
		color: '#363a30',
		metalness: 0.65,
		roughness: 0.3
	});
	const openFace = new THREE.MeshBasicMaterial({
		transparent: true,
		opacity: 0,
		depthWrite: false
	});
	// The wrapper's curved print is its front. A second box front intersects every crease.
	const sides = new THREE.Mesh(new THREE.BoxGeometry(2.24, 3.22, 0.13), [
		hull,
		hull,
		hull,
		hull,
		openFace,
		hull
	]);
	pack.add(sides);
	function half(sign: number) {
		const geometry = new THREE.PlaneGeometry(1.12, 3.16, 22, 28);
		const uv = geometry.attributes.uv;
		for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) * 0.5 + (sign > 0 ? 0.5 : 0));
		const positions = geometry.attributes.position;
		for (let i = 0; i < positions.count; i++)
			positions.setZ(
				i,
				0.008 *
					Math.sin(positions.getY(i) * 4) *
					Math.pow((sign * positions.getX(i) + 0.56) / 1.12, 6)
			);
		geometry.computeVertexNormals();
		const mesh = new THREE.Mesh(geometry, foil);
		mesh.position.set(sign * 0.56, 0, 0.12);
		pack.add(mesh);
		return { mesh, geometry, source: positions.array.slice() as Float32Array, sign };
	}
	const halves = [half(-1), half(1)];
	const stripGeometry = new THREE.PlaneGeometry(2.24, 0.18, 28, 2);
	const stripSource = stripGeometry.attributes.position.array.slice() as Float32Array;
	const strip = new THREE.Mesh(
		stripGeometry,
		new THREE.MeshPhysicalMaterial({
			color: '#e8ef42',
			metalness: 0.5,
			roughness: 0.3,
			side: THREE.DoubleSide
		})
	);
	strip.position.set(0, 1.54, 0.1);
	pack.add(strip);
	const deck = new THREE.Group();
	scene.add(deck);
	deck.visible = false;
	for (let i = 0; i < 5; i++) {
		const card = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 2.16), deckMaterial);
		card.position.z = i * 0.025;
		deck.add(card);
	}
	let progress = 0,
		tiltX = 0,
		tiltY = -0.15;
	const ease = (start: number, end: number) => THREE.MathUtils.smoothstep(progress, start, end);
	function draw() {
		if (!disposed && !document.hidden) renderer.render(scene, camera);
	}
	function update(next: number, x = tiltX, y = tiltY) {
		if (disposed) return;
		progress = next;
		tiltX = x;
		tiltY = y;
		const tear = ease(0.23, 0.5),
			release = ease(0.5, 0.74),
			away = ease(0.7, 1);
		pack.rotation.set(
			tiltX + Math.sin(progress * Math.PI * 2) * 0.08,
			tiltY + tear * 0.18,
			-tear * 0.07
		);
		pack.position.set(0, -away * 2, -ease(0, 0.22) * 0.3);
		pack.scale.setScalar(1 - away * 0.25);
		sides.visible = tear < 0.4;
		for (const { mesh, geometry, source, sign } of halves) {
			mesh.position.x = sign * (0.56 + tear * 0.8);
			mesh.rotation.y = sign * tear * 1.18;
			const vertices = geometry.attributes.position;
			for (let i = 0; i < vertices.count; i++) {
				const sx = source[i * 3],
					sy = source[i * 3 + 1];
				vertices.setXYZ(
					i,
					sx,
					sy - tear * Math.pow(Math.abs(sx) / 0.56, 2) * 0.35,
					source[i * 3 + 2] + tear * Math.sin((sx * sign + 0.56) * 2.2) * 0.65
				);
			}
			vertices.needsUpdate = true;
			geometry.computeVertexNormals();
		}
		strip.position.set(tear * 1.8, 1.54 + tear * 0.7, 0.1 + tear * 0.6);
		strip.rotation.z = -tear * 1.05;
		const sv = stripGeometry.attributes.position;
		for (let i = 0; i < sv.count; i++)
			sv.setZ(i, stripSource[i * 3 + 2] + tear * Math.sin(stripSource[i * 3] * 3) * 0.35);
		sv.needsUpdate = true;
		stripGeometry.computeVertexNormals();
		deck.visible = progress >= 0.5 && progress < 1;
		deck.position.set(0, release * 0.28, 0.15 + release * 1.7);
		deck.children.forEach((card, i) => {
			card.rotation.z = (i - 2) * release * 0.07;
			card.position.x = (i - 2) * release * 0.09;
		});
		const deckViewHeight =
			2 *
			Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) *
			(camera.position.z - deck.position.z);
		deck.scale.setScalar(
			Math.min(1, (144 * deckViewHeight) / Math.max(1, canvas.clientHeight) / 1.5) *
				(1 - away * 0.2)
		);
		key.position.x = -3 + tear * 6;
		rim.intensity = 3 + Math.sin(tear * Math.PI) * 8;
		camera.position.z = 7.6 - ease(0, 0.23) * 0.3 + away * 0.5;
		draw();
	}
	const observer = new ResizeObserver(() => {
		const { width, height } = canvas.getBoundingClientRect();
		if (disposed || !width || !height) return;
		renderer.setSize(width, height, false);
		camera.aspect = width / height;
		camera.updateProjectionMatrix();
		draw();
	});
	observer.observe(canvas);
	const lost = (event: Event) => {
		event.preventDefault();
		options.onFallback();
	};
	canvas.addEventListener('webglcontextlost', lost);
	return {
		update,
		dispose() {
			if (disposed) return;
			disposed = true;
			observer.disconnect();
			canvas.removeEventListener('webglcontextlost', lost);
			images.forEach((image) => {
				image.onload = image.onerror = null;
			});
			scene.traverse((object) => {
				if (object instanceof THREE.Mesh) {
					object.geometry.dispose();
				}
			});
			foil.dispose();
			deckMaterial.dispose();
			hull.dispose();
			openFace.dispose();
			(strip.material as THREE.Material).dispose();
			textures.forEach((map) => map.dispose());
			environment.dispose();
			renderer.dispose();
			renderer.forceContextLoss();
		}
	};
}
