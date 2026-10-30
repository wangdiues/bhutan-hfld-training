/**
 * Working with image collections: filtering, visualising and reducing
 *
 * Bhutan ART-TREES HFLD Readiness Training, May 2026.
 * Source: D1 WORKING WITH IMAGE COLLECTIONS.pptx (slides 9-20).
 * Original authors: Ate Poortinga & Samuel (Conservation International).
 * Adapted with the trainers' permission for https://wangdiues.github.io/bhutan-hfld-training/
 * Code licence: MIT. Changes from the source are listed in CHANGELOG.md:
 *   - The slides show snippets only; this script joins them into one runnable example for Paro.
 *   - The region reduction uses a Paro valley rectangle instead of `santaCruz` (not defined, not Bhutan).
 *   - The palette example (slide 12) is applied to SRTM elevation.
 */

// Area of interest: Paro valley.
var paro = ee.Geometry.Rectangle([89.25, 27.30, 89.50, 27.55]);
Map.centerObject(paro, 11);

// 1. Filter a collection by place, date and metadata (slide 13 used Landsat 8 SR over Utah, May 2021).
// https://developers.google.com/earth-engine/datasets/catalog/COPERNICUS_S2_SR_HARMONIZED
var imageCollection = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
    .filterBounds(paro)
    .filterDate('2025-01-01', '2025-05-01')
    .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 30));
print('Images, Jan-Apr 2025:', imageCollection.size());

// 2. Visualise one image (slides 9-11).
var img = imageCollection.sort('CLOUDY_PIXEL_PERCENTAGE').first();
var trueColor = img.visualize({
  bands: ['B4', 'B3', 'B2'],
  min: 100,
  max: 2000
});
var falseColor = img.visualize({
  bands: ['B11', 'B8', 'B2'],
  min: [100, 75, 50],
  max: [3500, 3400, 3300]
});
Map.addLayer(trueColor, {}, 'True colour');
Map.addLayer(falseColor, {}, 'Agriculture (SWIR-1, NIR, blue)', false);

// 3. A palette stretches one band between min and max (slide 12).
// https://developers.google.com/earth-engine/datasets/catalog/USGS_SRTMGL1_003
var elevation = ee.Image('USGS/SRTMGL1_003');
Map.addLayer(elevation.clip(paro), {
  min: 200,
  max: 2500,
  palette: ['#ffe74c', '#ff5964', '#38618c']
}, 'Elevation (m)', false);

// 4. Reduce the collection to one image (slide 19).
var median = imageCollection
    .reduce(ee.Reducer.median(), 2);
print('Band names after reduce():', median.bandNames());
Map.addLayer(median.clip(paro), {bands: ['B4_median', 'B3_median', 'B2_median'], min: 100, max: 2000},
    'Median, Jan-Apr 2025');

// 5. Reduce an image over a region (slide 20).
var mean = median.reduceRegion({
  reducer: ee.Reducer.mean(),
  geometry: paro,
  scale: 30,
  maxPixels: 1e9,
});
print('Mean band values over Paro valley:', mean);
