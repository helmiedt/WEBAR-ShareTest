// Using a direct web link instead of npm so it works on GitHub Pages without building!
import { bootstrapCameraKit, createMediaStreamSource } from "https://esm.sh/@snap/camera-kit";

let startButton, stopButton, shareButton, downloadButton, closeBtn;
let liveRenderTarget, videoContainer;
let mediaRecorderOptions, mediaRecorder, downloadUrl;

async function main() {
    init();

    // 1. YOUR SNAP CREDENTIALS
    const apiToken = "eyJhbGciOiJIUzI1NiIsImtpZCI6IkNhbnZhc1MyU0hNQUNQcm9kIiwidHlwIjoiSldUIn0.eyJhdWQiOiJjYW52YXMtY2FudmFzYXBpIiwiaXNzIjoiY2FudmFzLXMyc3Rva2VuIiwibmJmIjoxNzM3NzEwMDI0LCJzdWIiOiI3OTUxMmFjOS1kNDhkLTRiMWQtYmM1MS04NTU5NTcwYzM4MDZ-UFJPRFVDVElPTn5lZTFjOTkxYi01NjM4LTQyNDktYmMwNS01ZGNjMDQ0MjM3ODgifQ.YApgqfnpIXzp4FOw9wYK90dwlbbvgR0hdCIdgN8cvgE"; // <--- Don't forget to paste this!
    const cameraKit = await bootstrapCameraKit({ apiToken });

    liveRenderTarget = document.getElementById("canvas-container");
    const session = await cameraKit.createSession({ liveRenderTarget: liveRenderTarget });
    liveRenderTarget.replaceWith(session.output.live);

    session.events.addEventListener('error', (event) => {
        if (event.detail.error.name === 'LensExecutionError') {
            console.log('The current Lens encountered an error and was removed.', event.detail.error);
        }
    });

    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode:'environment' } });
    const source = createMediaStreamSource(stream, { cameraType: 'back' });
    
    await session.setSource(source);

    // 2. YOUR LENS AND GROUP IDS
    const lens = await cameraKit.lensRepository.loadLens(
        '3e440a7f-88db-4756-a84c-285e4146d485', // Hair Simulation Lens ID
        '94d68245-abc3-4ba1-a267-74641abfdbe0'  // EDT-shareCAM Group ID
    );
    
    await session.applyLens(lens);
    session.source.setRenderSize(window.innerWidth, window.innerHeight);
    await session.play();
    console.log("Lens rendering has started!");
}

function init() {
    startButton = document.getElementById("start-btn");
    stopButton = document.getElementById("stop-btn");
    shareButton = document.getElementById("share-btn");
    downloadButton = document.getElementById("download-btn");
    closeBtn = document.getElementById("close-btn");
    
    const recordControls = document.getElementById("record-controls");
    const playbackControls = document.getElementById("playback-controls");
    const videoPreviewContainer = document.getElementById("video-preview-container");
    videoContainer = videoPreviewContainer;

    mediaRecorderOptions = { audio: false, video: true, videoBitsPerSecond: 2500000 };
    
    startButton.addEventListener("click", () => {
        startButton.style.display = 'none';
        stopButton.style.display = 'block';

        const mediaStream = liveRenderTarget.captureStream(30);
        mediaRecorder = new MediaRecorder(mediaStream, mediaRecorderOptions);
        
        let chunks = [];
        mediaRecorder.ondataavailable = function(e) {
             chunks.push(e.data);
        };

        mediaRecorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'video/mp4' });
            globalThis.blob = blob;

            const existingVideo = document.querySelector('#video-preview-container video');
            if (existingVideo) {
                existingVideo.remove();
            }

            const video = document.createElement("video");
            video.src = URL.createObjectURL(blob);
            video.setAttribute('autoplay', '');
            video.setAttribute('muted', '');
            video.setAttribute('loop', '');
            video.setAttribute('playsinline', '');
            video.setAttribute('crossorigin', 'anonymous');
            
            videoPreviewContainer.appendChild(video);
            videoPreviewContainer.style.display = 'block';
            recordControls.style.display = 'none';
            playbackControls.style.display = 'flex';
            closeBtn.style.display = 'block';
        };

        mediaRecorder.start();
    });

    stopButton.addEventListener("click", () => {
        mediaRecorder.stop();
        stopButton.style.display = 'none';
    });
    
    downloadButton.addEventListener("click", () => {
        if (!globalThis.blob) return;
        const downloadUrl = window.URL.createObjectURL(globalThis.blob);
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = "webar_rec.mp4";
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(downloadUrl);
    });
    
    shareButton.addEventListener("click", async () => {
        if (!globalThis.blob) return;
        if (navigator.share) {
            const file = new File([globalThis.blob], 'webar_rec.mp4', { type: 'video/mp4' });
            const shareData = {
                files: [file],
                title: 'Lens Studio CameraKit',
                text: 'Testing Native Share Functionality.',
            };

            if (navigator.canShare && navigator.canShare(shareData)) {
                navigator.share(shareData)
                .then(() => console.log('Share was successful.'))
                .catch((error) => console.log('Sharing failed', error));
            } else {
                console.log("Your system doesn't support sharing files");
            }
        }
    });
    
    closeBtn.addEventListener("click", () => {
        videoPreviewContainer.style.display = 'none';
        playbackControls.style.display = 'none';
        closeBtn.style.display = 'none';
        recordControls.style.display = 'block';
    });
}

document.addEventListener("DOMContentLoaded", main);
