import * as THREE from 'three';
import { ProceduralDanceController, DANCE_STYLES } from './ProceduralDance.js';

export const CHARACTER_STATE = {
  SPAWNING: 'spawning',
  FLOOR_IDLE: 'floor_idle',
  MOVING_TO_STAGE: 'moving_to_stage',
  STAGE_DANCING: 'stage_dancing',
  RETURNING_TO_FLOOR: 'returning_to_floor'
};

export class ChibiCharacter {
  constructor(userData) {
    this.userData = userData;
    this.userId = userData.userId || 'anon_' + Math.random().toString(36).substr(2, 9);
    this.nickname = userData.nickname || userData.uniqueId || 'Khách VIP';

    this.group = new THREE.Group();
    // Giảm nhẹ kích thước nhân vật (0.65x) theo yêu cầu để sàn rộng thoáng hơn
    this.group.scale.set(0.65, 0.65, 0.65);

    this.state = CHARACTER_STATE.SPAWNING;
    this.danceController = new ProceduralDanceController();

    this.position = new THREE.Vector3();
    this.targetPosition = new THREE.Vector3();
    this.floorHome = new THREE.Vector3();
    this.stageSlotIndex = -1;
    this.stageTimeLeft = 0;
    this.danceSpeed = 1.0;
    this.lastActiveTime = Date.now();

    this.spawnProgress = 0;
    this.spawnStartY = 12;

    this.chatBubbleSprite = null;
    this.chatTimeout = null;

    this.headGroup = null;
    this.faceMat = null;
    this.bodyMesh = null;
    this.leftArmPivot = null;
    this.rightArmPivot = null;
    this.leftLegMesh = null;
    this.rightLegMesh = null;

    // Nameplate Canvas & Texture
    this.nameplateCanvas = null;
    this.nameplateCtx = null;
    this.nameplateTexture = null;
    this.nameplateSprite = null;
    this.avatarImage = null;

    this._buildMesh();
  }

