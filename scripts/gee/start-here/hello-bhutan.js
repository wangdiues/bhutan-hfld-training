/**
 * Hello Bhutan: a first Earth Engine script
 *
 * Bhutan ART-TREES HFLD Readiness Training, course website ("Start here" page).
 * Written for the website; not part of the May 2026 source materials.
 * Code licence: MIT.
 */

print('Hello Bhutan');

// Thimphu, roughly 89.64° E, 27.47° N (longitude first in Earth Engine).
var thimphu = ee.Geometry.Point([89.64, 27.47]);
Map.centerObject(thimphu, 11);

// Sentinel-2 surface reflectance for the 2025 dry season, January to April:
// https://developers.google.com/earth-engine/datasets/catalog/COPERNICUS_S2_SR_HARMONIZED
var s2 = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
    .filterBounds(thimphu)
    .filterDate('2025-01-01', '2025-05-01')
    .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20));
print('Number of images:', s2.size());

var composite = s2.median();
Map.addLayer(composite, {bands: ['B4', 'B3', 'B2'], min: 0, max: 3000}, 'Sentinel-2, Jan-Apr 2025');
