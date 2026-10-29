/**
 * Forest probability layers: calculating forest primitives with machine learning
 *
 * Bhutan ART-TREES HFLD Readiness Training, May 2026.
 * Source: EXERCISE D3_ Part 2- Forest Probability Layers-CALCULATING FOREST PRIMITIVES FOR HFLD USING MACHINE LEARNING.docx
 * Original authors: Ate Poortinga & Samuel (Conservation International).
 * Adapted with the trainers' permission for https://wangdiues.github.io/bhutan-hfld-training/
 * Code licence: MIT. Changes from the source are listed in CHANGELOG.md.
 *
 * Original Code Editor script(s):
 *   https://code.earthengine.google.com/20a6b64518a83c65143487aaf9822564
 */

// ---- Part 1: load administrative boundaries and define aoi (bhutan) ----
// Load boundaries
var Bhutan = ee.FeatureCollection("FAO/GAUL/2015/level1")
  .filter(ee.Filter.eq("ADM0_NAME", "Bhutan"));
// Define AOI (entire Bhutan)
var AOI = Bhutan;
// Display AOI
Map.addLayer(AOI, {color: 'red'}, 'Bhutan AOI');
Map.centerObject(AOI, 7);

// ---- Part 2: Create a target class definition ----
// ---------------------------------------------------------------------
// Target class definition
// Options: "CropLand", "Forest", "Grassland", "Otherland", "Settlement", "Wetland"
// ---------------------------------------------------------------------
var targetClass = "Forest"; //replace here
var targetLabel = "target";

// ---- Part 3: Load forest training samples ----
// ---------------------------------------------------------------------
// Input data
// ---------------------------------------------------------------------
var table = ee.FeatureCollection(
"projects/bhutan-hfld-readiness-training/assets/trainingData/Bhutan_labels_multiclass"
);

// ---- Part 4: Load Images ----
// ---------------------------------------------------------------------
// Load image
// ---------------------------------------------------------------------
var image = ee.Image("projects/bhutan-hfld-readiness-training/assets/landsatComposite/bhutan_ls89_2025_TashiY")
// ---------------------------------------------------------------------
// Check image
// ---------------------------------------------------------------------
print("Loaded image", image);
// ---------------------------------------------------------------------
// Visualize image (Jan–Apr)
// ---------------------------------------------------------------------
Map.addLayer(
  image,
  {
    bands: ["B4_jan_apr", "B3_jan_apr", "B2_jan_apr"],
    min: 0,
    max: 3000
  },
  "RGB Jan-Apr",
  false
);
// ---------------------------------------------------------------------
// Visualize image (Oct–Dec)
// ---------------------------------------------------------------------
Map.addLayer(
  image,
  {
    bands: ["B4_oct_dec", "B3_oct_dec", "B2_oct_dec"],
    min: 0,
    max: 3000
  },
  "RGB Oct-Dec",
  false
);

