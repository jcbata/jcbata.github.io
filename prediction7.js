const predictButton = document.getElementById('predictButton');
const inputImage = document.getElementById('inputImage');
const imagePreview = document.getElementById('imagePreview');
const predictionResult = document.getElementById('predictionResult');

etiqueta = [
    ['Ambulancia','La imágen es correcta, corresponde a un servicio de traslado de pacientes']
    ,['Documento','Es probable que se observe su expediente, suba una otra imagen de fachada de su establecimiento']
    ,['Establecimiento Urbano','La imagen es aceptable, Establecimiento en Zona Urbana']
    ,['Establecimiento Rural','La imagen es aceptable, Establecimiento en Zona Rural']
    ,['Edificio histórico','Es probable que su expediente sea observado, suba una imagen de un establecimiento de salud']
    ,['Persona','Es probable que su expediente sea observado, suba otra imagen de su establecimiento sin personas']
    ,['Error','Es probable que su expediente sea observado, No se aprecia la fachada de su establecimiento de salud']
]

async function loadModel() {
  // Cargar el modelo Keras desde un servidor remoto
  console.log("Cargando modelo...");
  model = await tf.loadGraphModel('./ipress_model3/model.json');
  
  console.log("Modelo cargado.");
}
loadModel();
inputImage.addEventListener('change', function() {
  const reader = new FileReader();
  reader.onload = function() {
    imagePreview.src = reader.result;
    predictionResult.innerHTML = "";
  }
  reader.readAsDataURL(inputImage.files[0]);
});

predictButton.addEventListener('click', async function() {


 
  // Preprocesar la imagen para adaptarla al modelo
  const image = tf.browser.fromPixels(imagePreview);

  //image.width = "250";
  //image.height = "250";
  processedImage = tf.cast( tf.image.resizeBilinear(image, [250, 250]),
  'float32'
  )
  norm = tf.fill([250,250,3],255)
  //processedImage = tf.div(processedImage,norm);
  processedImage = tf.cast(tf.expandDims(processedImage),'float32');

  // Realizar la predicción
  const prediction = model.predict(processedImage);

  // Mostrar el resultado de la predicción
  r1 = prediction.dataSync();

  id_prediction = 6;
  // se verifica si algún elemento de la predicción tiene presición mayor al 50%
  if( r1.some(function (el){return el>.5;})){
    id_prediction= prediction.argMax(1).dataSync()[0];
  }


  predictionResult.innerHTML = `${etiqueta[id_prediction][0]} <br>
    ${etiqueta[id_prediction][1]}`;
  console.log(prediction.dataSync());

});
