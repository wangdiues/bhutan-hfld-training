/**
 * Writing custom functions and mapping across image collections
 *
 * Bhutan ART-TREES HFLD Readiness Training, May 2026.
 * Source: EXERCISE D1_ Writing Custom Functions and Mapping Across Image Collections.docx
 * Original authors: Ate Poortinga & Samuel (Conservation International).
 * Adapted with the trainers' permission for https://wangdiues.github.io/bhutan-hfld-training/
 * Code licence: MIT. Changes from the source are listed in CHANGELOG.md.
 *
 * Changes: the step-by-step snippets are merged into one script that runs top to bottom;
 * StudyArea (a geometry you draw in the exercise) defaults to Bhutan's national boundary.
 */

// ---- Study area ----
// In the exercise you draw a polygon and name it StudyArea. This default uses Bhutan.
var StudyArea = ee.FeatureCollection('USDOS/LSIB_SIMPLE/2017')
  .filter(ee.Filter.eq('country_na', 'Bhutan'))
  .geometry();

// ---- Create a Landsat image collection object ----
var L8_collection = ee.ImageCollection('LANDSAT/LC08/C02/T1_RT_TOA');
Map.addLayer(L8_collection, {min: 0.05, max: 0.8, bands: ['B6', 'B5', 'B4']}, 'Landsat Collection', false);
Map.setCenter(90.4336, 27.5142, 7);

// ---- Filter the image collection by geometry ----
var L8_StudyArea = L8_collection.filterBounds(StudyArea);
Map.addLayer(L8_StudyArea, {min: 0.05, max: 0.8, bands: ['B6', 'B5', 'B4']}, 'Landsat 8 in study region', false);
Map.centerObject(StudyArea, 7);
print('Count of L8_StudyArea: ', L8_StudyArea.size());
// Convert the collection to a list (1500 is more than enough) and count it again.
var listL8_SA = L8_StudyArea.toList(1500);
print('number of images', listL8_SA.length());

// ---- Create a date-limited image collection ----
var L8_SA_2025 = L8_StudyArea.filterDate('2025-01-01', '2025-12-31');
print('Count of L8_SA_2025: ', L8_SA_2025.size());
// Statistics for a property of the images in the collection.
print('Sun elevation statistics: ', L8_SA_2025.aggregate_stats('SUN_ELEVATION'));
// Sort by cloud cover and take the least cloudy image.
var LoCloudimage = ee.Image(L8_SA_2025.sort('CLOUD_COVER').first());
print('Least cloudy image: ', LoCloudimage);
// The 10 most recent images.
var recent = L8_SA_2025.sort('system:time_start', false).limit(10);
print('Recent images: ', recent);

// ---- Image collection reducers: median pixel value ----
var median_L8_2025 = L8_SA_2025.median();
Map.addLayer(median_L8_2025, {min: 0.05, max: 0.8, bands: ['B6', 'B5', 'B4']}, 'median_L8_2025 with clouds');

// ---- Function primer ----
// function name_of_function(parameter_1, parameter_2) {
//   // code to execute
// }
// name_of_function(input_1, input_2);

// ---- A function that calculates the sum of two numbers ----
// Sum is a local variable: it exists only inside the function.
// "return" hands the result back so it can be saved in a global variable.
function calculate_Sum(in_value1, in_value2) {
  var Sum = ee.Number(in_value1).add(ee.Number(in_value2));
  print('Local variable, Sum, = ', Sum);
  return Sum;
}
calculate_Sum(99, 106);
var Sum_test = calculate_Sum(75, 82);
print('The global variable, Sum_test, = ', Sum_test);

// ---- Cloud masking as a function ----
// Pixels with a simpleCloudScore above the threshold are masked.
var cloud_thresh = 40;
var cloudfunction = function(image) {
  // Add the cloud likelihood band to the image.
  var CloudScore = ee.Algorithms.Landsat.simpleCloudScore(image);
  // Isolate the cloud likelihood band.
  var quality = CloudScore.select('cloud');
  // Get pixels above the threshold.
  var cloud01 = quality.gt(cloud_thresh);
  // Create a mask from the high-likelihood pixels and mask them.
  var cloudmask = image.mask().and(cloud01.not());
  return image.mask(cloudmask);
};

// Apply it to one image.
var LC8_image = ee.Image('LANDSAT/LC08/C02/T1_RT_TOA/LC08_138041_20260101');
var LC8_imageNoClouds = cloudfunction(LC8_image);
Map.addLayer(LC8_imageNoClouds, {bands: ['B6', 'B5', 'B4'], min: 0.1, max: 0.5}, 'Landsat8scene_cloudmasked');

// ---- Mapping a function across an image collection ----
var L8_SA_2025NoClouds = L8_SA_2025.map(cloudfunction);
Map.addLayer(ee.Image(L8_SA_2025NoClouds.first()),
  {min: 0.05, max: 0.8, bands: ['B6', 'B5', 'B4']}, 'first image no clouds');
// Median of the cloud-free images.
var median_L8_2025NoClouds = L8_SA_2025NoClouds.median();
print(median_L8_2025NoClouds, 'median_L8_2025NoClouds');
Map.addLayer(median_L8_2025NoClouds,
  {min: 0.05, max: 0.8, bands: ['B6', 'B5', 'B4']}, 'median composite of cloud free images');
