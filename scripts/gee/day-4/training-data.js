/**
 * Collecting training data and supervised Random Forest classification
 *
 * Bhutan ART-TREES HFLD Readiness Training, May 2026.
 * Source: EXERCISE D3_ Part 1-Collecting Training Data-Supervised Classification Method - Random Forest Model.docx
 * Original authors: Ate Poortinga & Samuel (Conservation International).
 * Adapted with the trainers' permission for https://wangdiues.github.io/bhutan-hfld-training/
 * Code licence: MIT. Changes from the source are listed in CHANGELOG.md.
 *
 * Original Code Editor script(s):
 *   https://code.earthengine.google.com/49b9fc4c9f6ad7e7a8c58933f3aba994
 *   https://code.earthengine.google.com/cca70a27a7d28a5fe8bd1e03b88ec6ba
 */

// ---- AlphaEarth embeddings ----
var visRGB_jan = {
  bands: ['B4_jan_apr','B3_jan_apr','B2_jan_apr'],
  min: 0,
  max: 1000
};
var visRGB_oct = {
  bands: ['B4_oct_dec','B3_oct_dec','B2_oct_dec'],
  min: 0,
  max: 1000
};
Map.addLayer(image, visRGB_jan, 'Jan-Apr RGB 2024');
Map.addLayer(image, visRGB_oct, 'Oct-Dec RGB 2024');
var visRGB_jan = {
  bands: ['B4_jan_apr','B3_jan_apr','B2_jan_apr'],
  min: 0,
  max: 1000
};
var visRGB_oct = {
  bands: ['B4_oct_dec','B3_oct_dec','B2_oct_dec'],
  min: 0,
  max: 1000
};
Map.addLayer(image, visRGB_jan, 'Jan-Apr RGB 2024');
Map.addLayer(image, visRGB_oct, 'Oct-Dec RGB 2024');
Map.addLayer(
  alphaEarth,
  {bands: ["A01", "A16", "A09"], min: -0.3, max: 0.3},
  "AlphaEarth embeddings RGB",
  false
);

// ---- Part 4: Sampling Image with Covariates ----
// =====================================================================
// Part 4: Sampling Image with Covariates
// =====================================================================
// 📌 Purpose:
// Extract pixel values from the covariate stack at each training sample location.
// This converts image data into a table for machine learning.
// 📊 Output:
// Each row represents one sample point
// Each column represents a covariate (e.g., NDVI, elevation, NDWI, etc.)
var trainingData = covariates.sampleRegions({
// collection: sample,        // training samples
  properties: ['class'],     // class label
  scale: 10,                 // Sentinel-2 resolution (10 m)
  geometries: true           // keep geometry (optional)
});
// ---------------------------------------------------------------------
// Remove samples with missing values
// ---------------------------------------------------------------------
trainingData = trainingData.filter(
  ee.Filter.notNull(covariates.bandNames())
);
// ---------------------------------------------------------------------
// Inspect result
// ---------------------------------------------------------------------
print("Training Dataset:", trainingData);

// ---- Part 5: Export training sample ----
// =====================================================================
// 5. Export Training Dataset
// =====================================================================
Export.table.toAsset({
// collection: trainingData,                    // dataset to export
// description: 'bhutan_training_dataset_2025', // task name
  assetId: 'projects/your_project/bhutan_training_dataset_2025'
});

// ---- Samples from GEE Asset ----
// ---------------------------------------------------------------------
// Load exported samples from GEE Asset
// ---------------------------------------------------------------------
// 📌 Description:
// These samples were exported in Part 5 and stored as a GEE Asset.
// The dataset contains 6 land cover classes:
// 1 = CropLand, 2 = Forest, 3 = Grassland,
// 4 = Otherland, 5 = Settlement, 6 = Wetland
// This dataset will be used as reference data for supervised classification.
var table = ee.FeatureCollection(
"projects/bhutan-hfld-readiness-training/assets/trainingData/Bhutan_stable_classes "
);

