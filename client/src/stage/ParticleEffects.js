import * as THREE from 'three';

export class ParticleEffects {
  constructor(scene) {
    this.scene = scene;
    this.confettiParticles = [];
    this.heartParticles = [];
    this.fireworkParticles = [];

    this._initMaterials();
  }

  _initMaterials() {
    // Tạo texture trái tim bằng canvas
    const heartCanvas = document.createElement('canvas');
    heartCanvas.width = 64;
    heartCanvas.height = 64;
    const ctx = heartCanvas.getContext('2d');
    ctx.fillStyle = '#FF2D55';
    ctx.beginPath();
    // Vẽ icon trái tim
    ctx.moveTo(32, 20);
    ctx.bezierCurveTo(32, 12, 20, 8, 12, 16);
    ctx.bezierCurveTo(4, 24, 4, 38, 32, 58);
    ctx.bezierCurveTo(60, 38, 60, 24, 52, 16);
    ctx.bezierCurveTo(44, 8, 32, 12, 32, 20);
    ctx.fill();

    const heartTex = new THREE.CanvasTexture(heartCanvas);
    this.heartMaterial = new THREE.SpriteMaterial({
      map: heartTex,
      transparent: true,
      depthWrite: false
    });
  }

  /**
   * Bắn pháo giấy confetti từ vị trí sân khấu
   */
  spawnConfetti(centerPos, count = 120, isGold = false) {
    const colors = isGold
      ? [0xFFD700, 0xFFA500, 0xFFE066, 0xFFFFFF]
      : [0xFF2D55, 0x00F2FE, 0x4FACFE, 0xFFE066, 0x9B51E0, 0x2ECC71];

    const geo = new THREE.PlaneGeometry(0.12, 0.2);

    for (let i = 0; i < count; i++) {
      const color = colors[Math.floor(Math.random() * colors.length)];
      const mat = new THREE.MeshBasicMaterial({
        color: color,
        side: THREE.DoubleSide
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(centerPos);
      mesh.position.y += 0.5;

      const angle = Math.random() * Math.PI * 2;
      const speed = THREE.MathUtils.randFloat(3.5, 9.0);
      const upward = THREE.MathUtils.randFloat(5.0, 10.0);

      const velocity = new THREE.Vector3(
        Math.cos(angle) * speed,
        upward,
        Math.sin(angle) * speed
      );

      const rotSpeed = new THREE.Vector3(
        Math.random() * 8,
        Math.random() * 8,
        Math.random() * 8
      );

      this.scene.add(mesh);
      this.confettiParticles.push({
        mesh,
        velocity,
        rotSpeed,
        life: 1.0,
        decay: THREE.MathUtils.randFloat(0.25, 0.45)
      });
    }
  }

  /**
   * Bắn tim bay lên từ nhân vật khi có lượt Like
   */
  spawnHeart(pos, count = 3) {
    for (let i = 0; i < count; i++) {
      const sprite = new THREE.Sprite(this.heartMaterial.clone());
      sprite.position.copy(pos);
      sprite.position.x += THREE.MathUtils.randFloatSpread(0.6);
      sprite.position.y += 2.0 + Math.random() * 0.4;
      sprite.position.z += THREE.MathUtils.randFloatSpread(0.6);

      const scale = THREE.MathUtils.randFloat(0.4, 0.7);
      sprite.scale.set(scale, scale, 1);

      this.scene.add(sprite);
      this.heartParticles.push({
        sprite,
        velocity: new THREE.Vector3(
          THREE.MathUtils.randFloatSpread(0.5),
          THREE.MathUtils.randFloat(1.5, 3.2),
          THREE.MathUtils.randFloatSpread(0.5)
        ),
        life: 1.0,
        decay: THREE.MathUtils.randFloat(0.4, 0.7)
      });
    }
  }

  /**
   * Bắn pháo hoa rực rỡ toàn cảnh (khi có quà VIP / Siêu Lớn)
   */
  spawnFireworks(centerPos) {
    const count = 180;
    const colors = [0xFF0055, 0x00FFFF, 0xFFFF00, 0xFF00FF, 0x00FF66];

    for (let i = 0; i < count; i++) {
      const color = colors[Math.floor(Math.random() * colors.length)];
      const geo = new THREE.SphereGeometry(0.08, 6, 6);
      const mat = new THREE.MeshBasicMaterial({ color });
      const mesh = new THREE.Mesh(geo, mat);

      mesh.position.copy(centerPos);
      mesh.position.y += 4.0;

      // Hướng nổ bán cầu đều mọi hướng
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const speed = THREE.MathUtils.randFloat(4.0, 11.0);

      const velocity = new THREE.Vector3(
        speed * Math.sin(phi) * Math.cos(theta),
        speed * Math.sin(phi) * Math.sin(theta) + 2.0,
        speed * Math.cos(phi)
      );

      this.scene.add(mesh);
      this.fireworkParticles.push({
        mesh,
        velocity,
        life: 1.0,
        decay: THREE.MathUtils.randFloat(0.3, 0.6)
      });
    }
  }

  update(delta) {
    const gravity = -9.8;

    // 1. Cập nhật Confetti
    for (let i = this.confettiParticles.length - 1; i >= 0; i--) {
      const p = this.confettiParticles[i];
      p.life -= p.decay * delta;

      p.velocity.y += gravity * 0.7 * delta;
      p.mesh.position.addScaledVector(p.velocity, delta);

      p.mesh.rotation.x += p.rotSpeed.x * delta;
      p.mesh.rotation.y += p.rotSpeed.y * delta;
      p.mesh.rotation.z += p.rotSpeed.z * delta;

      if (p.life <= 0 || p.mesh.position.y < 0) {
        this.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        p.mesh.material.dispose();
        this.confettiParticles.splice(i, 1);
      }
    }

    // 2. Cập nhật Hearts
    for (let i = this.heartParticles.length - 1; i >= 0; i--) {
      const p = this.heartParticles[i];
      p.life -= p.decay * delta;

      p.sprite.position.addScaledVector(p.velocity, delta);
      p.sprite.material.opacity = Math.max(0, p.life);

      if (p.life <= 0) {
        this.scene.remove(p.sprite);
        p.sprite.material.dispose();
        this.heartParticles.splice(i, 1);
      }
    }

    // 3. Cập nhật Fireworks
    for (let i = this.fireworkParticles.length - 1; i >= 0; i--) {
      const p = this.fireworkParticles[i];
      p.life -= p.decay * delta;

      p.velocity.y += gravity * 0.5 * delta;
      p.mesh.position.addScaledVector(p.velocity, delta);
      p.mesh.scale.setScalar(Math.max(0.01, p.life));

      if (p.life <= 0 || p.mesh.position.y < 0) {
        this.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        p.mesh.material.dispose();
        this.fireworkParticles.splice(i, 1);
      }
    }
  }
}
