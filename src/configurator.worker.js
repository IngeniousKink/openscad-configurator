import { addMCAD } from "../lib/openscad.mcad.js";
import { addFonts } from "../lib/openscad.fonts.js";

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
  addFonts(inst);

  // If a source code string is provided, use it. Otherwise, fetch the SCAD source from the file with the given url
  let scadSource;
  if (source) {
    scadSource = source;
  } else {
    const sourceRes = await fetch(url);
    scadSource = await sourceRes.text();
  }
  inst.FS.writeFile("/source.scad", scadSource);

  const features = ['manifold', 'fast-csg', 'lazy-union'];

  const argList = ["/source.scad", "-o", "out.stl"];
  
  for (const [key, value] of Object.entries(features)) {
    argList.push('--enable');
    argList.push(value);
  }
  
  // Generate the command arguments using key-value pairs from params
  for (const [key, value] of Object.entries(params)) {
    argList.push(`-D${key}=${value}`);
  }
  console.log('Invoking OpenSCAD with', argList);
  inst.callMain(argList);
  const output = inst.FS.readFile("/out.stl");

  return output;
}