// ---- Convert Class to Numeric (1–6) ----
// ---------------------------------------------------------------------
// Convert class labels (string) → numeric values (1–6)
// ---------------------------------------------------------------------
// 📌 Purpose:
// Machine learning models require numeric labels instead of text.
var samplesMulti = table.map(function(f) {
  var cls = ee.String(f.get("class"));
  var classId = ee.Number(
    ee.Algorithms.If(cls.equals("CropLand"), 1,
    ee.Algorithms.If(cls.equals("Forest"), 2,
    ee.Algorithms.If(cls.equals("Grassland"), 3,
    ee.Algorithms.If(cls.equals("Otherland"), 4,
    ee.Algorithms.If(cls.equals("Settlement"), 5,
    ee.Algorithms.If(cls.equals("Wetland"), 6, 0)
  ))))))
  ;
  return f.set("class", classId);
});
print("Class histogram", samplesMulti.aggregate_histogram("class"));

// ---- Sample Image and Covariates ----
// ---------------------------------------------------------------------
// Extract covariate values at sample locations
// ---------------------------------------------------------------------
var sampled = covariates.sampleRegions({
  collection: samplesMulti,
  properties: ["class"],
  scale: 10,
  geometries: true
}).filter(ee.Filter.notNull(bands));
print("Sampled count", sampled.size());
print("Sampled class histogram", sampled.aggregate_histogram("class"));

// ---- Display Classification ----
// ---------------------------------------------------------------------
// Visualize land cover classification
// ---------------------------------------------------------------------
Map.addLayer(
  classified,
  {
    min: 1,
    max: 6,
    palette: [
      'AAFF00', // CropLand
      '267300', // Forest
      'D7C29E', // Grassland
      'FFFFBE', // Otherland
      'E600A9', // Settlement
      '004DA8'  // Wetland
    ]
  },
  "Land Cover Classification"
);

// ---- Comparison with Primitive Approach ----
// Supervised Classification (this step)
// Primitive Approach

