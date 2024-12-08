import { atom } from 'nanostores';
import * as THREE from 'three';

export const imagesToProcess: any = atom([]);
export const draggableObjects: any = atom([]);
export const scene: any = atom(new THREE.Scene());
