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

export function STLViewerEnable(classname) {
  var models = document.getElementsByClassName(classname);
  for (var i = 0; i < models.length; i++) {
      STLViewer(models[i], models[i].getAttribute("data-src"));
  }
}

export function STLViewer(elem, model) {

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
  controls.enableDamping = true;
  controls.rotateSpeed = 0.05;
  controls.dampingFactor = 0.1;
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.autoRotate = true;
  controls.autoRotateSpeed = .75;

  var scene = new Scene();

  scene.add(new HemisphereLight(0xffffff, 0x080820, 1.5));

  (new STLLoader()).load(model, function (geometry) {
      var material = new MeshPhongMaterial({ color: 0x00ff00, specular: 100, shininess: 100 });
      var mesh = new Mesh(geometry, material);
      scene.add(mesh);

      // Compute the middle
      var middle = new Vector3();
      geometry.computeBoundingBox();
      geometry.boundingBox.getCenter(middle);

      // Center it
      mesh.position.x = -1 * middle.x;
      mesh.position.y = -1 * middle.y;
      mesh.position.z = -1 * middle.z;

      // Pull the camera away as needed
      var largestDimension = Math.max(geometry.boundingBox.max.x,
          geometry.boundingBox.max.y, geometry.boundingBox.max.z)
      camera.position.z = largestDimension * 1.5;


      var animate = function () {
          requestAnimationFrame(animate);
          controls.update();
          renderer.render(scene, camera);
      }; animate();

  });
}

window.onload = function() {
   STLViewerEnable("stlviewer");
} 