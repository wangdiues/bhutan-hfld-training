/**
 * JavaScript basics: solution to the "fill in the blanks" practice
 *
 * Bhutan ART-TREES HFLD Readiness Training, course website.
 * Adapted from "EXERCISE D1_ JAVASCRIPT BASICS IN GOOGLE EARTH ENGINE" by Ate Poortinga & Samuel,
 * Conservation International (May 2026). Code licence: MIT.
 */

var paroData = {
  'city': 'Paro',
  'coordinates': [89.41, 27.43],
  'dzongkhag': 'Paro'
};
print(paroData);
print('Longitude:', paroData.coordinates[0]);

var describe = function(place) {
  return place.city + ' is at ' + place.coordinates[1] + ' N, ' + place.coordinates[0] + ' E';
};
print(describe(paroData));

var paroPoint = ee.Geometry.Point(paroData.coordinates);
Map.centerObject(paroPoint, 11);
Map.addLayer(paroPoint, {color: 'red'}, 'Paro');
