/**
 * Calculating covariates
 *
 * LULC Mapping Training: https://wangdiues.github.io/lulc-mapping-training/
 * Acknowledgements and sources: https://wangdiues.github.io/lulc-mapping-training/about/credits/
 * Code licence: MIT. Changes from the source are listed in CHANGELOG.md:
 *   - The bands are divided by 10000 before computing covariates: the composite stores
 *     reflectance x 10000 (Int16), and EVI, SAVI (so IBI) and the Tasseled Cap assume 0-1 reflectance.
 *   - Two lists that the M2-02 extraction had commented out are restored as in the exercise:
 *     the Tasseled Cap distances and the terrain covariates.
 *   - The probability export is named for forest (the training classes are forest / non-forest);
 *     the exercise named it "urban_AP" / urbanAP2025.
 *
 * Inputs: the 2025 Landsat composite from the Landsat MRV composite lesson (the path below is a
 * participant's export in the training project; use your own), and two point imports drawn in the
 * Code Editor, `forest` and `nonForest`, each with a numeric property `class` (forest = 1, other = 0).
 *
 * Original Code Editor script(s):
 *   https://code.earthengine.google.com/c86323c2a144391b5218fb1d5d9e465f
 *   https://code.earthengine.google.com/f6ac698d62c5a93294b37c210166c41c
 */

/* global forest, nonForest */
// forest, nonForest: Code Editor imports. Collect them as point FeatureCollections with a class property.

// ---- PART 1: Load and Visualize Input Data ----
var image = ee.Image("projects/bhutan-hfld-readiness-training/assets/landsatComposite/bhutan_ls89_2025_TashiY");
// Visual check
Map.addLayer(
  image,
  {bands: ["B4_jan_apr", "B3_jan_apr", "B2_jan_apr"], min: 0, max: 3000},
  "RGB Jan-Apr"
);
Map.addLayer(
  image,
  {bands: ["B4_oct_dec", "B3_oct_dec", "B2_oct_dec"], min: 0, max: 3000},
  "RGB Oct-Dec"
);