// ---- Full Supervised Classification Workflow Script (Insert Code Below) ----
// =====================================================================
// MULTI-CLASS LAND COVER CLASSIFICATION USING SENTINEL-2 (BHUTAN)
// ---------------------------------------------------------------------
// This script demonstrates a supervised machine learning workflow
// using Random Forest to classify land cover into 6 classes.
// =====================================================================
// ---------------------------------------------------------------------
// Target class definition
// Options: "CropLand", "Forest", "Grassland", "Otherland", "Settlement", "Wetland"
// ---------------------------------------------------------------------
// 1. INPUT DATA
// ---------------------------------------------------------------------
// 📌 Description:
// Load reference samples (stable land cover classes) and Sentinel-2 image.
var table = ee.FeatureCollection(
"projects/bhutan-hfld-readiness-training/assets/trainingData/Bhutan_labels_multiclass"
);
var image = ee.Image(
  "projects/servir-mekong/bhutan_primitives/s2_2025_janapr_octdec_int16"
);
// ---------------------------------------------------------------------
// 2. VISUAL CHECK
// ---------------------------------------------------------------------
// 📌 Purpose:
// Quickly inspect input imagery for quality and seasonal differences.
Map.addLayer(
  image,
  {bands: ["B4_jan_apr", "B3_jan_apr", "B2_jan_apr"], min: 0, max: 3000},
  "S2 RGB Jan–Apr",
  false
);
Map.addLayer(
  image,
  {bands: ["B4_oct_dec", "B3_oct_dec", "B2_oct_dec"], min: 0, max: 3000},
  "S2 RGB Oct–Dec",
  false
);
// ---------------------------------------------------------------------
// Helper function for Sentinel-2 seasonal covariates
// S2 bands used:
// B2 = blue, B3 = green, B4 = red, B8 = nir, B11 = swir1, B12 = swir2
// ---------------------------------------------------------------------
function addSeasonCovariates(img, suffix) {
  var blue  = img.select("B2_" + suffix);
  var green = img.select("B3_" + suffix);
  var red   = img.select("B4_" + suffix);
  var nir   = img.select("B8_" + suffix);
  var swir1 = img.select("B11_" + suffix);
  var swir2 = img.select("B12_" + suffix);
  var ndvi = nir.subtract(red).divide(nir.add(red)).rename("NDVI_" + suffix);
  var ndwi = green.subtract(nir).divide(green.add(nir)).rename("NDWI_" + suffix);
  var nbr = nir.subtract(swir2).divide(nir.add(swir2)).rename("NBR_" + suffix);
  var ndsi = green.subtract(swir1).divide(green.add(swir1)).rename("NDSI_" + suffix);
  var nd_red_swir1 = red.subtract(swir1).divide(red.add(swir1)).rename("ND_red_swir1_" + suffix);
  var nd_nir_swir1 = nir.subtract(swir1).divide(nir.add(swir1)).rename("ND_nir_swir1_" + suffix);
  var nd_nir_swir2 = nir.subtract(swir2).divide(nir.add(swir2)).rename("ND_nir_swir2_" + suffix);
  var nd_green_swir1 = green.subtract(swir1).divide(green.add(swir1)).rename("ND_green_swir1_" + suffix);
  var ratio_swir1_nir = swir1.divide(nir).rename("R_swir1_nir_" + suffix);
  var ratio_red_swir1 = red.divide(swir1).rename("R_red_swir1_" + suffix);
  var evi = nir.subtract(red)
    .multiply(2.5)
    .divide(nir.add(red.multiply(6)).subtract(blue.multiply(7.5)).add(1))
    .rename("EVI_" + suffix);
  var savi = nir.subtract(red)
    .multiply(1.5)
    .divide(nir.add(red).add(0.5))
    .rename("SAVI_" + suffix);
  var ndbi = swir1.subtract(nir).divide(swir1.add(nir)).rename("NDBI_" + suffix);
  var mndwi = green.subtract(swir1).divide(green.add(swir1)).rename("MNDWI_" + suffix);
  var ibi = ndbi.subtract(savi.add(mndwi).divide(2))
    .divide(ndbi.add(savi.add(mndwi).divide(2)))
    .rename("IBI_" + suffix);
  return ee.Image.cat([
    ndvi, ndwi, nbr, ndsi,
    nd_red_swir1, nd_nir_swir1, nd_nir_swir2, nd_green_swir1,
    ratio_swir1_nir, ratio_red_swir1,
// evi, savi, ndbi, mndwi, ibi
  ]);
}
// ---------------------------------------------------------------------
// Build covariate stack
// ---------------------------------------------------------------------
var covJanApr = addSeasonCovariates(image, "jan_apr");
var covOctDec = addSeasonCovariates(image, "oct_dec");
var dem = ee.Image("USGS/SRTMGL1_003").rename("elevation");
var terrain = ee.Terrain.products(dem);
var elevation = dem.rename("elevation");
var slope = terrain.select("slope").rename("slope");
var aspect = terrain.select("aspect").rename("aspect");
var aspectRad = aspect.multiply(Math.PI).divide(180);
var eastness = aspectRad.sin().rename("eastness");
var northness = aspectRad.cos().rename("northness");
var terrainCov = ee.Image.cat([
  elevation,
  slope,
  aspect,
  eastness,
  northness
]);
var jrc = ee.Image("JRC/GSW1_4/GlobalSurfaceWater");
var jrcCov = jrc.select([
  "occurrence",
  "change_abs",
  "change_norm",
  "seasonality",
  "transition",
  "max_extent"
]).unmask(0);
var covariates = image
  .addBands(covJanApr)
  .addBands(covOctDec)
  .addBands(terrainCov)
  .addBands(jrcCov);
