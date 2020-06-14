const input = document.getElementById('live-stream');

let displaySize = {width: input.offsetWidth, height: input.offsetHeight};

const canvas = document.getElementById('overlay')
const canvasContext = canvas.getContext("2d");

const faceFilters = [
	"angry.png",
	"neutral.png",
	"happy.png",
	"surprised.png"
].map(function(src) {
	const i = new Image();
	i.src = "face-filters/" + src;
	return i;
});

let currentExpression = "neutral";

faceapi.nets.faceExpressionNet.loadFromUri("models");
faceapi.nets.tinyFaceDetector.loadFromUri("models");

setupCameraInput();
setInterval(() => {
	lookForFaces();
}, 100);

function drawFace(detections, expressions) {
	canvasContext.clearRect(0, 0, canvas.width, canvas.height);

	if (moodDetectionMode) {
		currentExpression = Object.keys(expressions).reduce((a, b) => expressions[a] > expressions[b] ? a : b);
	}

	const box = detections[0].box
	const imgWidth = box.width * 1.70;
	const imgHeight = box.height * 1.75;
	const x = box.x - imgWidth / 4;
	const y = box.y - imgHeight / 3;
	const exprImg = faceFilters.filter(f => f.src.includes(currentExpression))[0];
	canvasContext.drawImage(exprImg, x, y, imgWidth, imgHeight)
}

async function lookForFaces() {

	if (input.offsetWidth !== displaySize.width || input.offsetHeight !== displaySize.height) {
		displaySize = {width: input.offsetWidth, height: input.offsetHeight};
		faceapi.matchDimensions(canvas, displaySize);
	}

	const detectionResult = await faceapi.detectAllFaces(input,
	new faceapi.TinyFaceDetectorOptions({inputSize: 128})).withFaceExpressions();

	if (detectionResult.length === 0) {return}

	const detections = [detectionResult[0].detection];
	const expressions = detectionResult[0].expressions;
	const resizedDetections = faceapi.resizeResults(detections, displaySize)

	drawFace(resizedDetections, expressions);
}

async function setupCameraInput() {
	let stream = null;
	let constraints = {
		audio: false,
		video: {
			facingMode: "user"
		}
	};

	try {
		stream = await navigator.mediaDevices.getUserMedia(constraints);
		var video = document.querySelector('video');
		video.srcObject = stream;
	} catch (err) {
		input.style.display = "none";
		document.getElementById('mood-detection').style.display = "none";
		document.getElementById('camera-denied').style.display = "inherit";
	}
}

let moodDetectionMode = true;

function selectFilter(mood) {
	currentExpression = mood;
}
