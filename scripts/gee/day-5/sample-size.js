/**
 * Determining sample size
 *
 * Bhutan ART-TREES HFLD Readiness Training, May 2026.
 * Source: EXERCISE D5_ PART 1-DETERMINING SAMPLE SIZE.docx
 * Original authors: Ate Poortinga & Samuel (Conservation International).
 * Adapted with the trainers' permission for https://wangdiues.github.io/bhutan-hfld-training/
 * Code licence: MIT. Changes from the source are listed in CHANGELOG.md.
 *
 * Changes: the raster value report example's missing image name is filled in as LULC.
 *   - `proj_area` (used but not defined in the exercise) is Bhutan's boundary geometry.
 *   - The unused require() of a private repository (users/yourecoveredinbees/...) is commented out:
 *     for anyone without access it stops the script.
 *   - The "10 : 'Deforestation'" entry, commented out when the code was extracted, is restored.
 *
 * The land-cover map (projects/carbondevelopmentteam/...) and the embedding dot product are the
 * trainers' assets; with no access, use your own assembled map and compute the dot product (Part 3).
 *
 * Original Code Editor script(s):
 *   https://code.earthengine.google.com/375a74248c8bb15184ccf2c95c1d6db5
 */

// ---- Part 1: load administrative boundaries and define aoi (bhutan) ----
// var utils = require('users/yourecoveredinbees/CarbonDevelopmentTeam:CDT_Utilities/api');  // not used below
//Projection parameters
  var scale = 30;
  var proj = "EPSG:4326";
  var factor = 10000;
// ---------------------------------------------------------------------
// Load boundaries
var Bhutan = ee.FeatureCollection("projects/bhutan-hfld-readiness-training/assets/Bhutan");
// Define AOI (entire Bhutan)
var AOI = Bhutan;
var proj_area = Bhutan.geometry();  // area used for the strata areas (not defined in the exercise)
// Display AOI
Map.addLayer(AOI, {color: 'red'}, 'Bhutan AOI');
Map.centerObject(AOI, 7);

// ---- Part 2: Load Land Cover Map ----
// ---------------------------------------------------------------------
// Load image
// ---------------------------------------------------------------------
var LULC =  ee.Image('projects/carbondevelopmentteam/assets/Bhutan/BT002_Bhutan_HFLD/LULC_2024_20250812_epsg4326_10m');
// ---------------------------------------------------------------------
// Check image
// ---------------------------------------------------------------------
print("Loaded image", LULC);
// ---------------------------------------------------------------------
// Visualize image
// ---------------------------------------------------------------------
var LULC_viz = {min:1,max:10,palette:[
  'Orange'        ,// 1 Cropland
  'DarkGreen'     ,// 2 Forest
  'LightGreen'    ,// 3 Grassland
  'Turquoise'     ,// 4 Wetland
  'Grey'          ,// 5 Settlement
  'Hotpink'       ,// 6 Other Land
  'black'         ,// 7 null
  'black'         ,// 8 null
  'black'         ,// 9 null
  'Red'           ,//10 Deforestation
  ]};
Map.addLayer(
  LULC ,
  LULC_viz ,
  "Bhutan Land Cover",
  false
);

// ---- Part 3: Add a Deforestation dataset to the land cover map ----
// ---------------------------------------------------------------------
// AlphaEarth Embeddings Dot Product Deforestation Probability
// ---------------------------------------------------------------------
var GSEv1 = ee.ImageCollection('GOOGLE/SATELLITE_EMBEDDING/V1/ANNUAL');
var GSE2023 = GSEv1
      .filterDate('2023-01-01', '2024-01-01')
      .filterBounds(AOI)
      .mosaic();
var GSE2024 = GSEv1
      .filterDate('2024-01-01', '2025-01-01')
      .filterBounds(AOI)
      .mosaic();
var GSE2025 = GSEv1
      .filterDate('2025-01-01', '2026-01-01')
      .filterBounds(AOI)
      .mosaic();
// Calculate dot product as a measure of similarity between embedding vectors.
// Note for vectors with a magnitude of 1, this simplifies to the cosine of the
// angle between embedding vectors.
var dotProd = GSE2024
    .multiply(GSE2025)
    .reduce(ee.Reducer.sum());
