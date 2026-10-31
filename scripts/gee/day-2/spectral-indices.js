/**
 * Calculating spectral indices and working with functions
 *
 * LULC Mapping Training: https://wangdiues.github.io/lulc-mapping-training/
 * Acknowledgements and sources: https://wangdiues.github.io/lulc-mapping-training/about/credits/
 * Code licence: MIT. Changes from the source are listed in CHANGELOG.md:
 *   - The exercise's sections (each repeated as "full code") are curated into one script.
 *   - `aoi` is a point at Thimphu instead of a drawn `geometry` import.
 *   - Section 1.4's NIR/SWIR index is named NDMI (Gao's NDWI) so it is not confused with the
 *     green/NIR NDWI of section 1.2.
 *   - EVI and SAVI divide the Sentinel-2 values by 10000 first: their constants (+1, +0.5)
 *     assume reflectance between 0 and 1.
 *
 * Original Code Editor script(s):
 *   https://code.earthengine.google.com/946119d88943098d0e8c6bc7fb7bcc12
 */

// ---- 1.1 NDVI from one Sentinel-2 image ----
// Load the Sentinel-2 image
var s2img = ee.Image("COPERNICUS/S2_SR_HARMONIZED/20240109T044141_20240109T044757_T45RYL");
// Select the NIR (B8) and Red (B4) bands
var nir = s2img.select('B8');
var red = s2img.select('B4');
// Calculate NDVI
var ndvi = nir.subtract(red).divide(nir.add(red)).rename('NDVI');
// Define visualization parameters for NDVI
var ndviParams = {
  min: -1,
  max: 1,
  palette: ['blue', 'white', 'green']
};
// Define visualization parameters for RGB
var rgbParams = {
  bands: ['B4', 'B3', 'B2'],
  min: 0,
  max: 3000
};
// Define visualization parameters for SWIR-NIR-Red
var swirNirRedParams = {
  bands: ['B11', 'B8', 'B4'],
  min: 0,
  max: 3000,
  gamma: 1.4
};
// Add RGB layer to the map
Map.centerObject(s2img, 9);  // Adjust zoom level as needed
Map.addLayer(s2img, rgbParams, 'RGB');
// Add SWIR-NIR-Red layer to the map
Map.addLayer(s2img, swirNirRedParams, 'SWIR-NIR-Red');
// Add NDVI layer to the map
Map.addLayer(ndvi, ndviParams, 'NDVI');
// Print NDVI image to the console
print('NDVI Image:', ndvi);

// ---- 1.2 NDWI (open water) from the same image ----
// Select the Green (B3) and NIR (B8) bands
var green = s2img.select('B3');
// Calculate NDWI
var ndwi = green.subtract(nir).divide(green.add(nir)).rename('NDWI');
// Define visualization parameters for NDWI
var ndwiParams = {
  min: -1,
  max: 1,
  palette: ['white', 'blue']
};
// Add NDWI layer to the map
Map.addLayer(ndwi, ndwiParams, 'NDWI');
// Print NDWI image to the console
print('NDWI Image:', ndwi);

// ---- 1.3 NDVI minimum, median and maximum over a year ----
// Define the area of interest (AOI): Thimphu. (In the training, a geometry drawn on the map.)
var aoi = ee.Geometry.Point([89.64, 27.47]);
// Load the Sentinel-2 image collection
var s2Collection = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
  .filterBounds(aoi)
  .filterDate('2024-01-01', '2024-12-31')  // Adjust date range as needed
  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 5));
// Print the filtered collection to the console
print('Filtered Sentinel-2 Collection:', s2Collection);
// Function to calculate NDVI
var calculateNDVI = function(image) {
  var nir = image.select('B8');
  var red = image.select('B4');
  var ndvi = nir.subtract(red).divide(nir.add(red)).rename('NDVI');
  return image.addBands(ndvi);
};
// Apply the NDVI calculation to each image in the collection
var ndviCollection = s2Collection.map(calculateNDVI);
// Print the NDVI collection to the console
print('NDVI Collection:', ndviCollection);
// Calculate the minimum NDVI
var minNDVI = ndviCollection.select('NDVI').min();
// Calculate the median NDVI
var medianNDVI = ndviCollection.select('NDVI').median();
// Calculate the maximum NDVI
var maxNDVI = ndviCollection.select('NDVI').max();
// Add the RGB layer to the map
Map.centerObject(aoi, 9);  // Adjust zoom level as needed
Map.addLayer(s2Collection.median(), rgbParams, 'RGB median 2024');
// Add the min, median, and max NDVI layers to the map
Map.addLayer(minNDVI, ndviParams, 'Min NDVI');
Map.addLayer(medianNDVI, ndviParams, 'Median NDVI');
Map.addLayer(maxNDVI, ndviParams, 'Max NDVI');

// ---- 1.4 NDMI (moisture; "NDWI" after Gao) minimum, median and maximum ----
// Function to calculate NDMI
var calculateNDMI = function(image) {
  var swir1 = image.select('B11');
  var nir = image.select('B8');
  var ndmi = nir.subtract(swir1).divide(nir.add(swir1)).rename('NDMI');
  return image.addBands(ndmi);
};
// Apply the NDMI calculation to each image in the collection
var ndmiCollection = s2Collection.map(calculateNDMI);
// Calculate the minimum, median and maximum NDMI
var minNDMI = ndmiCollection.select('NDMI').min();
var medianNDMI = ndmiCollection.select('NDMI').median();
var maxNDMI = ndmiCollection.select('NDMI').max();
// Define visualization parameters for NDMI
var ndmiParams = {
  min: -1,
  max: 1,
  palette: ['blue', 'white', 'green']
};
Map.addLayer(minNDMI, ndmiParams, 'Min NDMI', false);
Map.addLayer(medianNDMI, ndmiParams, 'Median NDMI', false);
Map.addLayer(maxNDMI, ndmiParams, 'Max NDMI', false);

// ---- 1.5 EVI and SAVI with expression() and band maths ----
// Function to calculate EVI (Sentinel-2 SR is stored as reflectance x 10000)
var calculateEVI = function(image) {
  var nir = image.select('B8').divide(10000);
  var red = image.select('B4').divide(10000);
  var blue = image.select('B2').divide(10000);
  var evi = image.expression(
    '2.5 * ((NIR - RED) / (NIR + 6 * RED - 7.5 * BLUE + 1))',
    {
      'NIR': nir,
      'RED': red,
      'BLUE': blue
    }
  ).rename('EVI');
  return image.addBands(evi);
};
// Function to calculate SAVI (L = 0.5)
var calculateSAVI = function(image) {
  var nir = image.select('B8').divide(10000);
  var red = image.select('B4').divide(10000);
  var savi = nir.subtract(red).divide(nir.add(red).add(0.5)).multiply(1.5).rename('SAVI');
  return image.addBands(savi);
};
var indices = s2Collection.map(calculateEVI).map(calculateSAVI);
Map.addLayer(indices.select('EVI').median(), {min: 0, max: 0.8, palette: ['white', 'green']}, 'Median EVI', false);
Map.addLayer(indices.select('SAVI').median(), {min: 0, max: 0.8, palette: ['white', 'green']}, 'Median SAVI', false);
