import * as THREE from 'three';

export class LightingShow {
  constructor(scene) {
    this.scene = scene;

    this.movingHeads = [];
    this.lasers = [];
    this.stageFillLights = [];
    this.strobeLight = null;
    this.strobeTimer = 0;

    this._initAmbientAndHemisphere();
    this._initStageLights();
    this._initMovingHeads();
    this._initLasers();
    this._initStrobe();
  }

  _initAmbientAndHemisphere() {
    // 1. HemisphereLight tạo ánh sáng ngập tràn màu tím/hồng neon club, làm sáng bừng toàn cảnh
    const hemiLight = new THREE.HemisphereLight(0x9d72ff, 0x1f1938, 2.4);
    hemiLight.position.set(0, 15, 0);
    this.scene.add(hemiLight);

    // 2. Ambient light bổ trợ
    const ambientLight = new THREE.AmbientLight(0x4a3b68, 1.8);
    this.scene.add(ambientLight);

    // 3. Đèn chính chiếu rọi sàn nhảy và nhân vật (Key Light)
    const keyLight = new THREE.DirectionalLight(0xfff5ea, 2.6);
    keyLight.position.set(2, 12, 10);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.bias = -0.0005;
    this.scene.add(keyLight);

    // 4. Đèn Backlight viền tạo khối cho nhân vật (Rim Light)
    const rimLight = new THREE.DirectionalLight(0x00f2fe, 1.8);
    rimLight.position.set(0, 8, -10);
    this.scene.add(rimLight);
  }

  _initStageLights() {
    // Đèn chiếu rọi trực diện bục sân khấu (Stage Spotlights)
    const stageLightLeft = new THREE.SpotLight(0xff2d55, 60, 20, Math.PI / 4, 0.5, 1.2);
    stageLightLeft.position.set(-5, 7, -3);
    const targetLeft = new THREE.Object3D();
    targetLeft.position.set(-2, 1.2, -7.5);
    this.scene.add(targetLeft);
    stageLightLeft.target = targetLeft;
    this.scene.add(stageLightLeft);

    const stageLightRight = new THREE.SpotLight(0x00f2fe, 60, 20, Math.PI / 4, 0.5, 1.2);
    stageLightRight.position.set(5, 7, -3);
    const targetRight = new THREE.Object3D();
    targetRight.position.set(2, 1.2, -7.5);
    this.scene.add(targetRight);
    stageLightRight.target = targetRight;
    this.scene.add(stageLightRight);

    // Spotlight rọi thẳng vào quả cầu gương (Mirror ball) để quả cầu sáng lấp lánh
    const ballSpot = new THREE.SpotLight(0xffffff, 80, 15, Math.PI / 6, 0.2);
    ballSpot.position.set(0, 8.5, 4);
    const ballTarget = new THREE.Object3D();
    ballTarget.position.set(0, 7.0, 0); // vị trí quả cầu
    this.scene.add(ballTarget);
    ballSpot.target = ballTarget;
    this.scene.add(ballSpot);
  }

  _initMovingHeads() {
    // 4 đèn moving head treo trên giàn truss
    const positions = [
      new THREE.Vector3(-5.5, 7.8, -5.5),
      new THREE.Vector3(-1.8, 7.8, -5.5),
      new THREE.Vector3(1.8, 7.8, -5.5),
      new THREE.Vector3(5.5, 7.8, -5.5)
    ];

    const colors = [0x00F2FE, 0xFF2D55, 0x9B51E0, 0x00FF88];

    positions.forEach((pos, idx) => {
      // 1. Thân đèn
      const baseGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.35, 12);
      const baseMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8 });
      const baseMesh = new THREE.Mesh(baseGeo, baseMat);
      baseMesh.position.copy(pos);
      this.scene.add(baseMesh);

      // 2. Nguồn sáng Spotlight
      const spot = new THREE.SpotLight(colors[idx], 90, 22, Math.PI / 6.5, 0.35, 1.2);
      spot.position.copy(pos);

      // Target điểm chiếu
      const target = new THREE.Object3D();
      target.position.set(pos.x * 0.5, 0, 2.5);
      this.scene.add(target);
      spot.target = target;
      this.scene.add(spot);

      // 3. Chùm tia nón volumic
      const coneGeo = new THREE.ConeGeometry(1.5, 12, 16, 1, true);
      coneGeo.translate(0, -6, 0);
      coneGeo.rotateX(Math.PI);

      const coneMat = new THREE.MeshBasicMaterial({
        color: colors[idx],
        transparent: true,
        opacity: 0.25,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      });
      const coneMesh = new THREE.Mesh(coneGeo, coneMat);
      coneMesh.position.copy(pos);
      this.scene.add(coneMesh);

      this.movingHeads.push({
        baseMesh,
        spot,
        target,
        coneMesh,
        color: colors[idx],
        phase: idx * 1.5,
        speed: 1.1
      });
    });
  }

  _initLasers() {
    // 6 tia laser mảnh quét từ phía sau
    const laserColors = [0xFF0055, 0x00FFCC, 0xFF00FF, 0x00FF55, 0x00FFFF, 0xFF3300];
    const laserGeo = new THREE.CylinderGeometry(0.025, 0.025, 20, 6);
    laserGeo.translate(0, 10, 0);
    laserGeo.rotateX(Math.PI / 2);

    for (let i = 0; i < 6; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: laserColors[i],
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
      });

      const mesh = new THREE.Mesh(laserGeo, mat);
      const x = -6 + (i * 2.4);
      mesh.position.set(x, 7.2, -9.8);
      this.scene.add(mesh);

      this.lasers.push({
        mesh,
        baseX: x,
        phase: i * 0.8,
        speed: 1.6 + i * 0.2
      });
    }
  }

  _initStrobe() {
    this.strobeLight = new THREE.PointLight(0xFFFFFF, 0, 30);
    this.strobeLight.position.set(0, 7, -2);
    this.scene.add(this.strobeLight);
  }

  triggerStrobe(duration = 2.0) {
    this.strobeTimer = duration;
  }

  update(delta, audioData) {
    const time = performance.now() * 0.001;
    const bass = audioData ? audioData.bass : 0.2;
    const isBeat = audioData ? audioData.isBeat : false;

    // Cập nhật Đèn Moving Head
    this.movingHeads.forEach((mh) => {
      const angle = time * mh.speed + mh.phase;
      mh.target.position.x = THREE.MathUtils.clamp(mh.baseMesh.position.x * 0.4 + Math.sin(angle) * 3.5, -4.5, 4.5);
      mh.target.position.z = 2.0 + Math.cos(angle * 1.4) * 3.5;

      mh.coneMesh.lookAt(mh.target.position);
      mh.spot.intensity = 70 + bass * 90;
      mh.coneMesh.material.opacity = 0.18 + bass * 0.25;
    });

    // Cập nhật Tia Lasers
    this.lasers.forEach((laser) => {
      const lAngle = time * laser.speed + laser.phase;
      laser.mesh.rotation.y = Math.sin(lAngle) * 0.45;
      laser.mesh.rotation.x = 0.22 + Math.cos(lAngle * 0.8) * 0.12;

      if (isBeat) {
        laser.mesh.material.opacity = 1.0;
      } else {
        laser.mesh.material.opacity = 0.7;
      }
    });

    // Strobe
    if (this.strobeTimer > 0) {
      this.strobeTimer -= delta;
      this.strobeLight.intensity = (Math.sin(time * 40) > 0) ? 80 : 0;
    } else {
      this.strobeLight.intensity = 0;
    }
  }
}
