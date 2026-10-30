/**
 * Land cover classification and cosine similarity using AlphaEarth Foundations embeddings
 *
 * Bhutan ART-TREES HFLD Readiness Training, May 2026.
 * Source: EXERCISE D4_ Land Cover Classification and Cosine Simarity Using AFE.docx ("Similarity" in the title)
 * Original authors: Ate Poortinga & Samuel (Conservation International).
 * Adapted with the trainers' permission for https://wangdiues.github.io/bhutan-hfld-training/
 * Code licence: MIT. Changes from the source are listed in CHANGELOG.md:
 *   - The exercise's two scripts run one after the other: Part A (a primitive from embeddings with
 *     Gradient Tree Boost) and Part B (cosine similarity search). Part C (change between years) was
 *     written for the website.
 *   - The binary layer's name is restored (commented out when the code was extracted).
 *   - The similarity mask is exported to your own project instead of projects/servir-mekong/temp.
 *
 * Original Code Editor script(s):
 *   https://code.earthengine.google.com/6f392726575a952a1060b31390acf071
 *   https://code.earthengine.google.com/7d6d85cb415ba01ec5e4b92a74ff6e04
 */

// ==== PART A: A PRIMITIVE FROM EMBEDDINGS (Gradient Tree Boost) ====
// ---- Part 1: Load boundaries and define the AOI ----
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

// ---- Part 3: Load forest training samples ----
// ---------------------------------------------------------------------
// Input training samples
// ---------------------------------------------------------------------
var table = ee.FeatureCollection(
"projects/bhutan-hfld-readiness-training/assets/trainingData/Bhutan_labels_multiclass"
);
// ---------------------------------------------------------------------
// AlphaEarth / Satellite Embedding input image
// ---------------------------------------------------------------------
var year = 2024;
var alphaEarth = ee.ImageCollection("GOOGLE/SATELLITE_EMBEDDING/V1/ANNUAL")
  .filterDate(year + "-01-01", year + "-12-31")
  .filterBounds(table.geometry())
  .mosaic()
var bands = alphaEarth.bandNames();
print("Target class", targetClass);
print("AlphaEarth image", alphaEarth);
print("AlphaEarth bands", bands);
// ---------------------------------------------------------------------
// Visual check
// ---------------------------------------------------------------------
Map.addLayer(
  alphaEarth,
  {bands: ["A01", "A16", "A09"], min: -0.3, max: 0.3},
  "AlphaEarth embeddings RGB",
  false
);

// ---- Part 5: Prepare Binary Training Samples ----
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

// ---- Part 6: Sample AlphaEarth Embeddings ----
// ---------------------------------------------------------------------
// Sample AlphaEarth embeddings at stable points
// ---------------------------------------------------------------------
var sampled = alphaEarth.sampleRegions({
  collection: samplesBinary,
  properties: [targetLabel, "class"],
  scale: 10,
  geometries: true
});
print("Sampled count", sampled.size());
print("Sampled class histogram", sampled.aggregate_histogram("class"));
print("Sampled target histogram", sampled.aggregate_histogram(targetLabel));

// ---- Part 7: Split Training and Validation Data ----
// ---------------------------------------------------------------------
// Random split: 90% training / 10% validation
// ---------------------------------------------------------------------
var sampledRandom = sampled.randomColumn({
  columnName: "random",
  seed: 42
});
var trainingRaw = sampledRandom.filter(ee.Filter.lt("random", 0.9));
var validation = sampledRandom.filter(ee.Filter.gte("random", 0.9));

// ---- Part 8: Balance the Training Dataset ----
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

// ---- Part 9: Train the Classification Model ----
// ---------------------------------------------------------------------
// Train classifier
// ---------------------------------------------------------------------
// ---------------------------------------------------------------------
// Train classifier: Gradient Tree Boosting
// ---------------------------------------------------------------------
var classifier = ee.Classifier.smileGradientTreeBoost({
  numberOfTrees: 200,
  shrinkage: 0.05,
  samplingRate: 0.7,
  maxNodes: null,
  loss: "LeastSquares",
  seed: 42
}).train({
  features: training,
  classProperty: targetLabel,
  inputProperties: bands
});

// ---- Part 10: Accuracy Assessment ----
// ---------------------------------------------------------------------
// Accuracy assessment
// ---------------------------------------------------------------------
var trainingClassified = training.classify(classifier);
var trainingMatrix = trainingClassified.errorMatrix(targetLabel, "classification");
print("Training confusion matrix", trainingMatrix);
print("Training overall accuracy", trainingMatrix.accuracy());
print("Training kappa", trainingMatrix.kappa());
print("Training producer accuracy", trainingMatrix.producersAccuracy());
print("Training consumer accuracy", trainingMatrix.consumersAccuracy());
var validationClassified = validation.classify(classifier);
var validationMatrix = validationClassified.errorMatrix(targetLabel, "classification");
print("Validation confusion matrix", validationMatrix);
print("Validation overall accuracy", validationMatrix.accuracy());
print("Validation kappa", validationMatrix.kappa());
print("Validation producer accuracy", validationMatrix.producersAccuracy());
print("Validation consumer accuracy", validationMatrix.consumersAccuracy());