// ---- Part 2: Compute Seasonal Spectral Covariates ----
// ---------------------------------------------------------------------
// Helper to compute covariates for one seasonal suffix
// Landsat 8/9 bands:
// B2 = blue, B3 = green, B4 = red, B5 = nir, B6 = swir1, B7 = swir2
// ---------------------------------------------------------------------
function addSeasonCovariates(img, suffix) {
  // The composite stores reflectance x 10000; convert to 0-1 reflectance.
  var blue  = img.select('B2_' + suffix).divide(10000);
  var green = img.select('B3_' + suffix).divide(10000);
  var red   = img.select('B4_' + suffix).divide(10000);
  var nir   = img.select('B5_' + suffix).divide(10000);
  var swir1 = img.select('B6_' + suffix).divide(10000);
  var swir2 = img.select('B7_' + suffix).divide(10000);
  // --------------------------
  // Normalized difference indices
  // --------------------------
  var ndvi = nir.subtract(red).divide(nir.add(red))
    .rename('NDVI_' + suffix);
  var ndwi = green.subtract(nir).divide(green.add(nir))
    .rename('NDWI_' + suffix);
  var nbr = nir.subtract(swir2).divide(nir.add(swir2))
    .rename('NBR_' + suffix);
  var ndsi = green.subtract(swir1).divide(green.add(swir1))
    .rename('NDSI_' + suffix);
  // Extra ND combinations often useful in RLCMS-style stacks
  var nd_red_swir1 = red.subtract(swir1).divide(red.add(swir1))
    .rename('ND_red_swir1_' + suffix);
  var nd_nir_swir1 = nir.subtract(swir1).divide(nir.add(swir1))
    .rename('ND_nir_swir1_' + suffix);
  var nd_nir_swir2 = nir.subtract(swir2).divide(nir.add(swir2))
    .rename('ND_nir_swir2_' + suffix);
  var nd_green_swir1 = green.subtract(swir1).divide(green.add(swir1))
    .rename('ND_green_swir1_' + suffix);
  // --------------------------
  // Ratio bands
  // R(swir1, nir) and R(red, swir1)
  // --------------------------
  var ratio_swir1_nir = swir1.divide(nir)
    .rename('R_swir1_nir_' + suffix);
  var ratio_red_swir1 = red.divide(swir1)
    .rename('R_red_swir1_' + suffix);
  // --------------------------
  // EVI
  // --------------------------
  var evi = nir.subtract(red)
    .multiply(2.5)
    .divide(nir.add(red.multiply(6)).subtract(blue.multiply(7.5)).add(1))
    .rename('EVI_' + suffix);
  // --------------------------
  // SAVI, L = 0.5
  // standard form
  // --------------------------
  var savi = nir.subtract(red)
    .multiply(1.5)
    .divide(nir.add(red).add(0.5))
    .rename('SAVI_' + suffix);
  // --------------------------
  // NDBI and MNDWI for IBI
  // standard Xu (2008) form
  // --------------------------
  var ndbi = swir1.subtract(nir).divide(swir1.add(nir))
    .rename('NDBI_' + suffix);
  var mndwi = green.subtract(swir1).divide(green.add(swir1))
    .rename('MNDWI_' + suffix);
  var ibi_a = ndbi;
  var ibi_b = savi.add(mndwi).divide(2);
  var ibi = ibi_a.subtract(ibi_b).divide(ibi_a.add(ibi_b))
    .rename('IBI_' + suffix);
  // --------------------------
  // Tasseled Cap for Landsat 8/9 OLI
  // coefficients of Baig et al. (2014), derived for top-of-atmosphere reflectance
  // --------------------------
  var tc = ee.Image.cat([blue, green, red, nir, swir1, swir2])
    .multiply(ee.Image.constant([
      [0.3029,  0.2786,  0.4733,  0.5599,  0.5080,  0.1872],  // Brightness
      [-0.2941, -0.2430, -0.5424, 0.7276,  0.0713, -0.1608], // Greenness
      [0.1511,  0.1973,  0.3283,  0.3407, -0.7117, -0.4559], // Wetness
      [-0.8239, 0.0849,  0.4396, -0.0580,  0.2013, -0.2773], // Fourth
      [-0.3294, 0.0557,  0.1056,  0.1855, -0.4349,  0.8085], // Fifth
      [0.1079, -0.9023,  0.4119,  0.0575, -0.0259,  0.0252]  // Sixth
    ]))
    .reduce(ee.Reducer.sum().repeat(6));
  // The previous approach can be awkward in EE, so compute explicitly:
  var tcb = blue.multiply(0.3029)
    .add(green.multiply(0.2786))
    .add(red.multiply(0.4733))
    .add(nir.multiply(0.5599))
    .add(swir1.multiply(0.5080))
    .add(swir2.multiply(0.1872))
    .rename('TCB_' + suffix);
  var tcg = blue.multiply(-0.2941)
    .add(green.multiply(-0.2430))
    .add(red.multiply(-0.5424))
    .add(nir.multiply(0.7276))
    .add(swir1.multiply(0.0713))
    .add(swir2.multiply(-0.1608))
    .rename('TCG_' + suffix);
  var tcw = blue.multiply(0.1511)
    .add(green.multiply(0.1973))
    .add(red.multiply(0.3283))
    .add(nir.multiply(0.3407))
    .add(swir1.multiply(-0.7117))
    .add(swir2.multiply(-0.4559))
    .rename('TCW_' + suffix);
  var tc4 = blue.multiply(-0.8239)
    .add(green.multiply(0.0849))
    .add(red.multiply(0.4396))
    .add(nir.multiply(-0.0580))
    .add(swir1.multiply(0.2013))
    .add(swir2.multiply(-0.2773))
    .rename('TC4_' + suffix);
  var tc5 = blue.multiply(-0.3294)
    .add(green.multiply(0.0557))
    .add(red.multiply(0.1056))
    .add(nir.multiply(0.1855))
    .add(swir1.multiply(-0.4349))
    .add(swir2.multiply(0.8085))
    .rename('TC5_' + suffix);
  var tc6 = blue.multiply(0.1079)
    .add(green.multiply(-0.9023))
    .add(red.multiply(0.4119))
    .add(nir.multiply(0.0575))
    .add(swir1.multiply(-0.0259))
    .add(swir2.multiply(0.0252))
    .rename('TC6_' + suffix);
  // --------------------------
  // Tasseled Cap angles and distances
  // --------------------------
  var tcAngleBG = tcb.atan2(tcg).rename('tcAngleBG_' + suffix);
  var tcAngleGW = tcg.atan2(tcw).rename('tcAngleGW_' + suffix);
  var tcAngleBW = tcb.atan2(tcw).rename('tcAngleBW_' + suffix);
  var tcDistBG = tcb.pow(2).add(tcg.pow(2)).sqrt().rename('tcDistBG_' + suffix);
  var tcDistGW = tcg.pow(2).add(tcw.pow(2)).sqrt().rename('tcDistGW_' + suffix);
  var tcDistBW = tcb.pow(2).add(tcw.pow(2)).sqrt().rename('tcDistBW_' + suffix);
  return ee.Image.cat([
    ndvi, ndwi, nbr, ndsi,
    nd_red_swir1, nd_nir_swir1, nd_nir_swir2, nd_green_swir1,
    ratio_swir1_nir, ratio_red_swir1,
    evi, savi, ndbi, mndwi, ibi,
    tcb, tcg, tcw, tc4, tc5, tc6,
    tcAngleBG, tcAngleGW, tcAngleBW,
    tcDistBG, tcDistGW, tcDistBW
  ]);
}

