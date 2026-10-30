/**
 * Bhutan MRV Sentinel-2 composite: two seasonal composites (Jan-Apr, Oct-Dec) in one Int16 image
 *
 * Bhutan ART-TREES HFLD Readiness Training, May 2026.
 * Source: D2-Bhutan_MRV_S2_Composite_Manual.docx (section 16, "Full script").
 * Original authors: Ate Poortinga & Samuel (Conservation International).
 * Adapted with the trainers' permission for https://wangdiues.github.io/bhutan-hfld-training/
 * Code licence: MIT. Changes from the source are listed in CHANGELOG.md:
 *   - Only the manual's full script is kept (the step-by-step sections repeat it).
 *   - The main collection is COPERNICUS/S2_SR_HARMONIZED (surface reflectance), as the manual's
 *     output specification says; the script loaded COPERNICUS/S2_HARMONIZED (top of atmosphere),
 *     which also mismatched the surface-reflectance reference used by TDOM.
 *   - `geometry` (a drawn point used only for the preview layers) defaults to Thimphu.
 *
 * Learners need read access to projects/bhutan-hfld-readiness-training/assets/Bhutan, or can
 * replace it with their own boundary asset. The export writes to the training project: change
 * assetId to a folder in your own project.
 *
 * Original Code Editor script(s):
 *   https://code.earthengine.google.com/53d893180be40059cfde3df41385950a
 */

// A point used only to preview single images. (In the training, a point drawn on the map.)
var geometry = ee.Geometry.Point([89.64, 27.47]);