var bands = covariates.bandNames();
print("Covariate stack", covariates);
print("Band names", bands);
// ---------------------------------------------------------------------
// 4. CONVERT CLASS → NUMERIC (1–6)
// ---------------------------------------------------------------------
// 📌 Purpose:
// Convert string labels into numeric values required for classification.
var samplesMulti = table.map(function(f) {
  var cls = ee.String(f.get("class_name"));
  var classId = ee.Number(
    ee.Algorithms.If(cls.equals("CropLand"), 1,
    ee.Algorithms.If(cls.equals("Forest"), 2,
    ee.Algorithms.If(cls.equals("Grassland"), 3,
    ee.Algorithms.If(cls.equals("Otherland"), 4,
    ee.Algorithms.If(cls.equals("Settlement"), 5,
    ee.Algorithms.If(cls.equals("Wetland"), 6, 0)
  ))))))
  ;
  return f.set("class", classId);
});
print("Class histogram", samplesMulti.aggregate_histogram("class"));
// ---------------------------------------------------------------------
// 5. SAMPLE COVARIATES
// ---------------------------------------------------------------------
// 📌 Purpose:
// Extract covariate values at sample locations to build training dataset.
var sampled = covariates.sampleRegions({
  collection: samplesMulti,
  properties: ["class"],
  scale: 10,
  geometries: true
}).filter(ee.Filter.notNull(bands));
print("Sampled count", sampled.size());
print("Sampled class histogram", sampled.aggregate_histogram("class"));
// ---------------------------------------------------------------------
// 6. TRAIN / VALIDATION SPLIT
// ---------------------------------------------------------------------
// 📌 Split dataset into training (80%) and validation (20%).
var sampledRandom = sampled.randomColumn("random", 42);
var training = sampledRandom.filter(ee.Filter.lt("random", 0.8));
var validation = sampledRandom.filter(ee.Filter.gte("random", 0.8));
// ---------------------------------------------------------------------
// 7. TRAIN RANDOM FOREST MODEL
// ---------------------------------------------------------------------
var classifier = ee.Classifier.smileRandomForest({
  numberOfTrees: 100,
  bagFraction: 0.7,
  seed: 42
}).train({
  features: training,
  classProperty: "class",
  inputProperties: bands
});
// ---------------------------------------------------------------------
// 8. ACCURACY ASSESSMENT
// ---------------------------------------------------------------------
var validationClassified = validation.classify(classifier);
var matrix = validationClassified.errorMatrix("class", "classification");
print("Confusion Matrix", matrix);
print("Overall Accuracy", matrix.accuracy());
print("Kappa", matrix.kappa());
// ---------------------------------------------------------------------
// 9. CLASSIFY IMAGE
// ---------------------------------------------------------------------
var classified = covariates
  .select(bands)
  .classify(classifier)
  .rename("landcover");
// ---------------------------------------------------------------------
// 10. DISPLAY RESULT
// ---------------------------------------------------------------------
Map.addLayer(
  classified,
  {
    min: 1,
    max: 6,
    palette: [
      'AAFF00', // CropLand
      '267300', // Forest
      'D7C29E', // Grassland
      'FFFFBE', // Otherland
      'E600A9', // Settlement
      '004DA8'  // Wetland
    ]
  },
  "Land Cover Classification"
);
// ---------------------------------------------------------------------
// 11. VARIABLE IMPORTANCE
// ---------------------------------------------------------------------
var explanation = classifier.explain();
print("Variable importance", explanation.get("importance"));
// ---------------------------------------------------------------------
// 12. EXPORT RESULT
// ---------------------------------------------------------------------
Export.image.toDrive({
  image: classified.toByte(),
  description: "bhutan_multiclass_landcover_2025",
  region: image.geometry(),
  scale: 10,
  maxPixels: 1e13
});
// ---------------------------------------------------------------------
Map.centerObject(table, 8);
