/**
 * Mosaics and composites: what the difference looks like
 *
 * Bhutan ART-TREES HFLD Readiness Training, May 2026.
 * Accompanies: D2-Creating Mosaics and Composites from Image Collections.pptx
 * Original authors: Ate Poortinga & Samuel (Conservation International).
 * Adapted with the trainers' permission for https://wangdiues.github.io/bhutan-hfld-training/
 * The slides explain these ideas without code; this script was written for the website.
 * Code licence: MIT.
 */

var thimphu = ee.Geometry.Point([89.64, 27.47]);
Map.centerObject(thimphu, 10);

// Sentinel-2 surface reflectance, dry season 2025, no cloud filter on purpose.
// https://developers.google.com/earth-engine/datasets/catalog/COPERNICUS_S2_SR_HARMONIZED
var s2 = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
    .filterBounds(thimphu)
    .filterDate('2025-01-01', '2025-05-01')
    .sort('system:time_start');  // oldest first, so the latest image ends up on top of the mosaic
print('Images:', s2.size());
var vis = {bands: ['B4', 'B3', 'B2'], min: 0, max: 3000};

// 1. Mosaic: images stacked in collection order; the top (latest) valid pixel wins.
Map.addLayer(s2.mosaic(), vis, '1. Mosaic (latest on top)');

// 2. Median composite: each pixel's median value over all images.
Map.addLayer(s2.median(), vis, '2. Median composite');

// 3. Quality mosaic: each pixel taken from the image where NDVI is highest ("greenest pixel").
var withNdvi = s2.map(function(image) {
  return image.addBands(image.normalizedDifference(['B8', 'B4']).rename('NDVI'));
});
Map.addLayer(withNdvi.qualityMosaic('NDVI'), vis, '3. Greenest-pixel mosaic');
