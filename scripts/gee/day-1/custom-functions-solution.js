/**
 * Custom functions: solution to the "from scratch" practice (NDVI mapped over Sentinel-2, 2025)
 *
 * Bhutan ART-TREES HFLD Readiness Training, course website.
 * Adapted from "EXERCISE D1_ Writing Custom Functions and Mapping Across Image Collections" by
 * Ate Poortinga & Samuel, Conservation International (May 2026). Code licence: MIT.
 */

var thimphu = ee.Geometry.Point([89.64, 27.47]);

// A function that takes an ee.Image and returns it with an NDVI band added.
var addNdvi = function(image) {
  var ndvi = image.normalizedDifference(['B8', 'B4']).rename('NDVI');
  return image.addBands(ndvi);
};

var s2 = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
    .filterBounds(thimphu)
    .filterDate('2025-01-01', '2026-01-01')
    .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20));

var withNdvi = s2.map(addNdvi);
print('First image, now with NDVI:', withNdvi.first().bandNames());

var maxNdvi = withNdvi.select('NDVI').max();
Map.centerObject(thimphu, 11);
Map.addLayer(maxNdvi, {min: 0, max: 0.9, palette: ['white', 'yellow', 'green']}, 'Maximum NDVI, 2025');