// ---- Part 11: Variable Importance Analysis ----
// ---------------------------------------------------------------------
// Variable importance
// Note: AlphaEarth bands are learned embedding dimensions.
// Importance is useful diagnostically but not physically interpretable.
// ---------------------------------------------------------------------
var explanation = classifier.explain();
print("Classifier explanation", explanation);
print("Variable importance", explanation.get("importance"));

// ---- Part 12: Generate Land Cover Classification ----
// ---------------------------------------------------------------------
// Classify AlphaEarth image
// ---------------------------------------------------------------------
var targetNonTarget = alphaEarth
  .select(bands)
  .classify(classifier)
  .rename("target_non_target");
Map.addLayer(
  targetNonTarget,
  {
    min: 0,
    max: 1,
    palette: ["d9d9d9", "1a9850"]
  },
  targetClass + " / Non-" + targetClass + " AlphaEarth"
);
var targetMask = targetNonTarget.eq(1).selfMask();
Map.addLayer(
  targetMask,
  {palette: ["1a9850"]},
  targetClass + " mask only AlphaEarth",
  false
);

// ---- Part 13: Generate Probability Map ----
// ---------------------------------------------------------------------
// Probability map
// ---------------------------------------------------------------------
var probabilityClassifier = classifier.setOutputMode("PROBABILITY");
var targetProbability = alphaEarth
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
  targetClass + " probability AlphaEarth",
  false
);
// ---------------------------------------------------------------------
// Center map
// ---------------------------------------------------------------------
Map.centerObject(table, 8);

// ---- Part 14: Export Results ----
// ---------------------------------------------------------------------
// Export classified map to Drive
// ---------------------------------------------------------------------
Export.image.toDrive({
  image: targetNonTarget.toByte(),
  description: "bhutan_alphaearth_" + targetClass + "_non_" + targetClass + "_" + year,
  region: table.geometry(),
  scale: 10,
  maxPixels: 1e13
});
// ---------------------------------------------------------------------
// Export probability map to Drive
// ---------------------------------------------------------------------
Export.image.toDrive({
  image: targetProbability,
  description: "bhutan_alphaearth_" + targetClass + "_probability_" + year,
  region: table.geometry(),
  scale: 10,
  maxPixels: 1e13
});
// ---------------------------------------------------------------------
// Export validation points with predictions
// ---------------------------------------------------------------------
Export.table.toDrive({
  collection: validationClassified,
  description: "bhutan_alphaearth_" + targetClass + "_validation_points_" + year,
  fileFormat: "CSV"
});

// ==== PART B: COSINE SIMILARITY SEARCH ====
// ---- Part 1: Import Area of Interest (AOI) or Draw Geometry Directly ----
AOI =
    /* color: #ffc82d */
    /* shown: false */
    /* displayProperties: [
      {
        "type": "rectangle"
      }
    ] */
    ee.Geometry.Polygon(
        [[[89.30518463043553, 27.61982143783619],
          [89.30518463043553, 27.163797899190204],
          [89.79956939606053, 27.163797899190204],
          [89.79956939606053, 27.61982143783619]]], null, false);

// ---- Part 2: Import Samples or Draw Geometry Directly (Point) ----
var geometry =
    /* color: #0b4a8b */
    /* shown: false */
    ee.Geometry.MultiPoint(
        [[89.63806729944004, 27.47230147869957],
         [89.65160335073784, 27.433917324710603],
         [89.4196042791559, 27.40841583709242],
         [89.51004115251821, 27.21272923974669]]);

// ---- Part 3: Define and Visualize the Area of Interest (AOI) ----
// ---------------------------------------------------------------------
// 1. SEARCH AREA (AOI)
// ---------------------------------------------------------------------
Map.centerObject(AOI, 11);
Map.setOptions('SATELLITE');
// AOI plus a 1 km margin (the exercise's comment called it a smaller AOI)
var smallAOI = AOI.buffer(1000);
Map.addLayer(AOI, {color: 'red'},'AOI', false);

// ---- Part 4: Create Reference Samples ----
// ---------------------------------------------------------------------
// 4. REFERENCE SAMPLES
// ---------------------------------------------------------------------
var samples = ee.FeatureCollection(
  geometry.coordinates().map(function(c) {
    c = ee.List(c);
    return ee.Feature(
      ee.Geometry.Point([
        c.get(0),
        c.get(1)
      ])
    );
  })
);

// ---- Part 5: Randomly Select Reference Samples (Optional) ----
// ---------------------------------------------------------------------
// Randomly select only 5 samples (Optional)
// ---------------------------------------------------------------------
// samples = samples
//   .randomColumn('random', 42)
//   .sort('random')
//   .limit(5);
// print('Random samples', samples);
// Map.addLayer(samples, {color: 'yellow'},'Random samples');

