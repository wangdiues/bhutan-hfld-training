/**
 * Calculating spectral indices and working with functions
 *
 * Bhutan ART-TREES HFLD Readiness Training, May 2026.
 * Source: D2-Exercise-Calculating spectral indices and working with functions.docx
 * Original authors: Ate Poortinga & Samuel (Conservation International).
 * Adapted with the trainers' permission for https://wangdiues.github.io/bhutan-hfld-training/
 * Code licence: MIT. Changes from the source are listed in CHANGELOG.md.
 *
 * Original Code Editor script(s):
 *   https://code.earthengine.google.com/946119d88943098d0e8c6bc7fb7bcc12
 */

// ---- Section 1: Load the Sentinel-2 Image ----
// Load the Sentinel-2 image
var s2img = ee.Image("COPERNICUS/S2_SR_HARMONIZED/20240109T044141_20240109T044757_T45RYL");

// ---- Section 2: Calculate NDVI ----
// Select the NIR (B8) and Red (B4) bands
var nir = s2img.select('B8');
var red = s2img.select('B4');
// Calculate NDVI
var ndvi = nir.subtract(red).divide(nir.add(red)).rename('NDVI');
// Description: NDVI is calculated using the formula (NIR−Red)/(NIR+Red)(NIR - Red) / (NIR + Red)(NIR−Red)/(NIR+Red). The NIR band (B8) and Red band (B4) are selected from the image, and the NDVI is computed and renamed for clarity.

// ---- Section 3: Define Visualization Parameters ----
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

// ---- Section 4: Add Layers to the Map ----
// Add RGB layer to the map
Map.centerObject(s2img, 9);  // Adjust zoom level as needed
Map.addLayer(s2img, rgbParams, 'RGB');
// Add SWIR-NIR-Red layer to the map
Map.addLayer(s2img, swirNirRedParams, 'SWIR-NIR-Red');
// Add NDVI layer to the map
Map.addLayer(ndvi, ndviParams, 'NDVI');
// Print NDVI image to the console
print('NDVI Image:', ndvi);

// ---- Combining all the sections, the full code looks like this: ----
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

// ---- Section 1: Load the Sentinel-2 Image ----
// Load the Sentinel-2 image
var s2img = ee.Image("COPERNICUS/S2_SR_HARMONIZED/20240109T044141_20240109T044757_T45RYL");

// ---- Section 2: Calculate NDWI ----
// Select the Green (B3) and NIR (B8) bands
var green = s2img.select('B3');
var nir = s2img.select('B8');
// Calculate NDWI
var ndwi = green.subtract(nir).divide(green.add(nir)).rename('NDWI');
// Description: NDWI is calculated using the formula (Green−NIR)/(Green+NIR). The Green band (B3) and NIR band (B8) are selected from the image, and the NDWI is computed and renamed for clarity.

// ---- Section 3: Define Visualization Parameters ----
// Define visualization parameters for NDWI
var ndwiParams = {
  min: -1,
  max: 1,
  palette: ['white', 'blue']
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

// ---- Section 4: Add Layers to the Map ----
// Add RGB layer to the map
Map.centerObject(s2img, 9);  // Adjust zoom level as needed
Map.addLayer(s2img, rgbParams, 'RGB');
// Add SWIR-NIR-Red layer to the map
Map.addLayer(s2img, swirNirRedParams, 'SWIR-NIR-Red');
// Add NDWI layer to the map
Map.addLayer(ndwi, ndwiParams, 'NDWI');
// Print NDWI image to the console
print('NDWI Image:', ndwi);

// ---- Combining all the sections, the full code looks like this: ----
// Load the Sentinel-2 image
var s2img = ee.Image("COPERNICUS/S2_SR_HARMONIZED/20240109T044141_20240109T044757_T45RYL");
// Select the Green (B3) and NIR (B8) bands
var green = s2img.select('B3');
var nir = s2img.select('B8');
// Calculate NDWI
var ndwi = green.subtract(nir).divide(green.add(nir)).rename('NDWI');
// Define visualization parameters for NDWI
var ndwiParams = {
  min: -1,
  max: 1,
  palette: ['white', 'blue']
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
// Add NDWI layer to the map
Map.addLayer(ndwi, ndwiParams, 'NDWI');
// Print NDWI image to the console
print('NDWI Image:', ndwi);

// ---- Section 1: Load and Filter Sentinel-2 Image Collection ----
// Define the area of interest (AOI)
var aoi = geometry;  // Replace with your geometry
// Load the Sentinel-2 image collection
var s2Collection = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
  .filterBounds(aoi)
  .filterDate('2024-01-01', '2024-12-31')  // Adjust date range as needed
  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 5));
