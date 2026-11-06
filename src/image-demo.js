
import * as THREE from 'three';

import {
    MindARThree
} from '../vendor/mindar/mindar-image-three.prod.js';

import {
    setStatus
} from './common.js';

// =================================
// KONFIGURASI IMAGE TRACKING
// =================================

const TARGET_SRC = './targets/target-card.mind';

const TARGET_ASPECT = 372 / 674;

let foundCount = 0;
let mindarThree = null;
let isRunning = false;

// =================================
// ELEMEN HTML
// =================================

const container = document.getElementById('container');
const info = document.getElementById('info');
const consent = document.getElementById('consent');
const startBtn = document.getElementById('startBtn');

// =================================
// MEMBUAT OBJEK 3D
// =================================

function create3DObject(scene, anchor) {

    // Bingkai gambar target
    const frameGeometry = new THREE.EdgesGeometry(
        new THREE.PlaneGeometry(1, TARGET_ASPECT)
    );

    const frameMaterial = new THREE.LineBasicMaterial({
        color: 0x14b8a6
    });

    const frame = new THREE.LineSegments(
        frameGeometry,
        frameMaterial
    );

    anchor.group.add(frame);

    // Objek Torus Knot
    const knotGeometry = new THREE.TorusKnotGeometry(
        0.12,
        0.04,
        100,
        16
    );

    const knotMaterial = new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        roughness: 0.4,
        metalness: 0.2
    });

    const knot = new THREE.Mesh(
        knotGeometry,
        knotMaterial
    );

    knot.position.set(0, 0, 0.2);

    anchor.group.add(knot);

    // Cahaya
    const ambientLight = new THREE.HemisphereLight(
        0xffffff,
        0x667788,
        1.5
    );

    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(
        0xffffff,
        1.5
    );

    directionalLight.position.set(0.5, 1, 1);

    scene.add(directionalLight);

    return knot;
}

// =================================
// FUNGSI MENJALANKAN KAMERA
// =================================

async function startCamera() {

    if (isRunning) return;

    try {

        setStatus('Memeriksa kamera...', 'searching');

        info.textContent = 'Menghubungkan kamera...';

        // Periksa dukungan kamera
        if (
            !navigator.mediaDevices ||
            !navigator.mediaDevices.getUserMedia
        ) {
            throw new Error(
                'Kamera membutuhkan HTTPS atau localhost.'
            );
        }

        // Periksa file target
        const response = await fetch(TARGET_SRC);

        if (!response.ok) {
            throw new Error(
                'File targets/target-card.mind tidak ditemukan.'
            );
        }

        // Inisialisasi MindAR
        mindarThree = new MindARThree({

            container: container,

            imageTargetSrc: TARGET_SRC,

            maxTrack: 1,

            uiLoading: 'yes',

            uiScanning: 'yes',

            uiError: 'yes'

        });

        const {
            renderer,
            scene,
            camera
        } = mindarThree;

        // Anchor target pertama
        const anchor = mindarThree.addAnchor(0);

        // Membuat objek 3D
        const knot = create3DObject(scene, anchor);

        // Target ditemukan
        anchor.onTargetFound = () => {

            foundCount++;

            setStatus('Target terdeteksi', 'found');

            info.textContent =
                'Target ditemukan ' + foundCount + ' kali.';

        };

        // Target hilang
        anchor.onTargetLost = () => {

            setStatus('Mencari target...', 'searching');

            info.textContent =
                'Arahkan kamera ke gambar target.';

        };

        // Meminta izin kamera dan memulai MindAR
        setStatus('Meminta izin kamera...', 'searching');

        await mindarThree.start();

        isRunning = true;

        consent.style.display = 'none';

        setStatus('Kamera aktif', 'searching');

        info.textContent =
            'Kamera aktif. Arahkan ke gambar target.';

        // Animasi objek
        const clock = new THREE.Clock();

        renderer.setAnimationLoop(() => {

            const delta = clock.getDelta();

            knot.rotation.y += delta * 1.5;

            knot.rotation.x += delta * 0.5;

            renderer.render(scene, camera);

        });

    } catch (error) {

        console.error('Kesalahan:', error);

        setStatus('Kamera gagal dijalankan', 'idle');

        info.textContent = 'Error: ' + error.message;

        if (mindarThree) {

            try {
                mindarThree.stop();
            } catch (e) {
                console.error(e);
            }

            mindarThree = null;

        }

        isRunning = false;

        startBtn.disabled = false;

    }

}

// =================================
// TOMBOL MULAI
// =================================

startBtn.addEventListener('click', async () => {

    startBtn.disabled = true;

    await startCamera();

});

// =================================
// STATUS AWAL
// =================================

setStatus('Belum dimulai', 'idle');

info.textContent =
    'Tekan tombol Mulai Kamera untuk memulai.';
