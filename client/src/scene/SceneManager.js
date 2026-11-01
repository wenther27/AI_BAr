import * as THREE from 'three';

export class SceneManager {
  constructor(containerElement, options = {}) {
    this.container = containerElement;
    this.aspectRatioMode = options.aspectRatio || 'auto'; // 'auto', '16:9', '9:16'

    this.scene = null;
    this.camera = null;
    this.renderer = null;

    this.defaultCamPos = new THREE.Vector3(0, 3.8, 9.5);
    this.defaultLookAt = new THREE.Vector3(0, 1.6, -3.0);

    this.currentCamPos = this.defaultCamPos.clone();
    this.targetCamPos = this.defaultCamPos.clone();
    this.currentLookAt = this.defaultLookAt.clone();
    this.targetLookAt = this.defaultLookAt.clone();

    this.zoomTarget = null;
    this.zoomTimer = 0;

    this._initScene();
    this._setupResizeListener();
  }

  _initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0e0a1a);
    this.scene.fog = new THREE.FogExp2(0x0e0a1a, 0.016);

    const { width, height } = this._getDimensions();
    const aspect = width / height;

    this.camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 100);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.45;

    this.container.appendChild(this.renderer.domElement);

    // Căn chỉnh góc nhìn camera tối ưu theo tỉ lệ màn hình
    this.updateCameraForAspect();
    this.camera.position.copy(this.defaultCamPos);
    this.camera.lookAt(this.defaultLookAt);
  }

  _getDimensions() {
    const parentW = this.container.clientWidth || window.innerWidth;
    const parentH = this.container.clientHeight || window.innerHeight;

    if (this.aspectRatioMode === '9:16') {
      const targetW = Math.min(parentW, parentH * (9 / 16));
      return { width: targetW, height: parentH };
    } else if (this.aspectRatioMode === '16:9') {
      const targetH = Math.min(parentH, parentW * (9 / 16));
      return { width: parentW, height: targetH || parentH };
    } else {
      // Auto: Full kích thước màn hình thiết bị (chuẩn cho mobile)
      return { width: parentW, height: parentH };
    }
  }

  /**
   * Tự động tính toán FOV và vị trí camera khi xem trên Điện thoại (Màn hình dọc 9:16)
   * Giúp bao quát trọn vẹn toàn bộ sân khấu, sàn nhảy, màn LED và giàn đèn
   */
  updateCameraForAspect() {
    if (!this.renderer || !this.camera) return;
    const { width, height } = this._getDimensions();
    const aspect = width / height;

    if (aspect < 1.0) {
      // ===== CHẾ ĐỘ MÀN HÌNH DỌC (ĐIỆN THOẠI / TIKTOK LIVE DỌC) =====
      // Giữ nguyên góc nhìn ngang ~60 độ để không bị cắt xén 2 bên sân khấu
      const targetHorizontalFov = 60 * (Math.PI / 180);
      const vFovRad = 2 * Math.atan(Math.tan(targetHorizontalFov / 2) / aspect);
      const dynamicFov = THREE.MathUtils.clamp(vFovRad * (180 / Math.PI), 52, 78);

      this.camera.fov = dynamicFov;
      // Nâng cao và lùi máy quay ra phía sau một chút để nhìn thấy từ trần giàn đèn tới sàn nhảy
      this.defaultCamPos.set(0, 5.2, 12.8);
      this.defaultLookAt.set(0, 1.4, -3.2);
    } else {
      // ===== CHẾ ĐỘ MÀN HÌNH NGANG (DESKTOP / OBS 16:9) =====
      this.camera.fov = 50;
      this.defaultCamPos.set(0, 3.8, 9.5);
      this.defaultLookAt.set(0, 1.6, -3.0);
    }

    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);

    if (this.zoomTimer <= 0) {
      this.targetCamPos.copy(this.defaultCamPos);
      this.targetLookAt.copy(this.defaultLookAt);
    }
  }

  setAspectRatio(mode) {
    this.aspectRatioMode = mode;
    this.updateCameraForAspect();
  }

  _setupResizeListener() {
    window.addEventListener('resize', () => {
      this.updateCameraForAspect();
    });
  }

  zoomToStage(slotPosition, duration = 8.0) {
    // Đã tắt tính năng zoom theo yêu cầu - Giữ góc máy bao quát cố định
    this.zoomTimer = 0;
  }

  resetCamera() {
    this.zoomTimer = 0;
    this.targetCamPos.copy(this.defaultCamPos);
    this.targetLookAt.copy(this.defaultLookAt);
  }

  update(delta) {
    const time = performance.now() * 0.001;

    if (this.zoomTimer > 0) {
      this.zoomTimer -= delta;
      if (this.zoomTimer <= 0) {
        this.resetCamera();
      }
    } else {
      const orbitX = Math.sin(time * 0.25) * 0.35;
      const orbitY = Math.cos(time * 0.18) * 0.12;
      this.targetCamPos.x = this.defaultCamPos.x + orbitX;
      this.targetCamPos.y = this.defaultCamPos.y + orbitY;
    }

    this.currentCamPos.lerp(this.targetCamPos, delta * 2.5);
    this.currentLookAt.lerp(this.targetLookAt, delta * 2.5);

    this.camera.position.copy(this.currentCamPos);
    this.camera.lookAt(this.currentLookAt);
  }

  render() {
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }
}