var countries = ee.FeatureCollection('projects/bhutan-hfld-readiness-training/assets/Bhutan')
Map.addLayer(countries, {}, 'bhutan');
var Bhutan = countries;
var studyArea = Bhutan;
var targetYear = 2025;
var CloudCoverMax = 30;
var CLEAR_THRESHOLD = 0.60;
var janAprStart = ee.Date.fromYMD(targetYear, 1, 1);
var janAprEnd   = ee.Date.fromYMD(targetYear, 4, 30).advance(1, 'day');
var octDecStart = ee.Date.fromYMD(targetYear, 10, 1);
var octDecEnd   = ee.Date.fromYMD(targetYear, 12, 31).advance(1, 'day');
var spectralBands = ['B2', 'B3', 'B4', 'B8', 'B11', 'B12'];
function getS2Collection(startDate, endDate) {
  return ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
    .filterDate(startDate, endDate)
    .filterBounds(studyArea)
    .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', CloudCoverMax))
}
var s2_janApr_raw = getS2Collection(janAprStart, janAprEnd);
var s2_octDec_raw = getS2Collection(octDecStart, octDecEnd);
print('Raw S2 Jan-Apr', s2_janApr_raw.size());
print('Raw S2 Oct-Dec', s2_octDec_raw.size());
var csPlus = ee.ImageCollection('GOOGLE/CLOUD_SCORE_PLUS/V1/S2_HARMONIZED');
var QA_BAND = 'cs_cdf';
function applyCloudScore(collection) {
  return collection
    .linkCollection(csPlus, [QA_BAND])
    .map(function(img) {
      return img.updateMask(img.select(QA_BAND).gte(CLEAR_THRESHOLD));
    });
}
Map.addLayer(s2_octDec_raw.filterBounds(geometry).first(),{min:0,max:3000,bands:"B4,B3,B2"},"s2 image");
var s2_janApr = applyCloudScore(s2_janApr_raw)
var s2_octDec = applyCloudScore(s2_octDec_raw)
Map.addLayer(s2_octDec.filterBounds(geometry).first(),{min:0,max:3000,bands:"B4,B3,B2"},"after cloud removal");
var zScoreThresh = -1.8;
var shadowSumThresh = 0.20;
var contractPixels = 1.5;
var dilatePixels = 2.5;
function applyTDOM(collection, refStart, refEnd) {
  var inBands = ['B8', 'B11'];
  var outBands = ['nir', 'swir1'];
  var refCollection = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
    .filterBounds(studyArea)
    .filterDate(refStart, refEnd)
    .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 30))
    .select(inBands, outBands)
    .map(function(img) {
      return img.divide(10000).copyProperties(img, img.propertyNames());
    });
  var irStdDev = refCollection.reduce(ee.Reducer.stdDev());
  var irMean = refCollection.mean();
  function maskDarkOutliers(img) {
    var scaled = img.select(inBands, outBands).divide(10000);
    var zScore = scaled.subtract(irMean).divide(irStdDev);
    var irSum = scaled.reduce(ee.Reducer.sum());
    var tdomMask = zScore.lt(zScoreThresh)
      .reduce(ee.Reducer.sum())
      .eq(2)
      .and(irSum.lt(shadowSumThresh));
    tdomMask = tdomMask.focal_min(contractPixels).focal_max(dilatePixels);
    return img.updateMask(tdomMask.not());
  }
  return collection.map(maskDarkOutliers);
}
s2_janApr = applyTDOM(
  s2_janApr,
  ee.Date.fromYMD(targetYear - 3, 1, 1),
  ee.Date.fromYMD(targetYear, 4, 30).advance(1, 'day')
);
s2_octDec = applyTDOM(
  s2_octDec,
  ee.Date.fromYMD(targetYear - 3, 10, 1),
  ee.Date.fromYMD(targetYear, 12, 31).advance(1, 'day')
);
Map.addLayer(s2_octDec.filterBounds(geometry).first(),{min:0,max:3000,bands:"B4,B3,B2"},"after shadow removal");
var dem = ee.Image('USGS/SRTMGL1_003');
var terrain = ee.Algorithms.Terrain(dem);
var slope = terrain.select('slope');
var aspect = terrain.select('aspect');
var slp_rad = slope.multiply(Math.PI).divide(180);
var asp_rad = aspect.multiply(Math.PI).divide(180);
var cosS = slp_rad.cos();
var sinS = slp_rad.sin();
function topoCorrS2(img) {
  var solarZenith = ee.Number(img.get('MEAN_SOLAR_ZENITH_ANGLE'));
  var solarAzimuth = ee.Number(img.get('MEAN_SOLAR_AZIMUTH_ANGLE'));
  var SZ_rad = ee.Image.constant(solarZenith)
    .multiply(Math.PI)
    .divide(180);
  var SA_rad = ee.Image.constant(solarAzimuth)
    .multiply(Math.PI)
    .divide(180);
  var cosZ = SZ_rad.cos();
  var sinZ = SZ_rad.sin();
  var cosAziDiff = SA_rad.subtract(asp_rad).cos();
  var ic = cosZ.multiply(cosS)
    .add(sinZ.multiply(sinS).multiply(cosAziDiff))
    .rename('IC');
  var regGeom = img.geometry().intersection(img.geometry(), 1);
  var mask = slope.gte(5)
    .and(ic.gte(0))
    .and(img.select('B8').gt(0));
  var corrected = ee.ImageCollection.fromImages(
    spectralBands.map(function(bandName) {
      bandName = ee.String(bandName);
      var band = img.select(bandName);
      var fit = ic.addBands(band)
        .updateMask(mask)
        .reduceRegion({
          reducer: ee.Reducer.linearFit(),
          geometry: regGeom,
          scale: 500,
          maxPixels: 1e8,
          bestEffort: true,
          tileScale: 4
        });
      var scaleFit = ee.Number(fit.get('scale'));
      var offsetFit = ee.Number(fit.get('offset'));
      var c = ee.Number(
        ee.Algorithms.If(
          scaleFit,
          ee.Algorithms.If(
            scaleFit.neq(0),
            offsetFit.divide(scaleFit),
            0
          ),
          0
        )
      );
      var correctedBand = band.expression(
        '((img * (cosS * cosZ + c)) / (IC + c))', {
          img: band,
          cosS: cosS,
          cosZ: cosZ,
          IC: ic,
          c: c
        }
      ).rename(bandName);
      return correctedBand;
    })
  ).toBands().rename(spectralBands);
  return corrected
    .copyProperties(img, img.propertyNames())
    .set('system:time_start', img.get('system:time_start'));
}
print(s2_janApr)
s2_janApr = s2_janApr.map(topoCorrS2)
s2_octDec = s2_octDec.map(topoCorrS2)
Map.addLayer(s2_octDec.filterBounds(geometry).first(),{min:0,max:3000,bands:"B4,B3,B2"},"after topographic correction");
var janAprComposite = s2_janApr.median().select(spectralBands);
var octDecComposite = s2_octDec.median().select(spectralBands);
janAprComposite = janAprComposite.toInt16();
octDecComposite = octDecComposite.toInt16();
var janAprNames = spectralBands.map(function(b) { return b + '_jan_apr'; });
var octDecNames = spectralBands.map(function(b) { return b + '_oct_dec'; });
janAprComposite = janAprComposite.rename(janAprNames);
octDecComposite = octDecComposite.rename(octDecNames);
Map.addLayer(
  janAprComposite,
  {bands: ['B4_jan_apr', 'B3_jan_apr', 'B2_jan_apr'], min: 0, max: 3000},
  'Jan-Apr composite'
);
Map.addLayer(
  octDecComposite,
  {bands: ['B4_oct_dec', 'B3_oct_dec', 'B2_oct_dec'], min: 0, max: 3000},
  'Oct-Dec composite'
);
var exportImage = janAprComposite.addBands(octDecComposite);
Export.image.toAsset({
  image: exportImage,
  description: 'bhutan_s2_' + targetYear + '_janapr_octdec_int16',
  assetId: 'projects/bhutan-hfld-readiness-training/assets/sentinel2Composites/bhutan_s2_' + targetYear + '_janapr_octdec_int16',
  region: Bhutan.geometry(),
  scale: 10,
  maxPixels: 1e13
});