// Print the filtered collection to the console
print('Filtered Sentinel-2 Collection:', s2Collection);

// ---- Section 2: Calculate NDVI for Each Image ----
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

// ---- Section 3: Calculate Min, Median, and Max NDVI Values ----
// Calculate the minimum NDVI
var minNDVI = ndviCollection.select('NDVI').min();
// Calculate the median NDVI
var medianNDVI = ndviCollection.select('NDVI').median();
// Calculate the maximum NDVI
var maxNDVI = ndviCollection.select('NDVI').max();

// ---- Section 4: Define Visualization Parameters ----
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

// ---- Section 5: Add Layers to the Map ----
// Add the RGB layer to the map
Map.centerObject(aoi, 9);  // Adjust zoom level as needed
Map.addLayer(s2Collection.median(), rgbParams, 'RGB');
// Add the min, median, and max NDVI layers to the map
Map.addLayer(minNDVI, ndviParams, 'Min NDVI');
Map.addLayer(medianNDVI, ndviParams, 'Median NDVI');
Map.addLayer(maxNDVI, ndviParams, 'Max NDVI');

// ---- Combining all the sections, the full code looks like this: ----
// Define the area of interest (AOI)
var aoi = geometry;  // Replace with your geometry
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
// Add the RGB layer to the map
Map.centerObject(aoi, 9);  // Adjust zoom level as needed
Map.addLayer(s2Collection.median(), rgbParams, 'RGB');
// Add the min, median, and max NDVI layers to the map
Map.addLayer(minNDVI, ndviParams, 'Min NDVI');
Map.addLayer(medianNDVI, ndviParams, 'Median NDVI');
Map.addLayer(maxNDVI, ndviParams, 'Max NDVI');

// ---- Section 1: Load and Filter Sentinel-2 Image Collection ----
// Define the area of interest (AOI)
var aoi = geometry;  // Replace with your geometry
// Load the Sentinel-2 image collection
var s2Collection = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
  .filterBounds(aoi)
  .filterDate('2024-01-01', '2024-12-31')  // Adjust date range as needed
  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 5));
// Print the filtered collection to the console
print('Filtered Sentinel-2 Collection:', s2Collection);

// ---- Section 2: Calculate NDWI (section 1.3) for Each Image ----
// Function to calculate NDWI
var calculateNDWI = function(image) {
  var swir1 = image.select('B11');
  var nir = image.select('B8');
  var ndwi = nir.subtract(swir1).divide(nir.add(swir1)).rename('NDWI');
  return image.addBands(ndwi);
};
// Apply the NDWI calculation to each image in the collection
var ndwiCollection = s2Collection.map(calculateNDWI);
// Print the NDWI collection to the console
print('NDWI Collection:', ndwiCollection);

// ---- Section 3: Calculate Min, Median, and Max NDWI (section 1.3) Values ----
// Calculate the minimum NDWI
var minNDWI = ndwiCollection.select('NDWI').min();
// Calculate the median NDWI
var medianNDWI = ndwiCollection.select('NDWI').median();
// Calculate the maximum NDWI
var maxNDWI = ndwiCollection.select('NDWI').max();

