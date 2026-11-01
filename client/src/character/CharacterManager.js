import * as THREE from 'three';
import { ChibiCharacter, CHARACTER_STATE } from './Character.js';

export class CharacterManager {
  constructor(scene, maxCharacters = 80) {
    this.scene = scene;
    this.maxCharacters = maxCharacters;
    this.characters = new Map(); // userId -> ChibiCharacter

    // Vùng sàn nhảy trung tâm ấm cúng, tập trung trước sân khấu
    this.floorBounds = {
      minX: -4.2,
      maxX: 4.2,
      minZ: 0.8,
      maxZ: 5.8
    };
  }

  getCharacter(userId) {
    return this.characters.get(userId);
  }

  getAllCharacters() {
    return Array.from(this.characters.values());
  }

  getCount() {
    return this.characters.size;
  }

  getOrCreate(userData) {
    const userId = userData.userId || 'anon_' + Math.random().toString(36).substr(2, 9);

    if (this.characters.has(userId)) {
      const char = this.characters.get(userId);
      char.lastActiveTime = Date.now();
      return char;
    }

    if (this.characters.size >= this.maxCharacters) {
      this._evictOldestInactive();
    }

    const newChar = new ChibiCharacter(userData);

    const spawnPos = this._findAvailableFloorSpot();
    newChar.targetPosition.copy(spawnPos);
    newChar.floorHome.copy(spawnPos);
    newChar.position.copy(spawnPos);

    this.scene.add(newChar.group);
    this.characters.set(userId, newChar);

    return newChar;
  }

  _findAvailableFloorSpot() {
    const minDistance = 0.85; // Khoảng cách đám đông tự nhiên
    let attempts = 0;
    const maxAttempts = 30;

    while (attempts < maxAttempts) {
      const x = THREE.MathUtils.randFloat(this.floorBounds.minX, this.floorBounds.maxX);
      const z = THREE.MathUtils.randFloat(this.floorBounds.minZ, this.floorBounds.maxZ);
      const candidate = new THREE.Vector3(x, 0, z);

      let tooClose = false;
      for (const char of this.characters.values()) {
        if (char.floorHome.distanceTo(candidate) < minDistance) {
          tooClose = true;
          break;
        }
      }

      if (!tooClose) {
        return candidate;
      }
      attempts++;
    }

    return new THREE.Vector3(
      THREE.MathUtils.randFloat(this.floorBounds.minX, this.floorBounds.maxX),
      0,
      THREE.MathUtils.randFloat(this.floorBounds.minZ, this.floorBounds.maxZ)
    );
  }

  _evictOldestInactive() {
    let oldestUser = null;
    let oldestTime = Infinity;

    for (const [userId, char] of this.characters.entries()) {
      if (char.state === CHARACTER_STATE.STAGE_DANCING || char.state === CHARACTER_STATE.MOVING_TO_STAGE) {
        continue;
      }

      if (char.lastActiveTime < oldestTime) {
        oldestTime = char.lastActiveTime;
        oldestUser = userId;
      }
    }

    if (oldestUser) {
      this.removeCharacter(oldestUser);
    }
  }

  removeCharacter(userId) {
    if (!this.characters.has(userId)) return;
    const char = this.characters.get(userId);
    this.scene.remove(char.group);
    this.characters.delete(userId);
  }

  clearFloor() {
    const toRemove = [];
    for (const [userId, char] of this.characters.entries()) {
      if (char.state !== CHARACTER_STATE.STAGE_DANCING && char.state !== CHARACTER_STATE.MOVING_TO_STAGE) {
        toRemove.push(userId);
      }
    }
    for (const id of toRemove) {
      this.removeCharacter(id);
    }
  }

  update(delta, audioEnergy = 0.5) {
    const chars = this.getAllCharacters();

    const separationRadius = 0.85;
    const forceFactor = 0.9;

    for (let i = 0; i < chars.length; i++) {
      const c1 = chars[i];
      if (c1.state !== CHARACTER_STATE.FLOOR_IDLE) continue;

      const pushVector = new THREE.Vector3();

      for (let j = 0; j < chars.length; j++) {
        if (i === j) continue;
        const c2 = chars[j];
        if (c2.state !== CHARACTER_STATE.FLOOR_IDLE) continue;

        const diff = new THREE.Vector3().subVectors(c1.group.position, c2.group.position);
        diff.y = 0;
        const dist = diff.length();

        if (dist > 0 && dist < separationRadius) {
          diff.normalize().multiplyScalar((separationRadius - dist) / separationRadius);
          pushVector.add(diff);
        }
      }

      if (pushVector.lengthSq() > 0) {
        c1.group.position.addScaledVector(pushVector, delta * forceFactor);

        c1.group.position.x = THREE.MathUtils.clamp(c1.group.position.x, this.floorBounds.minX, this.floorBounds.maxX);
        c1.group.position.z = THREE.MathUtils.clamp(c1.group.position.z, this.floorBounds.minZ, this.floorBounds.maxZ);
      }
    }

    for (const char of chars) {
      char.update(delta, audioEnergy);
    }
  }
}
