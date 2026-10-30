/**
 * Change detection and loss strata: stable forest, loss, gain and stable non-forest from two dates
 *
 * Bhutan ART-TREES HFLD Readiness Training, course website (new content, not in the May 2026 materials).
 * Code licence: MIT.
 *
 * Part A works anywhere with the open Hansen Global Forest Change data, so it runs without
 * training assets. Part B shows the same strata from your own forest primitives (Day 3).
 */

var bhutan = ee.FeatureCollection('FAO/GAUL/2015/level0')
    .filter(ee.Filter.eq('ADM0_NAME', 'Bhutan'));
Map.centerObject(bhutan, 8);

// Stratum codes used on Day 5 for sampling.
var STABLE_FOREST = 1;
var LOSS = 2;
var STABLE_NONFOREST = 3;
var GAIN = 4;

// Two forest masks (1 = forest, 0 = not) for the start and end of a period -> one strata image.
var makeStrata = function(forestStart, forestEnd) {
  return ee.Image(0)
      .where(forestStart.eq(1).and(forestEnd.eq(1)), STABLE_FOREST)
      .where(forestStart.eq(1).and(forestEnd.eq(0)), LOSS)
      .where(forestStart.eq(0).and(forestEnd.eq(0)), STABLE_NONFOREST)
      .where(forestStart.eq(0).and(forestEnd.eq(1)), GAIN)
      .updateMask(forestStart.mask().and(forestEnd.mask()))
      .rename('stratum')
      .toByte();
};

var strataVis = {min: 1, max: 4, palette: ['1a9850', 'd73027', 'bdbdbd', '4575b4']};

// ---- Part A: strata from Hansen Global Forest Change (2000-2023) ----
// https://developers.google.com/earth-engine/datasets/catalog/UMD_hansen_global_forest_change_2023_v1_11
var gfc = ee.Image('UMD/hansen/global_forest_change_2023_v1_11').clip(bhutan);
var canopyThreshold = 10;  // % tree cover counted as forest; set it from your forest definition
var forest2000 = gfc.select('treecover2000').gte(canopyThreshold);
// lossyear: 1-23 = loss in 2001-2023. Forest at the start of 2020 = forest in 2000 and no loss up to 2019.
var lossBy2019 = gfc.select('lossyear').gte(1).and(gfc.select('lossyear').lte(19));
var lossBy2023 = gfc.select('lossyear').gte(1).and(gfc.select('lossyear').lte(23));
var forestStart = forest2000.and(lossBy2019.not());
var forestEnd = forest2000.and(lossBy2023.not());
var strataGfc = makeStrata(forestStart, forestEnd);
Map.addLayer(strataGfc, strataVis, 'Strata 2020-2023 (Hansen GFC)');

// Area of each stratum (hectares).
var areaHa = ee.Image.pixelArea().divide(10000).addBands(strataGfc);
var areas = areaHa.reduceRegion({
  reducer: ee.Reducer.sum().group({groupField: 1, groupName: 'stratum'}),
  geometry: bhutan.geometry(),
  scale: 30,
  maxPixels: 1e13
});
print('Area by stratum (ha), Hansen 2020-2023', areas);

// ---- Part B: strata from your own forest primitives ----
// Forest probability layers from the Forest primitives lesson, for two years (0-1 probabilities).
// Replace the asset paths with your own exports.
var probStart = ee.Image('projects/bhutan-hfld-readiness-training/assets/primitives/ls_Forest_2020');
var probEnd = ee.Image('projects/bhutan-hfld-readiness-training/assets/primitives/ls_Forest_2025');
var probabilityThreshold = 0.5;
var strataOwn = makeStrata(probStart.gte(probabilityThreshold), probEnd.gte(probabilityThreshold));
Map.addLayer(strataOwn, strataVis, 'Strata 2020-2025 (own primitives)', false);
