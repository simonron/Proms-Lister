(()=>{'use strict';
const base=new URL('./',location.href);
const local=path=>new URL(path,base).href;

function configurePdf(){
  if(window.pdfjsLib?.GlobalWorkerOptions){
    window.pdfjsLib.GlobalWorkerOptions.workerSrc=local('vendor/pdf.worker.min.js');
  }
}

async function recognizeLocal(image,langs='eng',options={}){
  if(!window.Tesseract?.createWorker)throw new Error('OCR library unavailable');
  const worker=await window.Tesseract.createWorker(langs,1,{
    workerPath:local('vendor/tesseract-worker.min.js'),
    corePath:local('vendor/tesseract-core'),
    langPath:local('vendor/lang'),
    ...options
  });
  try{return await worker.recognize(image)}finally{await worker.terminate()}
}

function configureTesseract(){
  if(!window.Tesseract)return;
  window.Tesseract.recognize=recognizeLocal;
}

configurePdf();
configureTesseract();
window.addEventListener('load',()=>{configurePdf();configureTesseract()},{once:true});
})();
