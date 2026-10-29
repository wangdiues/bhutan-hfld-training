/**
 * Exporting data
 *
 * Bhutan ART-TREES HFLD Readiness Training, May 2026.
 * Source: D2-Exercise-Exporting Data.docx
 * Original authors: Ate Poortinga & Samuel (Conservation International).
 * Adapted with the trainers' permission for https://wangdiues.github.io/bhutan-hfld-training/
 * Code licence: MIT. Changes from the source are listed in CHANGELOG.md.
 *
 * Changes: the exercise's ?? blanks are filled with a worked solution for Bhutan.
 *
 * Original Code Editor script(s):
 *   https://code.earthengine.google.com/0769e2dbd6752d9dbf8ed8c2da1743fe
 */

// ---- Exporting Data ----
// Either import shapefile data of an AOI  or use the FAO country boundary
// Import the FAO Global Administrative Unit Layers (GAUL) level 2 feature collection.
var countries = ee.FeatureCollection("FAO/GAUL_SIMPLIFIED_500m/2015/level2");
// Print the first feature to understand the structure of the feature collection
print('First country feature:', countries.first());
// Group by Property Name
var countryHistogram = countries.aggregate_histogram("ADM0_NAME");
print('Group by country names:', countryHistogram);
// Filter by Specific AOI, your country name of interest
var AOI = countries.filter(ee.Filter.eq("ADM0_NAME", "Bhutan")); // Replace "Bhutan" with your country of interest.
// Load NICFI Basemaps for Asia from Planet
var planet = ee.ImageCollection('projects/planet-nicfi/assets/basemaps/asia');
var img = planet.filter(ee.Filter.eq('cadence','monthly')).filterDate('2023-03-01','2023-03-30').toList(1).get(0);
var img = ee.Image(img).clip(AOI);
print(img);
//Show layer
Map.addLayer(img,{min:0,max:3000,bands:"R,G,B"},"planet image");
Map.centerObject(AOI, 8); // Choose your zoom level
//Export to Google drive
Export.image.toDrive({
  image: img,
  description: 'Planet_March23',
  region: AOI,
  folder: 'PlanetSope',
  scale: 4.7,
  maxPixels:1e13
})

// ---- 2. Please download dataset for GOOGLE/DYNAMICWORLD/V1 for the year period 2023 ----
//Define date
var startDate = '2023-01-01'; // dates defined as yyyy-mm-dd
var endDate = '2024-01-01';
var dw = ee.ImageCollection('GOOGLE/DYNAMICWORLD/V1')
  .filterDate(startDate, endDate); // dates defined here or by variables
var dwImage = ee.Image(dw.mosaic()).clip(AOI); // set your AOI variable
print('dwImage', dwImage)
//Display the layer
var classification = dwImage.select('label');
var VIS_PALETTE ={
  min:0,
  max:8,
  palette: [
    '419BDF', '397D49', '88B053', '7A87C6',
    'E49635', 'DFC35A', 'C4281B', 'A59B8F',
    'B39FE1']
};
Map.addLayer(classification, VIS_PALETTE, 'Dynamic World Classification');
//Export the filtered dataset
Export.image.toDrive({
  image: classification,
  description: 'DynamicWorld_2023',
  region: AOI,
  folder: 'GEE_exports',
  scale: 10,
  maxPixels: 1e13
})

// ---- 3. Please download the Google Open Building dataset in GeoJSON ----
// Import the Google Open Building dataset.
var OB = ee.FeatureCollection("GOOGLE/Research/open-buildings/v3/polygons");
// Filter the Google Open Building dataset
var OB_Roi = OB.filterBounds(AOI);
//Add Google Open Building to the map
Map.addLayer(OB_Roi,{},'OB_Roi')
// Export the filtered dataset to a GeoJSON file in your Google Drive account.
Export.table.toDrive({
  collection: OB_Roi,
  description: 'OpenBuildings_AOI',
  folder: 'GEE_exports',
  fileFormat:'GeoJSON',
});

// ---- 4. Export data in Video ----
//Draw AOI (Bhutan)
var AOI =
    /* color: #d63000 */
    /* displayProperties: [
      {
        "type": "rectangle"
      }
    ] */
    ee.Geometry.Polygon(
        [[[88.746, 28.246],
          [88.746, 26.702],
          [92.125, 26.702],
          [92.125, 28.246]]], null, false);
// Load Landsat 5 imagery
var collection = ee.ImageCollection('LANDSAT/LT05/C02/T1_TOA')
    // Bhutan (approx central tile)
    .filterMetadata('WRS_PATH', 'equals', 137)
    .filterMetadata('WRS_ROW', 'equals', 41)
    // Filter cloudy scenes
    .filterMetadata('CLOUD_COVER', 'less_than', 10)
    // 20 years
    .filterDate('1984-04-19', '2011-11-08')
    // Select the required bands
    .select(['B7', 'B4', 'B3']);
// Take the median of the collection to reduce it to a single image
var medianImage = collection.median().multiply(512).uint8();
Map.centerObject(AOI, 7);
Map.addLayer(medianImage, {}, 'Median Image');
// Export the video (change dimensions or scale for higher quality)
Export.video.toDrive({
  collection: collection.map(function(image) {
      return image.multiply(512).uint8();
  }),
  description: 'example_video',
  dimensions: '720',
  framesPerSecond: 15,
  region: JSON.stringify(AOI.getInfo())
});
