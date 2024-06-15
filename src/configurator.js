import { STLViewer } from './stlviewer.js';

const form = document.getElementById("configurator");
const downloadBtn = document.getElementById("download_button");
const previewBtn = document.getElementById("preview_button");
const cancelBtn = document.getElementById("cancel");
const spinnerImg = document.getElementById("spinner");
const preview = document.getElementById('preview');

let worker;

cancelBtn.onclick = (e) => {
  e.preventDefault();

  if(worker){
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

const triggerWorker = async (callback) => {
  worker = new Worker("./configurator.worker.js");

  worker.onmessage = function (e) {
    callback(e.data);
    spinnerImg.hidden = true;
    generateBtn.disabled = false;
    worker.terminate();
  };

  spinnerImg.hidden = false;
  previewBtn.disabled = true;
  downloadBtn.disabled = true;

  const values = new FormData(form);
  worker.postMessage({
    pitch: values.get("pitch"),
    teeth: values.get("teeth"),
    thickness: values.get("thickness"),
    boreDiameter: values.get("bore-diameter"),
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

function renderFile(output) {
  const url = URL.createObjectURL(
    new Blob([output], { type: "application/octet-stream" }),
  );

  STLViewer(div, url);
}
