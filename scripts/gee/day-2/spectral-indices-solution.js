/**
 * Spectral indices: solution to the "fill in the blanks" practice (an EVI function)
 *
 * Bhutan ART-TREES HFLD Readiness Training, course website.
 * Adapted from "D2-Exercise-Calculating spectral indices and working with functions" by
 * Ate Poortinga & Samuel, Conservation International (May 2026). Code licence: MIT.
 */

var paro = ee.Geometry.Rectangle([89.25, 27.30, 89.50, 27.55]);

// EVI = 2.5 * (NIR - RED) / (NIR + 6 * RED - 7.5 * BLUE + 1), with reflectance from 0 to 1.
var addEVI = function(image) {
  var evi = image.expression(
    '2.5 * ((NIR - RED) / (NIR + 6 * RED - 7.5 * BLUE + 1))',
    {
      'NIR': image.select('B8').divide(10000),
      'RED': image.select('B4').divide(10000),
      'BLUE': image.select('B2').divide(10000)
    }
  ).rename('EVI');
  return image.addBands(evi);
};

var s2 = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
    .filterBounds(paro)
    .filterDate('2025-01-01', '2025-05-01')
    .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
    .map(addEVI);

var medianEVI = s2.select('EVI').median().clip(paro);
Map.centerObject(paro, 11);
Map.addLayer(medianEVI, {min: 0, max: 0.8, palette: ['white', 'yellow', 'green']}, 'Median EVI, Jan-Apr 2025');
print('Mean EVI over Paro valley:', medianEVI.reduceRegion({
  reducer: ee.Reducer.mean(),
  geometry: paro,
  scale: 10,
  maxPixels: 1e9
}));
