/**
 * Hệ thống 5 điệu nhảy Procedural (thủ tục) mượt mà cho nhân vật Chibi
 * Dễ dàng kết nối thêm Skeletal Animation (Mixamo GLB/FBX) bất cứ lúc nào
 */

export const DANCE_STYLES = {
  WIGGLE: 'wiggle',       // Lắc hông qua lại
  BOUNCE: 'bounce',       // Nhún nhảy theo beat
  WAVE_HANDS: 'waveHands',// Vẫy hai tay trên cao
  SPIN_TWIST: 'spinTwist',// Xoay tròn và twist
  GROOVE: 'groove'        // Nhún lắc kiểu Hip-hop
};

export class ProceduralDanceController {
  constructor() {
    this.currentStyle = DANCE_STYLES.BOUNCE;
    this.nextStyle = null;
    this.crossfadeTime = 0.4;
    this.fadeProgress = 1.0;
    this.time = Math.random() * 10;
  }

  setStyle(styleName) {
    if (this.currentStyle === styleName) return;
    this.nextStyle = styleName;
    this.fadeProgress = 0.0;
  }

  setRandomStyle() {
    const styles = Object.values(DANCE_STYLES);
    const chosen = styles[Math.floor(Math.random() * styles.length)];
    this.setStyle(chosen);
  }

  update(delta, speedMultiplier = 1.0, audioEnergy = 0.5) {
    this.time += delta * speedMultiplier * (1.0 + audioEnergy * 0.5);

    if (this.nextStyle && this.fadeProgress < 1.0) {
      this.fadeProgress += delta / this.crossfadeTime;
      if (this.fadeProgress >= 1.0) {
        this.currentStyle = this.nextStyle;
        this.nextStyle = null;
        this.fadeProgress = 1.0;
      }
    }

    const pose1 = this._evaluateStyle(this.currentStyle, this.time, audioEnergy);
    if (!this.nextStyle) {
      return pose1;
    }

    const pose2 = this._evaluateStyle(this.nextStyle, this.time, audioEnergy);
    return this._lerpPose(pose1, pose2, this.fadeProgress);
  }

  _evaluateStyle(style, t, energy) {
    const bounceHeight = 0.15 + energy * 0.12;

    switch (style) {
      case DANCE_STYLES.WIGGLE: {
        const wiggleX = Math.sin(t * 5.0) * 0.12;
        const tiltZ = Math.sin(t * 5.0) * 0.2;
        const headTilt = -tiltZ * 0.7;
        const yOffset = Math.abs(Math.sin(t * 5.0)) * bounceHeight * 0.5;

        return {
          bodyY: yOffset,
          bodyRotX: 0,
          bodyRotY: Math.sin(t * 2.5) * 0.3,
          bodyRotZ: tiltZ,
          headRotZ: headTilt,
          headRotY: Math.sin(t * 2.5) * 0.2,
          leftArmRotZ: Math.PI / 4 + Math.sin(t * 5.0) * 0.3,
          rightArmRotZ: -Math.PI / 4 - Math.sin(t * 5.0) * 0.3,
          leftArmRotX: 0,
          rightArmRotX: 0,
          scaleY: 1.0 + Math.sin(t * 10.0) * 0.04
        };
      }

      case DANCE_STYLES.BOUNCE: {
        const bounce = Math.abs(Math.sin(t * 6.0)) * bounceHeight;
        const squash = Math.sin(t * 6.0) * 0.08;

        return {
          bodyY: bounce,
          bodyRotX: Math.sin(t * 6.0) * 0.1,
          bodyRotY: 0,
          bodyRotZ: Math.sin(t * 3.0) * 0.08,
          headRotZ: -Math.sin(t * 3.0) * 0.05,
          headRotY: 0,
          leftArmRotZ: Math.PI / 6 + Math.sin(t * 6.0) * 0.4,
          rightArmRotZ: -Math.PI / 6 - Math.sin(t * 6.0) * 0.4,
          leftArmRotX: Math.sin(t * 6.0) * 0.3,
          rightArmRotX: Math.sin(t * 6.0) * 0.3,
          scaleY: 1.0 - squash
        };
      }

      case DANCE_STYLES.WAVE_HANDS: {
        const yOffset = Math.abs(Math.sin(t * 5.0)) * bounceHeight * 0.6;
        const armWave = Math.sin(t * 5.0) * 0.6;

        return {
          bodyY: yOffset,
          bodyRotX: 0,
          bodyRotY: Math.sin(t * 2.5) * 0.2,
          bodyRotZ: Math.sin(t * 5.0) * 0.1,
          headRotZ: -Math.sin(t * 5.0) * 0.08,
          headRotY: 0,
          // Giơ hai tay lên cao qua đầu
          leftArmRotZ: Math.PI * 0.75 + armWave,
          rightArmRotZ: -Math.PI * 0.75 + armWave,
          leftArmRotX: Math.sin(t * 4.0) * 0.2,
          rightArmRotX: Math.sin(t * 4.0) * 0.2,
          scaleY: 1.0
        };
      }

      case DANCE_STYLES.SPIN_TWIST: {
        const yOffset = Math.abs(Math.sin(t * 7.0)) * bounceHeight;

        return {
          bodyY: yOffset,
          bodyRotX: Math.sin(t * 4.0) * 0.05,
          bodyRotY: (t * 2.5) % (Math.PI * 2), // Xoay quanh trục Y
          bodyRotZ: Math.sin(t * 6.0) * 0.12,
          headRotZ: 0,
          headRotY: Math.sin(t * 5.0) * 0.3,
          leftArmRotZ: Math.PI / 3 + Math.sin(t * 5.0) * 0.3,
          rightArmRotZ: -Math.PI / 3 - Math.sin(t * 5.0) * 0.3,
          leftArmRotX: 0,
          rightArmRotX: 0,
          scaleY: 1.0
        };
      }

      case DANCE_STYLES.GROOVE:
      default: {
        const rock = Math.sin(t * 4.0);
        const yOffset = Math.abs(Math.sin(t * 4.0)) * bounceHeight * 0.8;

        return {
          bodyY: yOffset,
          bodyRotX: rock * 0.2, // Gật gù trước sau
          bodyRotY: Math.sin(t * 2.0) * 0.3,
          bodyRotZ: Math.cos(t * 2.0) * 0.1,
          headRotZ: 0,
          headRotY: -Math.sin(t * 2.0) * 0.2,
          leftArmRotZ: Math.PI / 5 + rock * 0.3,
          rightArmRotZ: -Math.PI / 5 - rock * 0.3,
          leftArmRotX: rock * 0.4,
          rightArmRotX: -rock * 0.4,
          scaleY: 1.0 + Math.sin(t * 8.0) * 0.03
        };
      }
    }
  }

  _lerpPose(p1, p2, t) {
    const res = {};
    for (const key in p1) {
      res[key] = p1[key] + (p2[key] - p1[key]) * t;
    }
    return res;
  }
}
