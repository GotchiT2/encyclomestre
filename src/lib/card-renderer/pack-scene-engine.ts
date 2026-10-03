import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { brandName, flamePath, wordmarkPath, wordmarkViewBox } from '../brand/artwork.js';

export type PackSceneOptions = {
	name: string;
	brand: string;
	image?: string;
	color: string;
	onComplete: () => void;
	onFallback: () => void;
};

/** Visual only: owns one GPU context and never calls the game API. */
export function createPackScene(canvas: HTMLCanvasElement, options: PackSceneOptions) {
	const lowPower =
		navigator.hardwareConcurrency <= 4 ||
		Number((navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8) <= 4;
	const renderer = new THREE.WebGLRenderer({
		canvas,
		alpha: true,
		antialias: !lowPower,
		powerPreference: 'low-power'
	});
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowPower ? 1 : 1.5));
	renderer.setClearColor(0x171918, 0);
	const scene = new THREE.Scene();
	const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 30);
	camera.position.set(0, 0.05, 7.3);
	const room = new RoomEnvironment();
	const environment = new THREE.PMREMGenerator(renderer);
	const environmentTarget = environment.fromScene(room, 0.04);
	scene.environment = environmentTarget.texture;
	room.dispose();
	environment.dispose();
	const key = new THREE.PointLight(0xffffff, 32);
	key.position.set(-2, 3, 4);
	scene.add(key, new THREE.AmbientLight(0xffffff, 2));
	const rim = new THREE.PointLight(options.color, 12);
	rim.position.set(2, -1, 3);
	scene.add(rim);
	const geometries: THREE.BufferGeometry[] = [];
	const materials: THREE.Material[] = [];
	const textures: THREE.Texture[] = [];
	const printed = document.createElement('canvas');
	printed.width = 512;
	printed.height = 768;
	const ctx = printed.getContext('2d')!;
	function print(image?: HTMLImageElement) {
		ctx.fillStyle = '#171918';
		ctx.fillRect(0, 0, 512, 768);
		ctx.fillStyle = options.color;
		ctx.fillRect(24, 20, 464, 54);
		ctx.fillStyle = '#171918';
		if (options.brand === brandName) {
			const height = Number(wordmarkViewBox.split(' ')[3]);
			ctx.save();
			ctx.translate(40, 30);
			ctx.scale(32 / height, 32 / height);
			ctx.fill(new Path2D(wordmarkPath));
			ctx.restore();
		} else {
			ctx.font = '900 32px "Barlow Condensed",sans-serif';
			ctx.fillText(options.brand.toUpperCase(), 40, 59);
		}
		if (image) {
			const scale = Math.max(464 / image.width, 445 / image.height);
			ctx.save();
			ctx.beginPath();
			ctx.rect(24, 92, 464, 445);
			ctx.clip();
			ctx.drawImage(
				image,
				256 - (image.width * scale) / 2,
				314 - (image.height * scale) / 2,
				image.width * scale,
				image.height * scale
			);
			ctx.restore();
		} else {
			ctx.strokeStyle = options.color;
			ctx.lineWidth = 2;
			for (let i = 0; i < 11; i++) {
				ctx.beginPath();
				ctx.moveTo(24, 120 + i * 35);
				ctx.lineTo(488, 240 + i * 24);
				ctx.stroke();
			}
			ctx.fillStyle = '#E8EF42';
			ctx.save();
			ctx.translate(142, 144);
			ctx.scale(1.2, 1.2);
			ctx.fill(new Path2D(flamePath));
			ctx.restore();
		}
		ctx.fillStyle = '#efebd9';
		ctx.fillRect(24, 558, 464, 178);
		ctx.fillStyle = '#171918';
		ctx.font = '900 52px "Barlow Condensed",sans-serif';
		const words = options.name.toUpperCase().split(/\s+/);
		let line = '',
			y = 610;
		for (const word of words) {
			const next = line ? `${line} ${word}` : word;
			if (ctx.measureText(next).width > 418 && line) {
				ctx.fillText(line, 42, y, 418);
				y += 49;
				line = word;
			} else line = next;
		}
		if (line) ctx.fillText(line, 42, Math.min(y, 714), 418);
	}
	print();
	const texture = new THREE.CanvasTexture(printed);
	texture.colorSpace = THREE.SRGBColorSpace;
	textures.push(texture);
	const foil = new THREE.MeshPhysicalMaterial({
		map: texture,
		metalness: 0.68,
		roughness: 0.32,
		clearcoat: lowPower ? 0 : 0.55,
		clearcoatRoughness: 0.24
	});
	const edge = new THREE.MeshStandardMaterial({
		color: options.color,
		metalness: 0.8,
		roughness: 0.28
	});
	materials.push(foil, edge);
	const pack = new THREE.Group();
	scene.add(pack);
	function half(side: number) {
		const group = new THREE.Group();
		group.position.x = side * 0.5;
		const box = new THREE.BoxGeometry(1, 2.92, 0.17);
		geometries.push(box);
		group.add(new THREE.Mesh(box, edge));
		const face = new THREE.PlaneGeometry(1, 2.92, 18, 24);
		geometries.push(face);
		const positions = face.attributes.position,
			uv = face.attributes.uv;
		for (let i = 0; i < positions.count; i++) {
			const x = positions.getX(i) + side * 0.5,
				y = positions.getY(i);
			positions.setZ(i, 0.026 * Math.sin(x * 19 + y * 7) + 0.012 * Math.sin(y * 24));
			uv.setX(i, uv.getX(i) * 0.5 + (side > 0 ? 0.5 : 0));
		}
		face.computeVertexNormals();
		const mesh = new THREE.Mesh(face, foil);
		mesh.position.z = 0.12;
		group.add(mesh);
		pack.add(group);
		return group;
	}
	const left = half(-1),
		right = half(1);
	const sealGeometry = new THREE.BoxGeometry(2.04, 0.22, 0.19);
	geometries.push(sealGeometry);
	const seal = new THREE.Mesh(sealGeometry, edge);
	seal.position.y = 1.57;
	pack.add(seal);
	const bottom = new THREE.Mesh(sealGeometry, edge);
	bottom.position.y = -1.57;
	pack.add(bottom);
	for (let i = 0; i < 27; i++) {
		const geometry = new THREE.BoxGeometry(0.022, 0.18, 0.008);
		geometries.push(geometry);
		const rib = new THREE.Mesh(geometry, edge);
		rib.position.set(-0.95 + i * 0.073, 1.57, 0.106);
		seal.add(rib);
		rib.position.y = 0;
	}
	const deck = new THREE.Group();
	deck.position.z = -0.18;
	deck.visible = false;
	scene.add(deck);
	const cardMaterial = new THREE.MeshStandardMaterial({ color: 0xefebd9, roughness: 0.65 });
	materials.push(cardMaterial);
	for (let i = 0; i < 4; i++) {
		const geometry = new THREE.BoxGeometry(1.17, 1.66, 0.017);
		geometries.push(geometry);
		const card = new THREE.Mesh(geometry, cardMaterial);
		card.position.set(i * 0.045, 0, -i * 0.025);
		deck.add(card);
	}
	let disposed = false,
		playing = false,
		played = false,
		start = 0,
		frame = 0,
		tiltX = 0,
		tiltY = -0.16;
	let lastTime = 0;
	function render(time = performance.now()) {
		if (disposed || document.hidden) {
			frame = 0;
			return;
		}
		frame = 0;
		const seconds = playing ? (time - start) / 1000 : 0;
		pack.rotation.y += (tiltY - pack.rotation.y) * 0.12;
		pack.rotation.x += (tiltX - pack.rotation.x) * 0.12;
		if (playing) {
			const tear = THREE.MathUtils.smoothstep(seconds, 0.65, 1.8);
			const release = THREE.MathUtils.smoothstep(seconds, 1.55, 2.9);
			const away = THREE.MathUtils.smoothstep(seconds, 2.4, 3.4);
			seal.position.set(tear * 1.1, 1.57 + tear * 0.85, tear * 0.2);
			seal.rotation.z = -tear * 1.1;
			left.position.x = -0.5 - tear * 0.48;
			right.position.x = 0.5 + tear * 0.48;
			left.rotation.y = -tear * 0.75;
			right.rotation.y = tear * 0.75;
			pack.position.y = -away * 2;
			pack.rotation.z = -away * 0.14;
			pack.scale.setScalar(1 - away * 0.23);
			deck.visible = seconds > 1.5;
			deck.position.set(0, release * 0.3, -0.18 + release * 1.4);
			deck.rotation.y = -0.12 * (1 - release);
			deck.children.forEach((card, i) => {
				card.rotation.z = (i - 1.5) * release * 0.085;
				card.position.x = (i - 1.5) * release * 0.22;
			});
			key.position.x = -2 + tear * 5;
			rim.intensity = 12 + Math.sin(Math.min(1, tear) * Math.PI) * 20;
			camera.position.z = 7.3 - THREE.MathUtils.smoothstep(seconds, 0, 0.65) * 0.5 + away * 0.6;
			if (seconds >= 3.4) {
				playing = false;
				options.onComplete();
			}
		}
		renderer.render(scene, camera);
		lastTime = time;
		if (
			playing ||
			Math.abs(pack.rotation.y - tiltY) > 0.003 ||
			Math.abs(pack.rotation.x - tiltX) > 0.003
		)
			frame = requestAnimationFrame(render);
	}
	function schedule() {
		if (!disposed && !frame && !document.hidden) frame = requestAnimationFrame(render);
	}
	const observer = new ResizeObserver(() => {
		if (disposed) return;
		const { width, height } = canvas.getBoundingClientRect();
		if (!width || !height) return;
		renderer.setSize(width, height, false);
		camera.aspect = width / height;
		camera.updateProjectionMatrix();
		schedule();
	});
	observer.observe(canvas);
	function visibility() {
		if (!document.hidden) {
			if (playing && lastTime) start += performance.now() - lastTime;
			schedule();
		}
	}
	document.addEventListener('visibilitychange', visibility);
	function lost(event: Event) {
		event.preventDefault();
		options.onFallback();
	}
	canvas.addEventListener('webglcontextlost', lost);
	let loadedImage: HTMLImageElement | undefined;
	if (options.image) {
		const image = new Image();
		image.crossOrigin = 'anonymous';
		image.onload = () => {
			if (!disposed) {
				try {
					print(image);
					loadedImage = image;
					texture.needsUpdate = true;
					schedule();
				} catch {
					/* Keep the printed wrapper when CORS forbids an illustration. */
				}
			}
		};
		image.src = options.image;
	}
	void document.fonts.ready.then(() => {
		if (!disposed) {
			print(loadedImage);
			texture.needsUpdate = true;
			schedule();
		}
	});
	schedule();
	return {
		play() {
			if (disposed || played) return;
			played = true;
			playing = true;
			start = performance.now();
			schedule();
		},
		tilt(x: number, y: number) {
			if (playing) return;
			tiltY = x * 0.25;
			tiltX = -y * 0.13;
			schedule();
		},
		dispose() {
			if (disposed) return;
			disposed = true;
			cancelAnimationFrame(frame);
			observer.disconnect();
			document.removeEventListener('visibilitychange', visibility);
			canvas.removeEventListener('webglcontextlost', lost);
			geometries.forEach((g) => g.dispose());
			materials.forEach((m) => m.dispose());
			textures.forEach((t) => t.dispose());
			environmentTarget.dispose();
			renderer.dispose();
			renderer.forceContextLoss();
		}
	};
}
