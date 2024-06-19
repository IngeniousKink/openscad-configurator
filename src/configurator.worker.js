import { addMCAD } from "../lib/openscad.mcad.js";

onmessage = async function(e) {
  const { params, url, source } = e.data; // Destructure the data object to get params, url, and source
  const model = await generateModel(params, url, source);
  postMessage(model);
};

async function generateModel(params, url, source) {
  globalThis.OpenSCAD = {
    noInitialRun: true,
  };

  importScripts("./openscad.wasm.js");

  await new Promise(resolve => {
    globalThis.OpenSCAD.onRuntimeInitialized = () => resolve();
  });

  const inst = globalThis.OpenSCAD;
  addMCAD(inst);

  // If a source code string is provided, use it. Otherwise, fetch the SCAD source from the file with the given url
  let scadSource;
  if (source) {
    scadSource = source;
  } else {
    const sourceRes = await fetch(url);
    scadSource = await sourceRes.text();
  }
  inst.FS.writeFile("/source.scad", scadSource);

  // Generate the command arguments using key-value pairs from params
  const argList = ["/source.scad", "-o", "out.stl"];
  for (const [key, value] of Object.entries(params)) {
    argList.push(`-D${key.toUpperCase()}=${value}`);
  }
  console.log('Invoking OpenSCAD with', argList);
  inst.callMain(argList);
  const output = inst.FS.readFile("/out.stl");

  return output;
}