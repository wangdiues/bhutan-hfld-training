/**
 * JavaScript basics in Google Earth Engine
 *
 * Bhutan ART-TREES HFLD Readiness Training, May 2026.
 * Source: EXERCISE D1_ JAVASCRIPT BASICS IN GOOGLE EARTH ENGINE.docx
 * Original authors: Ate Poortinga & Samuel (Conservation International).
 * Adapted with the trainers' permission for https://wangdiues.github.io/bhutan-hfld-training/
 * Code licence: MIT. Changes from the source are listed in CHANGELOG.md.
 */

// ---- Learning Outcomes ----
// 1. Variables
var city = 'Thimphu';
print(city);
// 2. List
var cities = ['Thimphu', 'Paro', 'Punakha', 'Phuentsholing', 'Gelephu'];
print(cities);
// 3. Dictionary
var cityData = {
  'city': city,
  'population': 114551, // 2017 census (the source had 787000, close to Bhutan's national population)
  'coordinates': [89.64, 27.47]
};
print(cityData);
// 4. Function
var greet = function(name) {
  return 'Hello ' + name;
};
print(greet('World'));
print(greet('Thank you'));

// ---- Learning Outcomes ----
// Step 1: Define Area of Interest (AOI)
var aoi = ee.Geometry.Point([90.4336, 27.5142]); // Example: Bhutan
// Step 2: Import Landsat 8 Image Collection
var l8col = ee.ImageCollection("LANDSAT/LC08/C02/T1_TOA");
// Step 3: Filter by Location (AOI)
// filterBounds keeps only images that intersect the defined AOI
l8col = l8col.filterBounds(aoi);
// Step 4: Display collection information
print('Number of images in collection:', l8col.size());
print('First image in collection:', l8col.first());
// Step 5: Select the least cloudy image
var cloudfreeImg = l8col.sort("CLOUD_COVER").first();
print('Cloud-free image:', cloudfreeImg);
// Step 6: Define visualization parameters
var imageVisParam = {
  bands: ['B4', 'B3', 'B2'], // True color (RGB)
  min: 0,
  max: 0.3,
  gamma: [0.95, 1.1, 1]
};
// Step 7: Display the image on the map
Map.addLayer(cloudfreeImg, imageVisParam, 'Cloud-free Image');
// Step 8: Center the map on the AOI
Map.centerObject(aoi, 8);

// ---- Learning Outcomes ----
// Step 1: Import the GAUL level 2 feature collection
var countries = ee.FeatureCollection("FAO/GAUL_SIMPLIFIED_500m/2015/level2");
// Step 2: Inspect the dataset
print('First feature:', countries.first());
// Step 3: Summarize by country name
var countryHistogram = countries.aggregate_histogram("ADM0_NAME");
print('Country distribution:', countryHistogram);
// Step 4: Filter Bhutan (replace with your country of interest if needed)
var bhutan = countries.filter(ee.Filter.eq("ADM0_NAME", "Bhutan"));
print('First Bhutan feature:', bhutan.first());
// Step 5: Display the filtered features
Map.addLayer(bhutan, {}, 'Bhutan');