// ---- Part 3: Apply Function to Compute Seasonal Covariates ----
// ---------------------------------------------------------------------
// Compute seasonal covariates
// ---------------------------------------------------------------------
var covJanApr = addSeasonCovariates(image, 'jan_apr');
var covOctDec = addSeasonCovariates(image, 'oct_dec');

// ---- Part 4: Compute Terrain Covariates ----
// ---------------------------------------------------------------------
// Terrain covariates from SRTM
// ---------------------------------------------------------------------
var dem = ee.Image('USGS/SRTMGL1_003').rename('elevation');
var terrain = ee.Terrain.products(dem);
var elevation = dem.rename('elevation');
var slope = terrain.select('slope').rename('slope');
var aspect = terrain.select('aspect').rename('aspect');
var aspectRad = aspect.multiply(Math.PI).divide(180);
var eastness = aspectRad.sin().rename('eastness');
var northness = aspectRad.cos().rename('northness');
var terrainCov = ee.Image.cat([
  elevation, slope, aspect, eastness, northness
]);

// ---- Part 5: Add Water Covariates (JRC Global Surface Water) ----
// ---------------------------------------------------------------------
// Optional JRC water covariates
// ---------------------------------------------------------------------
var jrc = ee.Image('JRC/GSW1_4/GlobalSurfaceWater');
var jrcCov = jrc.select([
  'occurrence',
  'change_abs',
  'change_norm',
  'seasonality',
  'transition',
  'max_extent'
]);

// ---- Part 6: Build Final Covariate Stack and Visualization ----
// ---------------------------------------------------------------------
// Final covariate stack
// ---------------------------------------------------------------------
var covariates = image
  .addBands(covJanApr)
  .addBands(covOctDec)
  .addBands(terrainCov)
  //.addBands(jrcCov);
// Print information
print('Covariate stack', covariates);
print('Band names', covariates.bandNames());
// ---------------------------------------------------------------------
// Example visualization
// ---------------------------------------------------------------------
Map.centerObject(image, 8);
Map.addLayer(
  covJanApr.select('NDVI_jan_apr'),
  {min: -1, max: 1},
  'NDVI Jan-Apr'
);
Map.addLayer(
  covOctDec.select('NDVI_oct_dec'),
  {min: -1, max: 1},
  'NDVI Oct-Dec'
);
Map.addLayer(
  terrainCov.select('slope'),
  {min: 0, max: 60},
  'Slope'
);

// ---- Part 7: Train a Random Forest and export a probability layer (preview of the next lesson) ----
var trainingSample = forest.merge(nonForest)
var sampled = covariates.sampleRegions({
  collection: trainingSample,
  properties: ["class"],
  scale: 30,
  geometries: true
});
var classifier = ee.Classifier.smileRandomForest({
  numberOfTrees: 100,
  bagFraction: 0.7,
  seed: 42
}).train({
  features: sampled,
  classProperty: 'class',
  inputProperties: covariates.bandNames()
});
var probabilityClassifier = classifier.setOutputMode("PROBABILITY");
var targetProbability = covariates
  .classify(probabilityClassifier)
  .rename("target_probability");
Map.addLayer(
  targetProbability,
  {
    min: 0,
    max: 1,
    palette: ["ffffff", "a1d99b", "006d2c"]
  },
   " probability")
//Export to GEE Asset (ToAsset)
Export.image.toAsset({
  image: targetProbability.multiply(100).toInt(),
  description: "forest_AP",
  assetId: "projects/bhutan-hfld-readiness-training/assets/primitives/forestAP2025",
  region: image.geometry(),
  // region: aoi, // use this if you draw AOI manually in GEE; no need to use geometry()
  scale: 30,
  maxPixels: 1e13
});
