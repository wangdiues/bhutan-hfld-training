/**
 * Creating a stratified sampling design in Google Earth Engine
 *
 * Bhutan ART-TREES HFLD Readiness Training, May 2026.
 * Source: EXERCISE D5_ PART 2-CREATING A STRATIFIED SAMPLING DESIGN IN GOOGLE EARTH ENGINE.docx
 * Original authors: Ate Poortinga & Samuel (Conservation International).
 * Adapted with the trainers' permission for https://wangdiues.github.io/bhutan-hfld-training/
 * Code licence: MIT. Changes from the source are listed in CHANGELOG.md:
 *   - The two print(...aggregate_histogram('lc_name')...) lines use 'lc_no': the samples carry no
 *     'lc_name' property, so the exercise's histograms came out empty.
 *   - classPoints keeps the exercise's 828 / 0 / 80; replace them with your own allocation from
 *     the sample size calculator. Export paths: use your own project.
 *
 * Original Code Editor script(s):
 *   https://code.earthengine.google.com/0dbd04fc75df2f21ecf44b3ffcec69ec
 */

/* global mapSelect, AOI, scale, proj */
// Part 2 continues Part 1: paste this below sample-size.js, which defines these variables.

// ---- Part 2: Remap the stratification map to the sampling classes ----
// ---------------------------------------------------------------------
//Remap the Stratification Map to our sampling classes
// ---------------------------------------------------------------------
// 1: Forest
// 2: Non-Forest
// 3: Deforestation
var remapSelect = mapSelect
   //Remap Forest Classes to 1
   //Remap the deforestation class to 3
   //Remap all other classes to 2
   .remap([  2, 10],[  1,  3],2).rename('lc_no');

// ---- Part 3: Stratified Sampling ----
var stratifiedSample = remapSelect.stratifiedSample({
  numPoints: 80,
  classBand: 'lc_no',
  region: AOI,
  scale: scale,
  projection: proj,
  seed: 42,
  classValues:
  [1, 2, 3],
  classPoints:
  [828, 0, 80],
  geometries: true
});

// ---- Part 4: Indexing the stratified sampling points ----
// ---------------------------------------------------------------------
// Index and create the samples
// ---------------------------------------------------------------------
var indexes = ee.List(stratifiedSample.aggregate_array('system:index'));
var ids = ee.List.sequence(0, indexes.size().subtract(1));
var idByIndex = ee.Dictionary.fromLists(indexes, ids);
var stratifiedSampleIndexed = stratifiedSample.map(function(ft){
  return ft.set('plotID', ee.Number(idByIndex.get(ft.get('system:index'))).toInt16()).set('sampleID', ee.Number(idByIndex.get(ft.get('system:index'))).toInt16());
});
Map.addLayer(stratifiedSampleIndexed,{color:'red'},'sampling points')
print(stratifiedSampleIndexed.aggregate_histogram('lc_no'),stratifiedSampleIndexed);

// ---- Part 5: Creating Sampling Plots ----
// ---------------------------------------------------------------------
// Create the sample plots
// ---------------------------------------------------------------------
var stratifiedPlots = stratifiedSampleIndexed.map(function (ft) {
  var bufferPlot = ft.buffer(15).geometry().bounds();
  return ee.Feature(bufferPlot).copyProperties(ft);
});
//Inspect the sampling plots
Map.addLayer(stratifiedPlots.style({color:'red', width: 2, fillColor: '#ffffff00'}),null,'sampling plots');
print(stratifiedPlots.aggregate_histogram('lc_no'),stratifiedPlots);

// ---- Part 6: Export the samples and plots (shapefiles for Collect Earth Online, and assets) ----
var yourname = "yourname"
Export.table.toDrive({
  collection: stratifiedSampleIndexed,
  folder: 'GEE',
  fileFormat: 'SHP',
  description: "bhutan_hfldTraining_samples_"+yourname,
  maxVertices: 1e12
});
Export.table.toAsset({
  collection: stratifiedSampleIndexed,
  assetId: 'projects/bhutan-hfld-readiness-training/assets/trainingData/bhutan_hfldTraining_samples_'+yourname,
  description: "bhutan_hfldTraining_samples_yourname",
  maxVertices: 1e12
});
Export.table.toDrive({
  collection: stratifiedPlots,
  folder: 'GEE',
  fileFormat: 'SHP',
  description: "bhutan_hfldTraining_plots_"+yourname,
  maxVertices: 1e12
});
Export.table.toAsset({
  collection: stratifiedPlots,
  assetId: 'projects/bhutan-hfld-readiness-training/assets/trainingData/stratifiedPlots_'+yourname,
  description: "bhutan_hfldTraining_plots_yourname",
  maxVertices: 1e12
});
