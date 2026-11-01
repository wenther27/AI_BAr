import * as THREE from 'three';

export class ClubEnvironment {
  constructor(scene) {
    this.scene = scene;

    this.mirrorBall = null;
    this.ledScreenMesh = null;
    this.ledCanvas = null;
    this.ledCtx = null;
    this.ledTexture = null;

    this.takeoverTimer = 0;
    this.takeoverUser = null;
    this.scrollTextOffset = 0;
    this.wallNeonBars = [];

    this._buildFloor();
    this._buildStage();
    this._buildDjBooth();
    this._buildTrussRig();
    this._buildMirrorBall();
    this._buildLedScreen();
    this._buildClubWallsAndNeon();
  }

  _buildFloor() {
    // Sàn nhảy bóng loáng có viền ô neon
    const floorGeo = new THREE.PlaneGeometry(18, 16);

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    // Nền sàn xanh tím neon
    ctx.fillStyle = '#0f1226';
    ctx.fillRect(0, 0, 512, 512);

    // Lưới neon sàn club
    ctx.strokeStyle = '#2d3b66';
    ctx.lineWidth = 5;
    const gridSize = 64;
    for (let x = 0; x <= 512; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 512);
      ctx.stroke();
    }
    for (let y = 0; y <= 512; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();
    }

