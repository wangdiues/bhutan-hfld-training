/**
 * Satellite embeddings: similarity search and year-to-year similarity
 *
 * Bhutan ART-TREES HFLD Readiness Training, May 2026.
 * Accompanies: D4-Use of Google_s Satellite Embedding dataset.pptx (slides 12-22).
 * Original authors: Ate Poortinga & Samuel (Conservation International).
 * Adapted with the trainers' permission for https://wangdiues.github.io/bhutan-hfld-training/
 * The slides show these steps as figures and linked scripts; this script was written for the website.
 * Code licence: MIT.
 */

// Satellite Embedding V1: one 64-band image (A00-A63) per year, 10 m, unit-length vectors.
// https://developers.google.com/earth-engine/datasets/catalog/GOOGLE_SATELLITE_EMBEDDING_V1_ANNUAL
var embeddings = ee.ImageCollection('GOOGLE/SATELLITE_EMBEDDING/V1/ANNUAL');
var thimphuArea = ee.Geometry.Point([89.64, 27.47]).buffer(8000);
var getYear = function(year) {
  return embeddings
      .filterDate(year + '-01-01', (year + 1) + '-01-01')
      .filterBounds(thimphuArea)
      .mosaic();
};
var emb2024 = getYear(2024);
Map.centerObject(thimphuArea, 13);
Map.addLayer(emb2024.clip(thimphuArea), {bands: ['A01', 'A16', 'A09'], min: -0.3, max: 0.3}, 'Embeddings 2024 (3 of 64 axes)');

// ---- 1. Similarity search: how similar is every pixel to one built-up point? ----
var builtUp = ee.Geometry.Point([89.6419, 27.4661]);  // central Thimphu (the slide's sample point)
var reference = emb2024.sample({region: builtUp, scale: 10}).first();
var bandNames = emb2024.bandNames();
var refVector = ee.Image.constant(reference.toDictionary(bandNames).values(bandNames)).rename(bandNames);
// Dot product of two unit-length vectors = cosine similarity, from -1 to 1.
var similarity = emb2024.multiply(refVector).reduce(ee.Reducer.sum()).rename('similarity');
Map.addLayer(similarity.clip(thimphuArea), {min: 0, max: 1, palette: ['000004', '51127c', 'b73779', 'fc8961', 'fcfdbf']},
    'Similarity to the built-up point');
Map.addLayer(builtUp, {color: 'cyan'}, 'Sampled point');

// ---- 2. Similarity in time: the same pixel in 2017 and 2024 ----
var emb2017 = getYear(2017);
var stability = emb2017.multiply(emb2024).reduce(ee.Reducer.sum()).rename('stability');
Map.addLayer(stability.clip(thimphuArea), {min: 0.5, max: 1, palette: ['d73027', 'fee08b', 'ffffff']},
    'Similarity 2017 vs 2024 (low = change)', false);
