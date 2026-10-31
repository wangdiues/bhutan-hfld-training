/**
 * Introduction to Google Earth Engine: the five things Earth Engine does
 *
 * LULC Mapping Training: https://wangdiues.github.io/lulc-mapping-training/
 * Acknowledgements and sources: https://wangdiues.github.io/lulc-mapping-training/about/credits/
 * The slides describe these steps without code; this script was written for the website.
 * Code licence: MIT. Changes from the source are listed in CHANGELOG.md.
 */

var thimphu = ee.Geometry.Point([89.64, 27.47]);
Map.centerObject(thimphu, 10);

// 1. Filter a collection by place, time and metadata.
// https://developers.google.com/earth-engine/datasets/catalog/COPERNICUS_S2_SR_HARMONIZED
var s2 = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
    .filterBounds(thimphu)
    .filterDate('2025-01-01', '2025-05-01')
    .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20));
print('Images in the collection:', s2.size());

// 2. Get an image: the least cloudy one.
var image = s2.sort('CLOUDY_PIXEL_PERCENTAGE').first();
Map.addLayer(image, {bands: ['B4', 'B3', 'B2'], min: 0, max: 3000}, 'Least cloudy image');

// 3. Apply an algorithm to an image: NDVI from near-infrared (B8) and red (B4).
var addNdvi = function(img) {
  return img.addBands(img.normalizedDifference(['B8', 'B4']).rename('NDVI'));
};
var ndviPalette = ['white', 'green'];
Map.addLayer(addNdvi(image).select('NDVI'), {min: 0, max: 0.8, palette: ndviPalette}, 'NDVI, one image');

// 4. Map an algorithm over a collection (N images in, N images out).
var withNdvi = s2.map(addNdvi);

// 5. Reduce a collection (N images in, 1 image out), then a region (image in, number out).
var medianNdvi = withNdvi.select('NDVI').median();
Map.addLayer(medianNdvi, {min: 0, max: 0.8, palette: ndviPalette}, 'Median NDVI, Jan-Apr 2025');
var meanNdvi = medianNdvi.reduceRegion({
  reducer: ee.Reducer.mean(),
  geometry: thimphu.buffer(5000),
  scale: 10,
});
print('Mean NDVI within 5 km of Thimphu:', meanNdvi.get('NDVI'));