    const floorTex = new THREE.CanvasTexture(canvas);
    floorTex.wrapS = THREE.RepeatWrapping;
    floorTex.wrapT = THREE.RepeatWrapping;
    floorTex.repeat.set(5, 5);

    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTex,
      roughness: 0.12,
      metalness: 0.8
    });

    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.set(0, 0, 2);
    floorMesh.receiveShadow = true;
    this.scene.add(floorMesh);

    // Viền phát sáng 4 cạnh sàn nhảy
    const edgeGeo = new THREE.BoxGeometry(18.2, 0.08, 0.15);
    const edgeMat = new THREE.MeshBasicMaterial({ color: 0x00F2FE });
    const frontEdge = new THREE.Mesh(edgeGeo, edgeMat);
    frontEdge.position.set(0, 0.05, 10);
    this.scene.add(frontEdge);
  }

  _buildStage() {
    // Bục sân khấu nâng cao phía trước
    const stageGeo = new THREE.BoxGeometry(12, 1.2, 5.0);
    const stageMat = new THREE.MeshStandardMaterial({
      color: 0x1a2138,
      roughness: 0.25,
      metalness: 0.6
    });

    const stageMesh = new THREE.Mesh(stageGeo, stageMat);
    stageMesh.position.set(0, 0.6, -7.5);
    stageMesh.receiveShadow = true;
    stageMesh.castShadow = true;
    this.scene.add(stageMesh);

    // Dải đèn LED neon viền mép trước sân khấu
    const neonGeo = new THREE.BoxGeometry(12.1, 0.12, 0.2);
    this.stageNeonMat = new THREE.MeshBasicMaterial({ color: 0x00F2FE });
    const stageNeon = new THREE.Mesh(neonGeo, this.stageNeonMat);
    stageNeon.position.set(0, 1.2, -4.95);
    this.scene.add(stageNeon);
  }

  _buildDjBooth() {
    // Bàn DJ hiện đại ở trung tâm phía sau sân khấu
    const boothGeo = new THREE.BoxGeometry(3.0, 1.1, 1.2);
    const boothMat = new THREE.MeshStandardMaterial({
      color: 0x141a29,
      roughness: 0.2,
      metalness: 0.8
    });
    const boothMesh = new THREE.Mesh(boothGeo, boothMat);
    boothMesh.position.set(0, 1.75, -9.0);
    this.scene.add(boothMesh);

    // Màn hình DJ Logo
    const logoGeo = new THREE.PlaneGeometry(2.2, 0.55);
    const logoCanvas = document.createElement('canvas');
    logoCanvas.width = 256;
    logoCanvas.height = 64;
    const lctx = logoCanvas.getContext('2d');
    lctx.fillStyle = '#060a17';
    lctx.fillRect(0, 0, 256, 64);
    lctx.fillStyle = '#00F2FE';
    lctx.font = 'bold 36px Arial';
    lctx.textAlign = 'center';
    lctx.fillText('🎧 DJ LIVE VIP', 128, 45);

    const logoTex = new THREE.CanvasTexture(logoCanvas);
    const logoMat = new THREE.MeshBasicMaterial({ map: logoTex });
    const logoMesh = new THREE.Mesh(logoGeo, logoMat);
    logoMesh.position.set(0, 1.75, -8.38);
    this.scene.add(logoMesh);
  }

  _buildTrussRig() {
    const trussMat = new THREE.MeshStandardMaterial({
      color: 0x555566,
      metalness: 0.9,
      roughness: 0.2
    });

    const trussGeo = new THREE.CylinderGeometry(0.12, 0.12, 16, 12);
    const trussBeam = new THREE.Mesh(trussGeo, trussMat);
    trussBeam.rotation.z = Math.PI / 2;
    trussBeam.position.set(0, 7.8, -5.5);
    this.scene.add(trussBeam);

    const pillarGeo = new THREE.CylinderGeometry(0.12, 0.12, 8.5, 12);
    const leftPillar = new THREE.Mesh(pillarGeo, trussMat);
    leftPillar.position.set(-8, 4.2, -5.5);
    this.scene.add(leftPillar);

    const rightPillar = new THREE.Mesh(pillarGeo, trussMat);
    rightPillar.position.set(8, 4.2, -5.5);
    this.scene.add(rightPillar);
  }

  _buildMirrorBall() {
    // Quả cầu gương Disco được đặt cao hơn để KHÔNG che màn hình LED
    const ballGeo = new THREE.SphereGeometry(0.65, 24, 24);
    const ballMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.05,
      metalness: 0.95,
      flatShading: true
    });

    this.mirrorBall = new THREE.Mesh(ballGeo, ballMat);
    this.mirrorBall.position.set(0, 7.0, -1.0);
    this.scene.add(this.mirrorBall);

    // Dây treo
    const wireGeo = new THREE.CylinderGeometry(0.015, 0.015, 2, 6);
    const wireMat = new THREE.MeshBasicMaterial({ color: 0xaaaaaa });
    const wire = new THREE.Mesh(wireGeo, wireMat);
    wire.position.set(0, 8.0, -1.0);
    this.scene.add(wire);
  }

  _buildLedScreen() {
    // Màn hình LED khổng lồ phía sau sân khấu
    const screenGeo = new THREE.PlaneGeometry(14, 5.8);

    this.ledCanvas = document.createElement('canvas');
    this.ledCanvas.width = 1024;
    this.ledCanvas.height = 512;
    this.ledCtx = this.ledCanvas.getContext('2d');

    this.ledTexture = new THREE.CanvasTexture(this.ledCanvas);
    this.ledTexture.colorSpace = THREE.SRGBColorSpace;

    const screenMat = new THREE.MeshBasicMaterial({
      map: this.ledTexture
    });

    this.ledScreenMesh = new THREE.Mesh(screenGeo, screenMat);
    this.ledScreenMesh.position.set(0, 5.2, -10.0);
    this.scene.add(this.ledScreenMesh);
  }

  _buildClubWallsAndNeon() {
    // 1. Tường hậu đài
    const backWallGeo = new THREE.PlaneGeometry(24, 14);
    const backWallMat = new THREE.MeshStandardMaterial({
      color: 0x101426,
      roughness: 0.7
    });
    const backWall = new THREE.Mesh(backWallGeo, backWallMat);
    backWall.position.set(0, 6, -10.3);
    this.scene.add(backWall);

    // 2. Hai cột đèn LED Totem 2 bên mép sân khấu phát sáng rực rỡ
    const totemGeo = new THREE.BoxGeometry(0.35, 6.0, 0.35);
    const totemMatLeft = new THREE.MeshBasicMaterial({ color: 0xFF2D55 });
    const totemLeft = new THREE.Mesh(totemGeo, totemMatLeft);
    totemLeft.position.set(-6.2, 3.0, -7.5);
    this.scene.add(totemLeft);

    const totemMatRight = new THREE.MeshBasicMaterial({ color: 0x00F2FE });
    const totemRight = new THREE.Mesh(totemGeo, totemMatRight);
    totemRight.position.set(6.2, 3.0, -7.5);
    this.scene.add(totemRight);

    // 3. Các thanh đèn Neon trang trí dọc theo tường 2 bên
    const stripGeo = new THREE.BoxGeometry(0.1, 4.5, 0.1);
    const neonColors = [0xFF2D55, 0x00F2FE, 0x9B51E0, 0xFFD700];

    for (let i = 0; i < 4; i++) {
      const zPos = -3 + i * 3.5;
      const mat = new THREE.MeshBasicMaterial({ color: neonColors[i] });

      const leftStrip = new THREE.Mesh(stripGeo, mat);
      leftStrip.position.set(-8.8, 3.2, zPos);
      this.scene.add(leftStrip);

      const rightStrip = new THREE.Mesh(stripGeo, mat);
      rightStrip.position.set(8.8, 3.2, zPos);
      this.scene.add(rightStrip);

      this.wallNeonBars.push(leftStrip, rightStrip);
    }
  }

  triggerSuperTakeover(userData) {
    this.takeoverTimer = 15;
    this.takeoverUser = userData;
  }

  update(delta, audioData) {
    if (this.mirrorBall) {
      this.mirrorBall.rotation.y += delta * 0.8;
    }

    if (this.stageNeonMat && audioData) {
      if (audioData.isBeat) {
        this.stageNeonMat.color.setHex(0xFF007F);
      } else {
        this.stageNeonMat.color.lerp(new THREE.Color(0x00F2FE), delta * 5.0);
      }
    }

    this._renderLedScreen(delta, audioData);
  }

  _renderLedScreen(delta, audioData) {
    if (!this.ledCtx) return;
    const ctx = this.ledCtx;
    const w = this.ledCanvas.width;
    const h = this.ledCanvas.height;

    // Nền LED sáng xanh tím công nghệ
    ctx.fillStyle = '#0c1024';
    ctx.fillRect(0, 0, w, h);

    if (this.takeoverTimer > 0 && this.takeoverUser) {
      this.takeoverTimer -= delta;

      // Banner Siêu VIP
      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 54px "Segoe UI", Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('👑 SIÊU ĐẠI GIA TAKEOVER 👑', w / 2, 90);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 46px "Segoe UI", Arial, sans-serif';
      ctx.fillText(this.takeoverUser.nickname || 'VIP USER', w / 2, 170);

      ctx.fillStyle = '#00F2FE';
      ctx.font = '34px "Segoe UI", Arial, sans-serif';
      ctx.fillText('CẢM ƠN MÓN QUÀ SIÊU KHỦNG TỪ BẠN! 🔥🔥🔥', w / 2, 230);

      this._drawAudioBars(ctx, w, h, '#FFD700', audioData);
    } else {
      // Dòng chữ chạy qua màn hình (rõ ràng, không bị quả cầu gương che)
      this.scrollTextOffset += delta * 200;
      if (this.scrollTextOffset > w + 1300) {
        this.scrollTextOffset = 0;
      }

      ctx.fillStyle = '#00F2FE';
      ctx.font = 'bold 48px "Segoe UI", Arial, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('🔥 QUÁN BAR TIKTOK LIVE VIP • TẶNG QUÀ ĐỂ LÊN SÂN KHẤU NHẢY 🔥', w - this.scrollTextOffset, 110);

      this._drawAudioBars(ctx, w, h, '#FF2D55', audioData);
    }

    this.ledTexture.needsUpdate = true;
  }

  _drawAudioBars(ctx, w, h, baseColor, audioData) {
    const bars = 26;
    const barWidth = 26;
    const spacing = 12;
    const startX = (w - (bars * (barWidth + spacing))) / 2;
    const energy = audioData ? audioData.energy : 0.4;
    const time = performance.now() * 0.003;

    for (let i = 0; i < bars; i++) {
      const x = startX + i * (barWidth + spacing);
      const wave = Math.abs(Math.sin(time + i * 0.32)) * (0.35 + energy * 0.65);
      const barHeight = wave * 200;
      const y = h - 45 - barHeight;

      const grad = ctx.createLinearGradient(0, y, 0, h - 45);
      grad.addColorStop(0, '#FFFFFF');
      grad.addColorStop(0.3, baseColor);
      grad.addColorStop(1, '#4facfe');

      ctx.fillStyle = grad;
      ctx.fillRect(x, y, barWidth, barHeight);
    }
  }
}
