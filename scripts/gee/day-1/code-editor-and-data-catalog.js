/**
 * Exploring the data archive in Google Earth Engine
 *
 * LULC Mapping Training: https://wangdiues.github.io/lulc-mapping-training/
 * Acknowledgements and sources: https://wangdiues.github.io/lulc-mapping-training/about/credits/
 * Code licence: MIT. Changes from the source are listed in CHANGELOG.md:
 *   - Malaysian city examples replaced with Bhutanese ones; Thimphu's longitude 83.63 -> 89.64;
 *     population 114,551 -> 114551 (a comma inside a number is a JavaScript error).
 *   - `aoi` is defined in code (around Thimphu) instead of a geometry drawn on the map.
 *   - The GAUL FeatureCollection is filtered to Bhutan and displayed (the slide stops at loading it).
 *   - Slide 19's `cloudfreeImg` is renamed `s2CloudfreeImg`, and its repeat of `rgbParams` (identical to
 *     slide 16) is dropped, so the Landsat and Sentinel-2 parts can run in one script.
 */

// ---- Comments and print (slides 9-10) ----
// This is a comment!
print('Hello World');

// ---- Variables and lists (slide 11) ----
var city = 'Thimphu';
print(city);
var cities = ['Thimphu', 'Paro', 'Punakha', 'Wangdue Phodrang'];
print(cities);

// ---- Objects and functions (slide 12) ----
var cityData = {
  'city': 'Thimphu',
  'coordinates': [89.64, 27.47],
  'population': 114551
};
print(cityData);

var greet = function(name) {
  return 'Hello ' + name;
};
print(greet('World'));
print(greet('Readers'));

// Area of interest: 10 km around Thimphu. (In the training, learners drew `aoi` on the map.)
var aoi = ee.Geometry.Point([89.64, 27.47]).buffer(10000);

// ---- Image (ee.Image) for Landsat (slide 15) ----
// Fundamental raster data type for choosing an individual image in Earth Engine.
var LC8_image= ee.Image('LANDSAT/LC08/C02/T1_TOA/LC08_138041_20260101')

//Display Image
Map.addLayer(LC8_image,{bands:['B6', 'B5', 'B4'],min: 0.05, max: 0.8,gamma: 1.6}, 'Landsat8scene');

// ---- Image (ee.Image) for Sentinel-2 (slide 16) ----
//Import single image
//-----------------------------
var s2_image= ee.Image('COPERNICUS/S2_SR_HARMONIZED/20250103T044201_20250103T044548_T45RYL')
// Define visualization parameters for False Color
//-----------------------------------------
var rgbParams = {
  bands: ['B4', 'B3', 'B2'],
  min: 0,
  max: 3000
};
//Display Image
//-------------------------------------------
Map.addLayer(s2_image,rgbParams, 's2scene');

// ---- ImageCollection (ee.ImageCollection) for Landsat (slide 17) ----
// A stack of satellite images you can filter and process for cloud-free composites or time-series analysis
var l8col = ee.ImageCollection("LANDSAT/LC08/C02/T1_TOA");

// filter by location/geometry
l8col = l8col.filterBounds(aoi)

// show the number of image in the collection
print('number of images:',l8col.size())

// filter by image property
print(l8col.first())

// filter by the least cloud cover
var cloudfreeImg = l8col.sort("CLOUD_COVER", true).first() // true, false
print('cloud free image',cloudfreeImg)


var vis = {
  bands: ['B4', 'B3', 'B2'], // Landsat RGB
  min: 0,
  max: 0.3
};

Map.centerObject(aoi, 10);
Map.addLayer(cloudfreeImg, vis, 'Least Cloud Image');

// ---- ImageCollection (ee.ImageCollection) for Sentinel-2 (slide 19) ----
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
var s2CloudfreeImg = s2_2024.sort("CLOUDY_PIXEL_PERCENTAGE", true).first() // true, false
print('cloud free image',s2CloudfreeImg)
//Display image
Map.addLayer(s2CloudfreeImg,rgbParams,'cloud free image')

// ---- FeatureCollection (ee.FeatureCollection) (slide 21) ----
// ============================================================
// 1. LOAD GAUL LEVEL 1
// ============================================================
var GAUL_2024_L1 = ee.FeatureCollection(
  "projects/sat-io/open-datasets/FAO/GAUL/GAUL_2024_L1"
);
// Bhutan's Dzongkhags (added for the website).
var dzongkhags = GAUL_2024_L1.filter(ee.Filter.eq('gaul0_name', 'Bhutan'));
print('Dzongkhags:', dzongkhags.size(), dzongkhags.first());
Map.addLayer(dzongkhags, {color: 'orange'}, 'Dzongkhags (GAUL 2024 level 1)');