  _buildMesh() {
    const userColor = this._getColorFromId(this.userId);
    const hash = this._getHash(this.userId);

    this.root = new THREE.Group();
    this.group.add(this.root);

    // 1. Thân áo Chibi
    const bodyGeo = new THREE.CylinderGeometry(0.25, 0.32, 0.58, 16);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: userColor,
      roughness: 0.3,
      metalness: 0.1
    });
    this.bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    this.bodyMesh.position.y = 0.5;
    this.bodyMesh.castShadow = true;
    this.bodyMesh.receiveShadow = true;
    this.root.add(this.bodyMesh);

    // 2. Đầu nhân vật Chibi 3D (Head Group)
    this.headGroup = new THREE.Group();
    this.headGroup.position.y = 1.15;
    this.root.add(this.headGroup);

    // Khuôn mặt Chibi màu da sáng tự nhiên
    const headGeo = new THREE.SphereGeometry(0.42, 24, 24);
    const headMat = new THREE.MeshStandardMaterial({
      color: 0xffdfc4, // Tone màu da Chibi tự nhiên, đáng yêu
      roughness: 0.5,
      metalness: 0.05
    });
    const headMesh = new THREE.Mesh(headGeo, headMat);
    headMesh.castShadow = true;
    this.headGroup.add(headMesh);

    // Màu tóc ngẫu nhiên theo hash (Đen, Nâu, Vàng kim, Tím khói, Xanh bạc hà)
    const hairColors = [0x1c1924, 0x3d271d, 0xd4a373, 0x6d597a, 0x457b9d, 0x2b2d42];
    const hairColor = hairColors[Math.abs(hash) % hairColors.length];

    // Mái tóc Chibi bồng bềnh phía sau và trên đỉnh
    const hairGeo = new THREE.SphereGeometry(0.435, 20, 20, 0, Math.PI * 2, 0, Math.PI / 1.7);
    const hairMat = new THREE.MeshStandardMaterial({
      color: hairColor,
      roughness: 0.65,
      metalness: 0.1
    });
    const hairMesh = new THREE.Mesh(hairGeo, hairMat);
    hairMesh.rotation.x = -0.35; // Hất nhẹ tóc về phía sau
    hairMesh.position.set(0, 0.03, -0.04);
    this.headGroup.add(hairMesh);

    // Đôi mắt Chibi to tròn đen long lanh
    const eyeGeo = new THREE.SphereGeometry(0.055, 12, 12);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x111118 });
    const shineGeo = new THREE.SphereGeometry(0.018, 8, 8);
    const shineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    // Mắt trái
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.14, 0.04, 0.395);
    const leftShine = new THREE.Mesh(shineGeo, shineMat);
    leftShine.position.set(-0.125, 0.06, 0.435);
    this.headGroup.add(leftEye, leftShine);

    // Mắt phải
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.14, 0.04, 0.395);
    const rightShine = new THREE.Mesh(shineGeo, shineMat);
    rightShine.position.set(0.155, 0.06, 0.435);
    this.headGroup.add(rightEye, rightShine);

    // Má hồng đào phúng phính (Blush cheeks)
    const blushGeo = new THREE.CircleGeometry(0.065, 16);
    const blushMat = new THREE.MeshBasicMaterial({
      color: 0xff7b90,
      transparent: true,
      opacity: 0.65,
      side: THREE.FrontSide
    });

    const leftBlush = new THREE.Mesh(blushGeo, blushMat);
    leftBlush.position.set(-0.21, -0.06, 0.375);
    leftBlush.rotation.y = -0.3;
    this.headGroup.add(leftBlush);

    const rightBlush = new THREE.Mesh(blushGeo, blushMat);
    rightBlush.position.set(0.21, -0.06, 0.375);
    rightBlush.rotation.y = 0.3;
    this.headGroup.add(rightBlush);

    // Miệng cười Chibi nhỏ nhắn xinh xắn
    const smileGeo = new THREE.TorusGeometry(0.04, 0.012, 8, 12, Math.PI);
    const smileMat = new THREE.MeshBasicMaterial({ color: 0x882233 });
    const smile = new THREE.Mesh(smileGeo, smileMat);
    smile.rotation.x = Math.PI;
    smile.position.set(0, -0.08, 0.41);
    this.headGroup.add(smile);

    // 3. Tạo hình đầu & phụ kiện ngẫu nhiên (Tai mèo, Tai nghe DJ, Nón snapback, Vương miện...)
    this._buildRandomHeadgear(this.headGroup, hash);

    // 4. Tay trái
    this.leftArmPivot = new THREE.Group();
    this.leftArmPivot.position.set(-0.35, 0.68, 0);
    const armGeo = new THREE.CapsuleGeometry(0.08, 0.28, 8, 8);
    const armMat = new THREE.MeshStandardMaterial({ color: userColor, roughness: 0.35 });
    const leftArmMesh = new THREE.Mesh(armGeo, armMat);
    leftArmMesh.position.y = -0.15;
    this.leftArmPivot.add(leftArmMesh);
    this.root.add(this.leftArmPivot);

    // 5. Tay phải
    this.rightArmPivot = new THREE.Group();
    this.rightArmPivot.position.set(0.35, 0.68, 0);
    const rightArmMesh = new THREE.Mesh(armGeo, armMat);
    rightArmMesh.position.y = -0.15;
    this.rightArmPivot.add(rightArmMesh);
    this.root.add(this.rightArmPivot);

    // 6. Chân
    const legGeo = new THREE.CapsuleGeometry(0.09, 0.24, 8, 8);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x111625, roughness: 0.5 });

    this.leftLegMesh = new THREE.Mesh(legGeo, legMat);
    this.leftLegMesh.position.set(-0.16, 0.12, 0);
    this.root.add(this.leftLegMesh);

    this.rightLegMesh = new THREE.Mesh(legGeo, legMat);
    this.rightLegMesh.position.set(0.16, 0.12, 0);
    this.root.add(this.rightLegMesh);

    // 7. Khởi tạo Nameplate
    this._initNameplate();

    // 8. Tải Avatar Texture cho cả khuôn mặt và logo nameplate
    this._loadAvatarTexture();
  }

  /**
   * Tạo hình ngẫu nhiên trên đầu cho từng người xem (Style 0 - 5)
   */
  _buildRandomHeadgear(parentGroup, hash) {
    const style = Math.abs(hash) % 6;
    const accentColors = [0xFF2D55, 0x00F2FE, 0xFFD700, 0x9B51E0, 0x00FF88];
    const accentColor = accentColors[Math.abs(hash >> 3) % accentColors.length];

    switch (style) {
      case 0: {
        // Style 0: Tai mèo / Cáo dễ thương phát sáng Neon (Cat Ears)
        const earGeo = new THREE.ConeGeometry(0.14, 0.28, 4);
        const earMat = new THREE.MeshStandardMaterial({ color: accentColor, roughness: 0.3 });

        const leftEar = new THREE.Mesh(earGeo, earMat);
        leftEar.position.set(-0.24, 0.46, 0.05);
        leftEar.rotation.z = 0.25;
        parentGroup.add(leftEar);

        const rightEar = new THREE.Mesh(earGeo, earMat);
        rightEar.position.set(0.24, 0.46, 0.05);
        rightEar.rotation.z = -0.25;
        parentGroup.add(rightEar);
        break;
      }

      case 1: {
        // Style 1: Tai nghe DJ Club cao cấp (DJ Headset)
        const bandGeo = new THREE.TorusGeometry(0.44, 0.04, 8, 24, Math.PI);
        const bandMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8 });
        const band = new THREE.Mesh(bandGeo, bandMat);
        band.position.set(0, 0.08, 0);
        band.rotation.x = Math.PI / 2;
        parentGroup.add(band);

        // 2 củ tai nghe 2 bên
        const cupGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.12, 16);
        const cupMat = new THREE.MeshBasicMaterial({ color: accentColor });

        const leftCup = new THREE.Mesh(cupGeo, cupMat);
        leftCup.rotation.z = Math.PI / 2;
        leftCup.position.set(-0.43, 0.08, 0);
        parentGroup.add(leftCup);

        const rightCup = new THREE.Mesh(cupGeo, cupMat);
        rightCup.rotation.z = Math.PI / 2;
        rightCup.position.set(0.43, 0.08, 0);
        parentGroup.add(rightCup);
        break;
      }

      case 2: {
        // Style 2: Nón Snapback Hip-Hop đội ngược cực ngầu
        const capGeo = new THREE.SphereGeometry(0.44, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        const capMat = new THREE.MeshStandardMaterial({ color: accentColor, roughness: 0.4 });
        const cap = new THREE.Mesh(capGeo, capMat);
        cap.position.set(0, 0.05, 0);
        parentGroup.add(cap);

        // Lưỡi trai nón chìa ra phía sau
        const brimGeo = new THREE.BoxGeometry(0.35, 0.03, 0.25);
        const brim = new THREE.Mesh(brimGeo, capMat);
        brim.position.set(0, 0.15, -0.48);
        brim.rotation.x = -0.25;
        parentGroup.add(brim);
        break;
      }

      case 3: {
        // Style 3: Sừng quỷ Neon cá tính (Devil Horns)
        const hornGeo = new THREE.ConeGeometry(0.1, 0.28, 8);
        const hornMat = new THREE.MeshBasicMaterial({ color: 0xFF2D55 });

        const leftHorn = new THREE.Mesh(hornGeo, hornMat);
        leftHorn.position.set(-0.22, 0.44, 0.12);
        leftHorn.rotation.set(-0.2, 0, 0.3);
        parentGroup.add(leftHorn);

        const rightHorn = new THREE.Mesh(hornGeo, hornMat);
        rightHorn.position.set(0.22, 0.44, 0.12);
        rightHorn.rotation.set(-0.2, 0, -0.3);
        parentGroup.add(rightHorn);
        break;
      }

      case 4: {
        // Style 4: Vương miện Hoàng Gia (Royal Crown) vàng kim
        const crownBaseGeo = new THREE.CylinderGeometry(0.25, 0.22, 0.18, 5, 1, true);
        const crownMat = new THREE.MeshStandardMaterial({
          color: 0xFFD700,
          metalness: 0.9,
          roughness: 0.2
        });
        const crown = new THREE.Mesh(crownBaseGeo, crownMat);
        crown.position.set(0, 0.46, 0);
        parentGroup.add(crown);
        break;
      }

      case 5:
      default: {
        // Style 5: Mũ len Beanie ấm áp với quả bông trên đỉnh
        const beanieGeo = new THREE.SphereGeometry(0.44, 16, 16, 0, Math.PI * 2, 0, Math.PI / 1.7);
        const beanieMat = new THREE.MeshStandardMaterial({ color: accentColor, roughness: 0.7 });
        const beanie = new THREE.Mesh(beanieGeo, beanieMat);
        beanie.position.set(0, 0.08, 0);
        parentGroup.add(beanie);

        // Quả bông nhỏ trên đỉnh
        const pomGeo = new THREE.SphereGeometry(0.1, 12, 12);
        const pomMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 });
        const pom = new THREE.Mesh(pomGeo, pomMat);
        pom.position.set(0, 0.52, 0);
        parentGroup.add(pom);
        break;
      }
    }
  }

  _loadAvatarTexture() {
    const avatarUrl = this.userData.profilePictureUrl;
    const proxyUrl = `/avatar?url=${encodeURIComponent(avatarUrl || '')}&username=${encodeURIComponent(this.nickname)}`;

    // Tải Avatar TikTok thật để hiển thị trên logo bên cạnh tên (Nameplate)
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = proxyUrl;
    img.onload = () => {
      this.avatarImage = img;
      this._renderNameplateCanvas();
    };
  }

  /**
   * Khởi tạo Nameplate Canvas kích thước lớn, to rõ, sắc nét
   */
  _initNameplate() {
    this.nameplateCanvas = document.createElement('canvas');
    this.nameplateCanvas.width = 960;
    this.nameplateCanvas.height = 200;
    this.nameplateCtx = this.nameplateCanvas.getContext('2d');

    this.nameplateTexture = new THREE.CanvasTexture(this.nameplateCanvas);
    this.nameplateTexture.colorSpace = THREE.SRGBColorSpace;
    this.nameplateTexture.minFilter = THREE.LinearFilter;
    this.nameplateTexture.magFilter = THREE.LinearFilter;
    this.nameplateTexture.generateMipmaps = false;

    const spriteMat = new THREE.SpriteMaterial({
      map: this.nameplateTexture,
      depthTest: false,
      transparent: true
    });

    this.nameplateSprite = new THREE.Sprite(spriteMat);
    // Khung tên to rõ nét trên sàn (3.2 x 0.68)
    this.nameplateSprite.position.set(0, 2.35, 0);
    this.nameplateSprite.scale.set(3.2, 0.68, 1);
    this.root.add(this.nameplateSprite);

    this._renderNameplateCanvas(false);
  }

  /**
   * Vẽ Nameplate với Avatar TikTok to rõ và Tên siêu đậm
   * @param {boolean} isStage - Khi ở trên sân khấu sẽ có viền vàng kim VIP hoàng gia
   */
  _renderNameplateCanvas(isStage = false) {
    if (!this.nameplateCtx) return;
    const ctx = this.nameplateCtx;
    const w = this.nameplateCanvas.width;
    const h = this.nameplateCanvas.height;

    ctx.clearRect(0, 0, w, h);

    // 1. Nền pill bo góc viền neon (vàng kim nếu trên sân khấu, xanh cyan nếu ở sàn)
    ctx.fillStyle = isStage ? 'rgba(15, 10, 30, 0.92)' : 'rgba(8, 14, 28, 0.88)';
    ctx.strokeStyle = isStage ? '#FFD700' : '#00F2FE';
    ctx.lineWidth = isStage ? 9 : 7;
    ctx.beginPath();
    ctx.roundRect(8, 8, w - 16, h - 16, (h - 16) / 2);
    ctx.fill();
    ctx.stroke();

    // 2. Avatar TikTok thật to rõ bên trái logo (Bán kính 80px)
    const avatarCenterX = 105;
    const avatarCenterY = h / 2;
    const avatarRadius = 80;

    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarCenterX, avatarCenterY, avatarRadius, 0, Math.PI * 2);
    ctx.clip();

    if (this.avatarImage && this.avatarImage.complete) {
      ctx.drawImage(
        this.avatarImage,
        avatarCenterX - avatarRadius,
        avatarCenterY - avatarRadius,
        avatarRadius * 2,
        avatarRadius * 2
      );
    } else {
      ctx.fillStyle = isStage ? '#FFD700' : '#FF2D55';
      ctx.fillRect(avatarCenterX - avatarRadius, avatarCenterY - avatarRadius, avatarRadius * 2, avatarRadius * 2);
      ctx.font = 'bold 72px Arial';
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText((this.nickname[0] || '★').toUpperCase(), avatarCenterX, avatarCenterY + 4);
    }
    ctx.restore();

    // Viền trắng/vàng phát sáng bao quanh avatar
    ctx.strokeStyle = isStage ? '#FFD700' : '#FFFFFF';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(avatarCenterX, avatarCenterY, avatarRadius, 0, Math.PI * 2);
    ctx.stroke();

    // 3. Tên người xem: font chữ to đậm 68px cực kỳ rõ nét từ xa
    let displayName = (isStage ? '👑 ' : '') + this.nickname;
    if (displayName.length > 14) {
      displayName = displayName.substring(0, 13) + '…';
    }

    ctx.font = '900 68px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    // Viền đen stroke dày chống chói và chống mờ
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 14;
    ctx.lineJoin = 'miter';
    ctx.miterLimit = 2;
    ctx.strokeText(displayName, 210, avatarCenterY);

    // Chữ trắng tinh (hoặc vàng hoàng gia nếu trên sân khấu)
    ctx.fillStyle = isStage ? '#FFF275' : '#FFFFFF';
    ctx.fillText(displayName, 210, avatarCenterY);

    this.nameplateTexture.needsUpdate = true;
  }

  showChatBubble(text) {
    this.lastActiveTime = Date.now();
    if (this.chatBubbleSprite) {
      this.root.remove(this.chatBubbleSprite);
      this.chatBubbleSprite = null;
    }
    if (this.chatTimeout) {
      clearTimeout(this.chatTimeout);
    }

    const canvas = document.createElement('canvas');
    canvas.width = 768;
    canvas.height = 240;
    const ctx = canvas.getContext('2d');

    // Nền trắng tinh dầy dặn
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.roundRect(14, 14, 740, 165, 36);
    ctx.fill();

    // Mũi nhọn tam giác
    ctx.beginPath();
    ctx.moveTo(350, 178);
    ctx.lineTo(384, 225);
    ctx.lineTo(418, 178);
    ctx.fill();

    ctx.strokeStyle = '#00F2FE';
    ctx.lineWidth = 8;
    ctx.stroke();

    ctx.fillStyle = '#0a0d18';
    ctx.font = '900 48px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    let displayMsg = text;
    if (displayMsg.length > 18) {
      displayMsg = displayMsg.substring(0, 17) + '…';
    }
    ctx.fillText(`💬 ${displayMsg}`, 384, 98);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;

    const mat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false
    });

    this.chatBubbleSprite = new THREE.Sprite(mat);
    this.chatBubbleSprite.position.set(0, 3.25, 0);
    this.chatBubbleSprite.scale.set(2.4, 0.75, 1);
    this.root.add(this.chatBubbleSprite);

    this.chatTimeout = setTimeout(() => {
      if (this.chatBubbleSprite) {
        this.root.remove(this.chatBubbleSprite);
        this.chatBubbleSprite = null;
      }
    }, 4000);
  }

  sendToStage(slotIndex, slotPosition, durationSec, danceSpeed = 1.5, danceStyle = null) {
    this.state = CHARACTER_STATE.MOVING_TO_STAGE;
    this.stageSlotIndex = slotIndex;
    this.stageTimeLeft = durationSec;
    this.danceSpeed = danceSpeed;
    this.targetPosition.copy(slotPosition);
    this.lastActiveTime = Date.now();

    // Khi lên sân khấu: Phóng to nhân vật lên 1.25x và Nameplate cực đại VIP 5.5x
    this.group.scale.set(1.25, 1.25, 1.25);
    if (this.nameplateSprite) {
      this.nameplateSprite.scale.set(5.5, 1.15, 1);
      this.nameplateSprite.position.set(0, 3.0, 0);
      this._renderNameplateCanvas(true); // Viền vàng kim VIP hoàng gia
    }

    if (danceStyle) {
      this.danceController.setStyle(danceStyle);
    } else {
      this.danceController.setRandomStyle();
    }
  }

  returnToFloor() {
    this.state = CHARACTER_STATE.RETURNING_TO_FLOOR;
    this.targetPosition.copy(this.floorHome);
    this.stageSlotIndex = -1;
    this.danceSpeed = 1.0;

    // Khi trở về sàn: Thu nhỏ nhân vật về 0.65x và Nameplate về kích thước tiêu chuẩn
    this.group.scale.set(0.65, 0.65, 0.65);
    if (this.nameplateSprite) {
      this.nameplateSprite.scale.set(3.2, 0.68, 1);
      this.nameplateSprite.position.set(0, 2.35, 0);
      this._renderNameplateCanvas(false); // Trở về viền cyan chuẩn
    }

    this.danceController.setStyle(DANCE_STYLES.BOUNCE);
  }

  update(delta, audioEnergy = 0.5) {
    this.lastActiveTime = Math.max(this.lastActiveTime, Date.now() - 3600000);

    if (this.state === CHARACTER_STATE.SPAWNING) {
      this.spawnProgress += delta * 2.5;
      if (this.spawnProgress >= 1.0) {
        this.spawnProgress = 1.0;
        this.state = CHARACTER_STATE.FLOOR_IDLE;
        this.group.position.y = this.targetPosition.y;
      } else {
        const p = this.spawnProgress;
        const currentY = this.targetPosition.y + (1 - p) * (1 - p) * this.spawnStartY;
        this.group.position.y = currentY;
      }
      this.group.position.x = this.targetPosition.x;
      this.group.position.z = this.targetPosition.z;
      return;
    }

    if (this.state === CHARACTER_STATE.MOVING_TO_STAGE || this.state === CHARACTER_STATE.RETURNING_TO_FLOOR) {
      const dist = this.group.position.distanceTo(this.targetPosition);
      if (dist < 0.2) {
        this.group.position.copy(this.targetPosition);
        if (this.state === CHARACTER_STATE.MOVING_TO_STAGE) {
          this.state = CHARACTER_STATE.STAGE_DANCING;
        } else {
          this.state = CHARACTER_STATE.FLOOR_IDLE;
        }
      } else {
        this.group.position.lerp(this.targetPosition, delta * 4.0);
        const lookDir = new THREE.Vector3().subVectors(this.targetPosition, this.group.position).normalize();
        if (lookDir.lengthSq() > 0.001) {
          this.root.rotation.y = Math.atan2(lookDir.x, lookDir.z);
        }
      }
    } else {
      if (this.state === CHARACTER_STATE.STAGE_DANCING) {
        this.root.rotation.y = THREE.MathUtils.lerp(this.root.rotation.y, 0, delta * 3.0);
      }
    }

    if (this.state === CHARACTER_STATE.STAGE_DANCING) {
      this.stageTimeLeft -= delta;
      if (this.stageTimeLeft <= 0) {
        this.returnToFloor();
      }
    }

    const pose = this.danceController.update(delta, this.danceSpeed, audioEnergy);

    this.root.position.y = pose.bodyY;
    this.root.scale.y = pose.scaleY;

    if (this.state !== CHARACTER_STATE.MOVING_TO_STAGE && this.state !== CHARACTER_STATE.RETURNING_TO_FLOOR) {
      this.bodyMesh.rotation.x = pose.bodyRotX;
      this.bodyMesh.rotation.y = pose.bodyRotY;
      this.bodyMesh.rotation.z = pose.bodyRotZ;

      if (this.headGroup) {
        this.headGroup.rotation.y = pose.headRotY;
        this.headGroup.rotation.z = pose.headRotZ;
      }
    }

    this.leftArmPivot.rotation.z = pose.leftArmRotZ;
    this.leftArmPivot.rotation.x = pose.leftArmRotX;

    this.rightArmPivot.rotation.z = pose.rightArmRotZ;
    this.rightArmPivot.rotation.x = pose.rightArmRotX;
  }

  _getColorFromId(id) {
    const palette = [
      0xFF3366, 0x00E5FF, 0x9933FF, 0x00FF99,
      0xFF9900, 0xFFCC00, 0x33FFCC, 0xFF007F,
      0x7928CA, 0x0070F3
    ];
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = ((hash << 5) - hash) + id.charCodeAt(i);
      hash |= 0;
    }
    return palette[Math.abs(hash) % palette.length];
  }

  _getHash(id) {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = ((hash << 5) - hash) + id.charCodeAt(i);
      hash |= 0;
    }
    return hash;
  }
}