//Note: We will use a pre-loaded version of the AlphaEarth Embeddings Dot Product
var dotProd = ee.Image('projects/bhutan-hfld-readiness-training/assets/GSEdotProd/GSEdotProd_2425')
var GSE_defor = dotProd.lt(0.955).updateMask(LULC.eq(2)).unmask(0);
Map.addLayer(GSE_defor.selfMask(),{min:0,max:1,palette:['black','red']}, 'Google Satellite Embeddings Deforestation',false);

// ---- How we obtain a raster value report (Example, use the script below) ----
var LC_list = ee.Dictionary(LULC.reduceRegion({
  reducer: ee.Reducer.frequencyHistogram(),
  geometry: LULC.geometry().bounds(),
  scale: scale,
  crs: proj,
  maxPixels: 1e13
}).get(LULC.bandNames().get(0))).keys()
.map(function(obj){return ee.Number.parse(obj)});

// ---- Full code for part 4: ----
// ---------------------------------------------------------------------
// Dictionary referencing raster values to human readable names for the raster // values
// ---------------------------------------------------------------------
var LC_Dict = ee.Dictionary({
      0 : 'null'              ,
      1 : 'Cropland'          ,
      2 : 'Forest'            ,
      3 : 'Grassland'         ,
      4 : 'Wetland'           ,
      5 : 'Settlement'        ,
      6 : 'Other Land'        ,
     10 : 'Deforestation'
});
//Review the stratification map
var mapSelect = LULC.updateMask(GSE_defor.unmask(0).neq(1)).unmask(10)
                    .updateMask(LULC.unmask(0).neq(0)).unmask(0);
Map.addLayer(mapSelect,LULC_viz,'Bhutan Land Cover Change',1,0.5);
// ---------------------------------------------------------------------
// Raster Value Report
// ---------------------------------------------------------------------
var LC_list = ee.Dictionary(mapSelect.reduceRegion({
  reducer: ee.Reducer.frequencyHistogram(),
  geometry: mapSelect.geometry().bounds(),
  scale: scale,
  crs: proj,
  maxPixels: 1e13
}).get(mapSelect.bandNames().get(0))).keys()
.map(function(obj){return ee.Number.parse(obj)})
;
// ---------------------------------------------------------------------
// Print your raster value list, as well as their human readable names
// ---------------------------------------------------------------------
print('Land Cover Numbers',LC_list);
print('Land Cover Types',LC_list.map(function(obj){return LC_Dict.get(obj)}));

// ---- Part 5: Create a table of areas for each strata ----
// -------------------------
// AREA CALCULATION
// -------------------------
function areaCalc(img,scal,prj,fact,aoi){
  var x = img.multiply(ee.Image.pixelArea().divide(fact))
                .reduceRegion({reducer:ee.Reducer.sum(),
                                geometry:aoi,
                                scale:scal,
                                crs:prj,
                                maxPixels:1e12})
  return ee.Number(x.get(x.keys().get(0)));
  }
// ---------------------------------------------------------------------
// Create a table for Export
// ---------------------------------------------------------------------
var strataReport = ee.FeatureCollection(
  LC_list.iterate(
    function(curr,prev) {
      var currImg = ee.Image(ee.Number(curr));
      var strataArea = areaCalc(mapSelect.eq(currImg),scale,proj,factor,proj_area);
      var curr_ft = ee.Feature(null,{
        'lc_no'   : curr,
        'lc_name' : LC_Dict.get(curr),
        'lc_area' : strataArea
      });
      prev = ee.FeatureCollection(prev).toList(ee.FeatureCollection(prev).size().add(1));
      var returnList = ee.List([prev,curr_ft]).flatten();
      return  ee.FeatureCollection(returnList);
    },ee.FeatureCollection([]))
);
print('Export Table:', strataReport);
// -------------------------
// Display Table in Console
// -------------------------
var strataReport_cols = [
  'lc_name',
  'lc_area'
  ];
  var strataReport_tbl = ui.Chart.feature.byFeature(strataReport, 'lc_no', strataReport_cols)
    .setChartType('Table')
    .setOptions({allowHtml: true, pageSize: 20}); // bigger to show TOTAL without paging
  print('Strata Report', strataReport_tbl);

// ---- Comma-separated Table of a FeatureCollection with no geometries ----
Export.table.toDrive({
  collection: strataReport,
  description: "bhutan_strata_report",
  fileFormat: 'csv'
});
