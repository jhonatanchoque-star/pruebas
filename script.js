// --- General elements ---
const fileNameInput = document.getElementById("fileName");

// --- Photo Section ---
const startPhotoBtn = document.getElementById("startPhotoBtn");
const cameraContainerPhoto = document.getElementById("cameraContainerPhoto");
const videoPhoto = document.getElementById("videoPhoto");
const capturePhotoBtn = document.getElementById("capturePhotoBtn");
const previewContainerPhoto = document.getElementById("previewContainerPhoto");
const canvasPhoto = document.getElementById("canvasPhoto");
const previewImagePhoto = document.getElementById("previewImagePhoto");
const savePhotoBtn = document.getElementById("savePhotoBtn");

let streamPhoto = null;

// --- Scan Section ---
const startScanBtn = document.getElementById("startScanBtn");
const cameraContainerScan = document.getElementById("cameraContainerScan");
const videoScan = document.getElementById("videoScan");
const captureScanBtn = document.getElementById("captureScanBtn");
const previewContainerScan = document.getElementById("previewContainerScan");
const previewImageScan = document.getElementById("previewImageScan");
const addPageBtn = document.getElementById("addPageBtn");
const downloadPdfBtn = document.getElementById("downloadPdfBtn");
const pdfDownloadContainer = document.getElementById("pdfDownloadContainer");

let streamScan = null;
let capturedImages = [];

// --- Cropper Modal ---
const cropperModal = document.getElementById("cropperModal");
const imageToCrop = document.getElementById("imageToCrop");
const confirmCropBtn = document.getElementById("confirmCropBtn");
const closeBtn = document.getElementsByClassName("close-btn")[0];
const cropBtn = document.getElementById("cropBtn");
let cropper = null;

// --- Helper Functions ---
function stopCamera(stream) {
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
  }
}

function downloadImage(dataUrl, name) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

async function generateAndDownloadPdf(images, name) {
  const { jsPDF } = window.jspdf;

  if (images.length === 0) {
    alert("No pages to download.");
    return;
  }

  // Initialize the document with the first image
  const doc = new jsPDF("p", "mm", "a4");
  const imgProps = doc.getImageProperties(images[0]);
  const pdfWidth = doc.internal.pageSize.getWidth();
  const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
  doc.addImage(images[0], "JPEG", 0, 0, pdfWidth, pdfHeight);

  // Add the additional pages from the second image onwards
  for (let i = 1; i < images.length; i++) {
    doc.addPage();
    const nextImgProps = doc.getImageProperties(images[i]);
    const nextPdfHeight = (nextImgProps.height * pdfWidth) / nextImgProps.width;
    doc.addImage(images[i], "JPEG", 0, 0, pdfWidth, nextPdfHeight);
  }

  doc.save(`${name}.pdf`);
}

// --- Photo Logic ---
startPhotoBtn.addEventListener("click", async () => {
  stopCamera(streamScan);
  cameraContainerPhoto.style.display = "block";
  previewContainerPhoto.style.display = "none";
  try {
    streamPhoto = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    });
    videoPhoto.srcObject = streamPhoto;
  } catch (err) {
    console.error("Error accessing the camera:", err);
    alert("No se pudo acceder a la cámara. Por favor, revisa tus permisos.");
  }
});

capturePhotoBtn.addEventListener("click", () => {
  const context = canvasPhoto.getContext("2d");

  context.drawImage(videoPhoto, 0, 0, 704, 480);

  const imageDataUrl = canvasPhoto.toDataURL("image/jpeg", 0.9);
  previewImagePhoto.src = imageDataUrl;

  stopCamera(streamPhoto);
  cameraContainerPhoto.style.display = "none";
  previewContainerPhoto.style.display = "block";
});

savePhotoBtn.addEventListener("click", () => {
  const fileName = fileNameInput.value.trim();
  if (!fileName) {
    alert("Por favor, ingresa un nombre primero.");
    return;
  }

  const imageDataUrl = previewImagePhoto.src;
  downloadImage(imageDataUrl, `${fileName}_IMAGEN.jpg`);

  previewContainerPhoto.style.display = "none";
});

// --- Scan Logic ---
startScanBtn.addEventListener("click", async () => {
  stopCamera(streamPhoto);
  cameraContainerScan.style.display = "block";
  previewContainerScan.style.display = "none";
  pdfDownloadContainer.style.display = "none";
  capturedImages = [];
  try {
    streamScan = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      },
    });
    videoScan.srcObject = streamScan;
  } catch (err) {
    console.error("Error accessing the camera:", err);
    alert("No se pudo acceder a la cámara. Por favor, revisa tus permisos.");
  }
});

captureScanBtn.addEventListener("click", () => {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  canvas.width = videoScan.videoWidth;
  canvas.height = videoScan.videoHeight;
  context.drawImage(videoScan, 0, 0, canvas.width, canvas.height);

  const imageDataUrl = canvas.toDataURL("image/jpeg", 1.0);
  previewImageScan.src = imageDataUrl;

  stopCamera(streamScan);
  cameraContainerScan.style.display = "none";
  previewContainerScan.style.display = "block";
  pdfDownloadContainer.style.display = "none";
});

cropBtn.addEventListener("click", () => {
  cropperModal.style.display = "block";
  imageToCrop.src = previewImageScan.src;

  if (cropper) {
    cropper.destroy();
  }
  cropper = new Cropper(imageToCrop, {
    aspectRatio: NaN,
    viewMode: 1,
    dragMode: "move",
    autoCropArea: 0.8,
    ready() {
      const imageData = cropper.getImageData();
      cropper.setCropBoxData({
        left: 0,
        top: 0,
        width: imageData.width,
        height: imageData.height,
      });
    },
  });
});

confirmCropBtn.addEventListener("click", () => {
  if (cropper) {
    const croppedDataUrl = cropper
      .getCroppedCanvas()
      .toDataURL("image/jpeg", 1.0);

    previewImageScan.src = croppedDataUrl;
    cropperModal.style.display = "none";
    cropper.destroy();
  }
});

closeBtn.addEventListener("click", () => {
  cropperModal.style.display = "none";
  if (cropper) {
    cropper.destroy();
  }
});

window.addEventListener("click", (event) => {
  if (event.target == cropperModal) {
    cropperModal.style.display = "none";
    if (cropper) {
      cropper.destroy();
    }
  }
});

addPageBtn.addEventListener("click", () => {
  const imageDataUrl = previewImageScan.src;
  if (imageDataUrl) {
    capturedImages.push(imageDataUrl);
    alert(`Página ${capturedImages.length} agregada!`);

    previewContainerScan.style.display = "none";
    cameraContainerScan.style.display = "block";

    navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
      streamScan = stream;
      videoScan.srcObject = streamScan;
    });
  }

  pdfDownloadContainer.style.display = "block";
});

downloadPdfBtn.addEventListener("click", () => {
  const fileName = fileNameInput.value.trim();
  if (!fileName) {
    alert("Por favor, ingresa un nombre primero.");
    return;
  }

  const lastImage = previewImageScan.src;
  if (lastImage && !capturedImages.includes(lastImage)) {
    capturedImages.push(lastImage);
  }

  if (capturedImages.length === 0) {
    alert("No hay páginas para descargar.");
    return;
  }

  generateAndDownloadPdf(capturedImages, `${fileName}_pdf`);

  previewContainerScan.style.display = "none";
  pdfDownloadContainer.style.display = "none";
});