// ---- Section 4: Define Visualization Parameters ----
// Define visualization parameters for NDWI
var ndwiParams = {
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

// ---- Section 5: Add Layers to the Map ----
// Add the RGB layer to the map
Map.centerObject(aoi, 9);  // Adjust zoom level as needed
Map.addLayer(s2Collection.median(), rgbParams, 'RGB');
// Add the min, median, and max NDWI layers to the map
Map.addLayer(minNDWI, ndwiParams, 'Min NDWI');
Map.addLayer(medianNDWI, ndwiParams, 'Median NDWI');
Map.addLayer(maxNDWI, ndwiParams, 'Max NDWI');

// ---- Combining all the sections, the full code looks like this: ----
// Define the area of interest (AOI)
var aoi = geometry;  // Replace with your geometry
// Load the Sentinel-2 image collection
var s2Collection = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
  .filterBounds(aoi)
  .filterDate('2024-01-01', '2024-12-31')  // Adjust date range as needed
  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 5));
// Print the filtered collection to the console
print('Filtered Sentinel-2 Collection:', s2Collection);
// Function to calculate NDWI (section 1.3)
var calculateNDWI = function(image) {
  var swir1 = image.select('B11');
  var nir = image.select('B8');
  var ndwi = nir.subtract(swir1).divide(nir.add(swir1)).rename('NDWI');
  return image.addBands(ndwi);
};
// Apply the NDWI calculation to each image in the collection
var ndwiCollection = s2Collection.map(calculateNDWI);
// Print the NDWI collection to the console
print('NDWI Collection:', ndwiCollection);
// Calculate the minimum NDWI
var minNDWI = ndwiCollection.select('NDWI').min();
// Calculate the median NDWI
var medianNDWI = ndwiCollection.select('NDWI').median();
// Calculate the maximum NDWI
var maxNDWI = ndwiCollection.select('NDWI').max();
// Define visualization parameters for NDWI
var ndwiParams = {
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
// Add the RGB layer to the map
Map.centerObject(aoi, 9);  // Adjust zoom level as needed
Map.addLayer(s2Collection.median(), rgbParams, 'RGB');
// Add the min, median, and max NDWI layers to the map
Map.addLayer(minNDWI, ndwiParams, 'Min NDWI');
Map.addLayer(medianNDWI, ndwiParams, 'Median NDWI');
Map.addLayer(maxNDWI, ndwiParams, 'Max NDWI');

// ---- Function to calculate EVI: ----
// Function to calculate EVI
var calculateEVI = function(image) {
  var nir = image.select('B8');
  var red = image.select('B4');
  var blue = image.select('B2');
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

// ---- SAVI Calculation Function: ----
// Function to calculate SAVI
var calculateSAVI = function(image) {
  var nir = image.select('B8');
  var red = image.select('B4');
  var savi = nir.subtract(red).divide(nir.add(red).add(0.5)).multiply(1.5).rename('SAVI');
  return image.addBands(savi);
};
// Define the area of interest (AOI)
var aoi = geometry;  // Replace with your geometry
// Load the Sentinel-2 image
// Load sentinel 2 data product
var collection = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED').filterBounds(aoi)
// show the number of image in the collection
print('number of images:',collection.size())
// filter by image property
print(collection.first())
var startingDate = '2024-01-01';
var endDate = '2024-12-31'
// filter by dates
var s2_2024 = collection.filterDate(startingDate,endDate)
print('2024 images:', s2_2024)
// filter by the least cloud cover
var cloudfreeImg = s2_2024.sort("CLOUDY_PIXEL_PERCENTAGE", true).first() // true, false
print('cloud free image',cloudfreeImg)
// Define visualization parameters for RGB
var rgbParams = {
  bands: ['B4', 'B3', 'B2'],
  min: 0,
  max: 3000
};
Map.centerObject(aoi);
