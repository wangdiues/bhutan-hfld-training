/**
 * Feature collections and basic vector analysis: buffer, clip, merge, union
 *
 * Bhutan ART-TREES HFLD Readiness Training, May 2026.
 * Source: D2-Importing and Exporting Datasets with Google Earth Engine (GEE).pptx (slides 3-7, 14).
 * Original authors: Ate Poortinga & Samuel (Conservation International).
 * Adapted with the trainers' permission for https://wangdiues.github.io/bhutan-hfld-training/
 * Slide 14's code is copied as is; the buffer, clip, merge and union examples were written for the
 * website (the slides explain them with figures only). Code licence: MIT.
 */

// ---- Visualise the features (slide 14) ----
var countries  = ee.FeatureCollection("projects/sat-io/open-datasets/FAO/GAUL/GAUL_2024_L0");
print(countries.limit(10));

var Bhutan = countries.filter(ee.Filter.eq('gaul0_name', 'Bhutan'));

var studyArea = Bhutan;

Map.addLayer(studyArea.draw('red'), {}, "Bhutan");
Map.centerObject(studyArea, 8);

// ---- Buffer: a zone of a set width around a feature ----
var thimphu = ee.Geometry.Point([89.64, 27.47]);
var paro = ee.Geometry.Point([89.41, 27.43]);
var thimphuZone = thimphu.buffer(15000);  // 15 km, in metres
var paroZone = paro.buffer(15000);
Map.addLayer(thimphuZone, {color: 'blue'}, 'Buffer: 15 km around Thimphu');

// ---- Clip: keep only the part inside a boundary ----
// Vector: intersect a geometry with the boundary. Raster: image.clip(boundary).
var bhutanGeom = Bhutan.geometry();
// A 15 km buffer around Phuentsholing crosses into India; keep only the part inside Bhutan.
var phuentsholingZone = ee.Geometry.Point([89.39, 26.85]).buffer(15000);
var clippedZone = phuentsholingZone.intersection(bhutanGeom, ee.ErrorMargin(1));
Map.addLayer(clippedZone, {color: 'green'}, 'Clip: Phuentsholing buffer inside Bhutan');
var elevation = ee.Image('USGS/SRTMGL1_003').clip(thimphuZone);
Map.addLayer(elevation, {min: 2000, max: 4500}, 'Clip: elevation inside the Thimphu buffer');

// ---- Merge: combine two feature collections into one ----
var towns = ee.FeatureCollection([
  ee.Feature(thimphuZone, {name: 'Thimphu'}),
  ee.Feature(paroZone, {name: 'Paro'})
]);
var more = ee.FeatureCollection([ee.Feature(ee.Geometry.Point([89.86, 27.58]).buffer(15000), {name: 'Punakha'})]);
var merged = towns.merge(more);
print('Merged features:', merged.size());
Map.addLayer(merged, {color: 'orange'}, 'Merge: three buffers in one collection');

// ---- Union: dissolve overlapping features into one ----
var dissolved = merged.union(ee.ErrorMargin(1));
print('Features after union:', dissolved.size());
Map.addLayer(dissolved, {color: 'purple'}, 'Union: dissolved buffers');
