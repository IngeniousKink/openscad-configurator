import {
  Scene,
  WebGLRenderer,
  PerspectiveCamera,
  HemisphereLight,
  MeshPhongMaterial,
  Mesh,
  Vector3,
} from 'three';

import WebGL from 'three/examples/jsm/capabilities/WebGL.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';

export function STLViewer(elem) {
  if (!WebGL.isWebGLAvailable()) {
    elem.appendChild(WebGL.getWebGLErrorMessage());
    return;
  }

  var renderer = new WebGLRenderer({ antialias: true, alpha: true });
  var camera = new PerspectiveCamera(70, elem.clientWidth / elem.clientHeight, 1, 1000);
  renderer.setSize(elem.clientWidth, elem.clientHeight);
  elem.appendChild(renderer.domElement);

  window.addEventListener('resize', function () {
    renderer.setSize(elem.clientWidth, elem.clientHeight);
    camera.aspect = elem.clientWidth / elem.clientHeight;
    camera.updateProjectionMatrix();
  }, false);

  var controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = false;
  controls.dampingFactor = 0.1;
  controls.enableZoom = true;
  controls.enablePan = false;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 1;

  var scene = new Scene();
  scene.add(new HemisphereLight(0xffffff, 0x080820, 1.5));

  var stlLoader = new STLLoader();
  var currentMesh;
  var animate = function () {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  };
  animate();

  // Return the loadModel callback function
  return function loadModel(model) {

    stlLoader.load(model, function (geometry) {
      var material = new MeshPhongMaterial({ color: 0x00ff00, specular: 100, shininess: 100 });

      if (currentMesh) {
        // Clear previous model from the scene if available
        scene.remove(currentMesh);
      }
      currentMesh = new Mesh(geometry, material);
      scene.add(currentMesh);

      // Compute the middle
      var middle = new Vector3();
      geometry.computeBoundingBox();
      geometry.boundingBox.getCenter(middle);

      // Center it
      currentMesh.position.x = -1 * middle.x;
      currentMesh.position.y = -1 * middle.y;
      currentMesh.position.z = -1 * middle.z;

      currentMesh.rotation.x = Math.PI * 1/2;
      currentMesh.rotation.y = Math.PI * 4/3;

      // Pull the camera away as needed
      var largestDimension = Math.max(
        geometry.boundingBox.max.x,
        geometry.boundingBox.max.y,
        geometry.boundingBox.max.z
      );

      camera.position.z = largestDimension * 1.5;
    });
  };
}

const form = document.getElementById("configurator");
const downloadBtn = document.getElementById("download_button");
const previewBtn = document.getElementById("preview_button");
const cancelBtn = document.getElementById("cancel");
const spinnerImg = document.getElementById("spinner");
const preview = document.getElementById('preview');

let worker;

cancelBtn.onclick = (e) => {
  e.preventDefault();

  if (worker) {
    worker.terminate();
  }

  spinnerImg.hidden = true;
  previewBtn.disabled = false;
  downloadBtn.disabled = false;
};

form.onsubmit = (e) => {
  e.preventDefault();
  triggerWorker(renderFile);
}

previewBtn.onclick = (e) => {
  e.preventDefault();
  triggerWorker(renderFile);
}

downloadBtn.onclick = (e) => {
  e.preventDefault();
  triggerWorker(downloadFile);
}

window.onload = (e) => {
  triggerWorker(renderFile);
}

const triggerWorker = async (callback) => {
  worker = new Worker("./configurator.worker.js");

  worker.onmessage = function (e) {
    callback(e.data);
    spinnerImg.hidden = true;
    previewBtn.disabled = false;
    downloadBtn.disabled = false;
    worker.terminate();
  };

  spinnerImg.hidden = false;
  previewBtn.disabled = true;
  downloadBtn.disabled = true;

  const values = new FormData(form);
  const params = {};

  
  for (const [key, value] of values.entries()) {
    if (key !== 'url') {
      const input = document.getElementById(key);
      console.log(input.type);
      if (input.type === "checkbox") {
        params[key] = value === "on";
      } else if (input.type === "number") {
       params[key] = Number(value);
      } else {
       params[key] = value;
      }
    }
  }
  
  worker.postMessage({
    url: values.get('url'),
    params: params
  });
  
};

function downloadFile(output) {

  const fileName = 'generated.stl';

  const link = document.createElement("a");
  link.href = URL.createObjectURL(
    new Blob([output], { type: "application/octet-stream" }),
  );
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
}

let loadModel;

function renderFile(output) {
  const url = URL.createObjectURL(
    new Blob([output], { type: "application/octet-stream" }),
  );

  if (!loadModel) {
    loadModel = STLViewer(preview);
  }

  loadModel(url);
}