// ---- Part 6: Load AlphaEarth Foundation Embeddings ----
// ---------------------------------------------------------------------
// 3. YEAR
// ---------------------------------------------------------------------
var year = 2024;
var startDate = ee.Date.fromYMD(year, 1, 1);
var endDate = startDate.advance(1, 'year');
// ---------------------------------------------------------------------
// 4. LOAD ALPHAEARTH EMBEDDINGS
// ---------------------------------------------------------------------
var embeddings = ee.ImageCollection(
  'GOOGLE/SATELLITE_EMBEDDING/V1/ANNUAL'
);
var mosaic = embeddings
  .filter(ee.Filter.date(startDate, endDate))
  .filterBounds(AOI)
  .mosaic()
  .select('A.*')
  .toFloat();
print('Embedding mosaic', mosaic);

// ---- Part 7: Sample AlphaEarth Embeddings ----
// ---------------------------------------------------------------------
// 7. SAMPLE EMBEDDINGS
// ---------------------------------------------------------------------
var scale = 10;
var sampleEmbeddings = mosaic.sampleRegions({
  collection: samples,
  scale: scale,
  geometries: true
});
print(
  'Sample embeddings',
  sampleEmbeddings.limit(5)
);

// ---- Part 8: Compute Cosine Similarity Using Dot Product ----
// ---------------------------------------------------------------------
// 8. COMPUTE COSINE SIMILARITY USING DOT PRODUCT
// ---------------------------------------------------------------------
var bandNames = mosaic.bandNames();
var sampleDistances = ee.ImageCollection(
  sampleEmbeddings.map(function(f) {
    // Convert feature to embedding vector image
    var vec = ee.Image.constant(
      f.toArray(bandNames)
    )
    .arrayFlatten([bandNames])
    .toFloat();
    // Dot product similarity
    var dot = vec.multiply(mosaic)
      .reduce(ee.Reducer.sum())
      .rename('similarity');
    return dot;
  })
);

// ---- Part 9: Generate Mean Similarity Image ----
// ---------------------------------------------------------------------
// 9. MEAN SIMILARITY IMAGE
// ---------------------------------------------------------------------
var meanSimilarity = sampleDistances
  .mean()
  .clip(smallAOI);
// ---------------------------------------------------------------------
// 9.1. VISUALIZATION
// ---------------------------------------------------------------------
var palette = [
  '000004',
  '2C105C',
  '711F81',
  'B63679',
  'EE605E',
  'FDAE78',
  'FCFDBF',
  'FFFFFF'
];
Map.addLayer(
  meanSimilarity,
  {
    min: 0,
    max: 1,
    palette: palette
  },
  'Cosine similarity (bright = close)',
  false
);

// ---- Part 10: Generate Similarity Mask and Export Results ----
// ---------------------------------------------------------------------
// 10. THRESHOLD MASK
// ---------------------------------------------------------------------
var threshold = 0.80;
var similarityMask = meanSimilarity.gt(threshold);
// ---------------------------------------------------------------------
// 10.1. CONVERT TO POLYGONS
// ---------------------------------------------------------------------
var polygons = similarityMask
  .selfMask()
  .reduceToVectors({
    geometry: smallAOI,
    scale: scale,
    eightConnected: false,
    maxPixels: 1e10
  });
// ---------------------------------------------------------------------
// 10.2. CENTROIDS
// ---------------------------------------------------------------------
var predictedMatches = polygons.map(function(f) {
  return f.centroid({maxError: 1});
});
// ---------------------------------------------------------------------
// 10.3. PRINT RESULTS
// ---------------------------------------------------------------------
print(
  'Predicted matching points',
  predictedMatches.limit(5)
);
// ---------------------------------------------------------------------
// 10.4. DISPLAY OUTPUTS
// ---------------------------------------------------------------------
Map.addLayer(
  similarityMask.updateMask(similarityMask),
  {palette: ['cyan']},
  'Similarity > ' + threshold
);
Map.addLayer(
  predictedMatches,
  {color: 'yellow'},
  'Predicted Similar Areas'
);
// ---------------------------------------------------------------------
// 10.5. EXPORT MASK
// ---------------------------------------------------------------------
Export.image.toAsset({
  image: similarityMask.toByte(),
  description:
    'similarity_mask_' + year,
  assetId:
    'projects/your-project/assets/' +  // replace with your Cloud project
    'similarity_mask_' + year,
  region: smallAOI,
  scale: scale,
  maxPixels: 1e13,
  pyramidingPolicy: {
    '.default': 'mode'
  }
});

// ==== PART C: CHANGE BETWEEN YEARS (written for the website) ====
// Same pixel, two years: dot product of the two embeddings. Low similarity flags change.
var embeddingFor = function(y) {
  return embeddings
    .filter(ee.Filter.date(ee.Date.fromYMD(y, 1, 1), ee.Date.fromYMD(y + 1, 1, 1)))
    .filterBounds(AOI)
    .mosaic()
    .select('A.*');
};
var yearA = 2023;
var yearB = 2024;
var change = embeddingFor(yearA).multiply(embeddingFor(yearB))
  .reduce(ee.Reducer.sum())
  .rename('similarity_between_years')
  .clip(smallAOI);
Map.addLayer(
  change,
  {min: 0.5, max: 1, palette: ['d73027', 'fee08b', 'ffffff']},
  'Similarity ' + yearA + ' vs ' + yearB + ' (red = change)',
  false
);