// ---- Full code for part 5: ----
// ---------------------------------------------------------------------
// Helper function for seasonal covariates
// ---------------------------------------------------------------------
function addSeasonCovariates(img, suffix) {
  var blue  = img.select("B2_" + suffix);
  var green = img.select("B3_" + suffix);
  var red   = img.select("B4_" + suffix);
  var nir   = img.select("B5_" + suffix);
  var swir1 = img.select("B6_" + suffix);
  var swir2 = img.select("B7_" + suffix);
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
  var tcb = blue.multiply(0.3029)
    .add(green.multiply(0.2786))
    .add(red.multiply(0.4733))
    .add(nir.multiply(0.5599))
    .add(swir1.multiply(0.5080))
    .add(swir2.multiply(0.1872))
    .rename("TCB_" + suffix);
  var tcg = blue.multiply(-0.2941)
    .add(green.multiply(-0.2430))
    .add(red.multiply(-0.5424))
    .add(nir.multiply(0.7276))
    .add(swir1.multiply(0.0713))
    .add(swir2.multiply(-0.1608))
    .rename("TCG_" + suffix);
  var tcw = blue.multiply(0.1511)
    .add(green.multiply(0.1973))
    .add(red.multiply(0.3283))
    .add(nir.multiply(0.3407))
    .add(swir1.multiply(-0.7117))
    .add(swir2.multiply(-0.4559))
    .rename("TCW_" + suffix);
  var tc4 = blue.multiply(-0.8239)
    .add(green.multiply(0.0849))
    .add(red.multiply(0.4396))
    .add(nir.multiply(-0.0580))
    .add(swir1.multiply(0.2013))
    .add(swir2.multiply(-0.2773))
    .rename("TC4_" + suffix);
  var tc5 = blue.multiply(-0.3294)
    .add(green.multiply(0.0557))
    .add(red.multiply(0.1056))
    .add(nir.multiply(0.1855))
    .add(swir1.multiply(-0.4349))
    .add(swir2.multiply(0.8085))
    .rename("TC5_" + suffix);
  var tc6 = blue.multiply(0.1079)
    .add(green.multiply(-0.9023))
    .add(red.multiply(0.4119))
    .add(nir.multiply(0.0575))
    .add(swir1.multiply(-0.0259))
    .add(swir2.multiply(0.0252))
    .rename("TC6_" + suffix);
  var tcAngleBG = tcb.atan2(tcg).rename("tcAngleBG_" + suffix);
  var tcAngleGW = tcg.atan2(tcw).rename("tcAngleGW_" + suffix);
  var tcAngleBW = tcb.atan2(tcw).rename("tcAngleBW_" + suffix);
  var tcDistBG = tcb.pow(2).add(tcg.pow(2)).sqrt().rename("tcDistBG_" + suffix);
  var tcDistGW = tcg.pow(2).add(tcw.pow(2)).sqrt().rename("tcDistGW_" + suffix);
  var tcDistBW = tcb.pow(2).add(tcw.pow(2)).sqrt().rename("tcDistBW_" + suffix);
  return ee.Image.cat([
    ndvi, ndwi, nbr, ndsi,
    nd_red_swir1, nd_nir_swir1, nd_nir_swir2, nd_green_swir1,
    ratio_swir1_nir, ratio_red_swir1,
    evi, savi, ndbi, mndwi, ibi,
    tcb, tcg, tcw, tc4, tc5, tc6,
    tcAngleBG, tcAngleGW, tcAngleBW,
// tcDistBG, tcDistGW, tcDistBW
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
print("Target class", targetClass);
print("Covariate stack", covariates);
print("Band names", bands);

// ---- Part 6: Convert samples to target / non-target and visualize ----
// ---------------------------------------------------------------------
// Convert stable class labels to binary target / non-target
// target = 1
// non-target = 0
// ---------------------------------------------------------------------
var samplesBinary = table.map(function(f) {
  var cls = ee.String(f.get("class_name"));
  var target = ee.Number(
    ee.Algorithms.If(cls.equals(targetClass), 1, 0)
  );
  return f.set(targetLabel, target);
});
print("Stable samples", samplesBinary.size());
print("Stable class histogram", samplesBinary.aggregate_histogram("class"));
print("Binary target histogram", samplesBinary.aggregate_histogram(targetLabel));
// ---------------------------------------------------------------------
// Display samples
// ---------------------------------------------------------------------
Map.addLayer(
  samplesBinary.filter(ee.Filter.eq(targetLabel, 1)),
  {color: "1a9850"},
  "Samples " + targetClass
);
Map.addLayer(
  samplesBinary.filter(ee.Filter.eq(targetLabel, 0)),
  {color: "d9d9d9"},
  "Samples non-" + targetClass
);

// ---- Part 7: sample covariates at training points ----
// ---------------------------------------------------------------------
// Sample covariates at stable points
// ---------------------------------------------------------------------
var sampled = covariates.sampleRegions({
  collection: samplesBinary,
  properties: [targetLabel, "class"],
  scale: 30,
  geometries: true
});

// ---- Key Functions ----
print("Stable samples", samplesBinary.size());
print("Class histogram", samplesBinary.aggregate_histogram("class"));
print("Binary histogram", samplesBinary.aggregate_histogram(targetLabel));
// ---------------------------------------------------------------------
// Random split: 90% training / 10% validation
// ---------------------------------------------------------------------
var sampledRandom = sampled.randomColumn({
  columnName: "random",
  seed: 42
});

// ---- Key Functions ----
var trainingRaw = sampledRandom.filter(ee.Filter.lt("random", 0.9));
var validation = sampledRandom.filter(ee.Filter.gte("random", 0.9));

// ---- Full code for part 8: ----
// ---------------------------------------------------------------------
// Balance training set only
// Keeps validation unbalanced for honest assessment
// ---------------------------------------------------------------------
var trainingTarget = trainingRaw.filter(ee.Filter.eq(targetLabel, 1));
var trainingNonTarget = trainingRaw.filter(ee.Filter.eq(targetLabel, 0));
var nTarget = trainingTarget.size();
var trainingNonTargetBalanced = trainingNonTarget
  .randomColumn("balance_random", 99)
  .sort("balance_random")
  .limit(nTarget);
var training = trainingTarget.merge(trainingNonTargetBalanced);
print("Training raw count", trainingRaw.size());
print("Training raw target histogram", trainingRaw.aggregate_histogram(targetLabel));
print("Balanced training count", training.size());
print("Balanced training target histogram", training.aggregate_histogram(targetLabel));
print("Validation count", validation.size());
print("Validation target histogram", validation.aggregate_histogram(targetLabel));

// ---- Non-target class (Non-forest) ----
// ---------------------------------------------------------------------
// Balance training set only
// Keeps validation unbalanced for honest assessment
// ---------------------------------------------------------------------
var trainingTarget = trainingRaw.filter(ee.Filter.eq(targetLabel, 1));
var trainingNonTarget = trainingRaw.filter(ee.Filter.eq(targetLabel, 0));
var nTarget = trainingTarget.size();
var trainingNonTargetBalanced = trainingNonTarget
  .randomColumn("balance_random", 99)
  .sort("balance_random")
  .limit(nTarget);
var training = trainingTarget.merge(trainingNonTargetBalanced);
print("Training raw count", trainingRaw.size());
print("Training raw target histogram", trainingRaw.aggregate_histogram(targetLabel));
print("Balanced training count", training.size());
print("Balanced training target histogram", training.aggregate_histogram(targetLabel));
print("Validation count", validation.size());
print("Validation target histogram", validation.aggregate_histogram(targetLabel));

// ---- Part 10: Train Random Forest Classifier ----
// ---------------------------------------------------------------------
// Train classifier
// ---------------------------------------------------------------------
var classifier = ee.Classifier.smileRandomForest({
  numberOfTrees: 200,
  bagFraction: 0.7,
  seed: 42
}).train({
  features: training,
  classProperty: targetLabel,
  inputProperties: bands
});

// ---- Parameters ----
// numberOfTrees: 200: Number of decision trees in the forest.
// bagFraction: 0.7:  Fraction of training data used for each tree.

// ---- Part 11: Accuracy Assessment ----
// ---------------------------------------------------------------------
// Training accuracy
// ---------------------------------------------------------------------
var trainingClassified = training.classify(classifier);
var trainingMatrix = trainingClassified.errorMatrix(targetLabel, "classification");
print("Training confusion matrix", trainingMatrix);
print("Training overall accuracy", trainingMatrix.accuracy());
print("Training kappa", trainingMatrix.kappa());
print("Training producer accuracy", trainingMatrix.producersAccuracy());
print("Training consumer accuracy", trainingMatrix.consumersAccuracy());

// ---- Metrics: ----
// ---------------------------------------------------------------------
// Validation accuracy
// ---------------------------------------------------------------------
var validationClassified = validation.classify(classifier);
var validationMatrix = validationClassified.errorMatrix(targetLabel, "classification");
print("Validation confusion matrix", validationMatrix);
print("Validation overall accuracy", validationMatrix.accuracy());
print("Validation kappa", validationMatrix.kappa());
print("Validation producer accuracy", validationMatrix.producersAccuracy());
print("Validation consumer accuracy", validationMatrix.consumersAccuracy());

// ---- What this step does: ----
var explanation = classifier.explain();
print("Variable importance", explanation.get("importance"));

// ---- 1 = Target ----
// ---------------------------------------------------------------------
// Classify image
// ---------------------------------------------------------------------
var targetNonTarget = covariates
  .select(bands)
  .classify(classifier)
  .rename("target_non_target");
// 0 = non-target
// 1 = target
Map.addLayer(
  targetNonTarget,
  {
    min: 0,
    max: 1,
    palette: ["d9d9d9", "1a9850"]
  },
// targetClass + " / Non-" + targetClass
);
// Target mask only
var targetMask = targetNonTarget.eq(1).selfMask();
Map.addLayer(
  targetMask,
  {palette: ["1a9850"]},
  targetClass + " mask only",
  false
);

// ---- What this step does: ----
// ---------------------------------------------------------------------
// Target probability
// ---------------------------------------------------------------------
var probabilityClassifier = classifier.setOutputMode("PROBABILITY");
var targetProbability = covariates
  .select(bands)
  .classify(probabilityClassifier)
  .rename("target_probability");
Map.addLayer(
  targetProbability,
  {
    min: 0,
    max: 1,
    palette: ["ffffff", "a1d99b", "006d2c"]
  },
  targetClass + " probability",
  false
);

// ---- Part 15: Center Map ----
Map.centerObject(table, 8);

// ---- Classified Map (Binary) ----
Export.image.toDrive({
  image: targetNonTarget.toByte(),
  description: "bhutan_" + targetClass + "_non_" + targetClass + "_2024",
  region: image.geometry(),
  scale: 30,
  maxPixels: 1e13
});

// ---- Probability Map (Continuous) ----
Export.image.toDrive({
  image: targetProbability,
  description: "bhutan_" + targetClass + "_probability_2024",
  region: image.geometry(),
  scale: 30,
  maxPixels: 1e13
});

// ---- Output Result: ----
Export.table.toDrive({
  collection: validationClassified,
  description: "bhutan_" + targetClass + "_validation_points_2024",
  fileFormat: "CSV"
});

// ---- 2. Export to GEE Asset (ToAsset) ----
Export.image.toAsset({
  image: targetProbability.toFloat(),
  description: "bhutan_" + targetClass + "_2024",
  assetId: "projects/servir-mekong/bhutan_primitives/_ls_" + targetClass + "_2024",
  region: image.geometry(),
  scale: 30,
  maxPixels: 1e13
});

// ---- Workflow Concept: Primitive-Based Mapping ----
var targetClass = "Forest";
var targetLabel = "target";
var targetClass = "CropLand";
var targetClass = "Forest";
var targetClass = "Grassland";
var targetClass = "Otherland";
var targetClass = "Settlement";
var targetClass = "Wetland";
