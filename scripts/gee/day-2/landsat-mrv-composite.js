/**
 * Bhutan MRV Landsat optical composite
 *
 * Bhutan ART-TREES HFLD Readiness Training, May 2026.
 * Source: D2-Bhutan_MRV_Landsat_Optical_Composite.docx
 * Original authors: Ate Poortinga & Samuel (Conservation International).
 * Adapted with the trainers' permission for https://wangdiues.github.io/bhutan-hfld-training/
 * Code licence: MIT. Changes from the source are listed in CHANGELOG.md.
 *
 * Original Code Editor script(s):
 *   https://code.earthengine.google.com/d294311d88eee5ab7cb82a26bbf33640
 */

// ---- 3. Step 1 - Define study area and reporting year ----
var countries = ee.FeatureCollection('projects/bhutan-hfld-readiness-training/assets/Bhutan')
var Bhutan = countries;
var studyArea = Bhutan;
var targetYear = 2025;
var cloudCover = 30
var janAprStart = ee.Date.fromYMD(targetYear, 1, 1);
var janAprEnd   = ee.Date.fromYMD(targetYear, 4, 30).advance(1, 'day');
var octDecStart = ee.Date.fromYMD(targetYear, 10, 1);
var octDecEnd   = ee.Date.fromYMD(targetYear, 12, 31).advance(1, 'day');

// ---- Function ----
function getLandsatCollection(startDate, endDate) {
  var l8 = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2')
    .filterDate(startDate, endDate)
    .filter(ee.Filter.lt("CLOUD_COVER",cloudCover))
    .filterBounds(studyArea);
  var l9 = ee.ImageCollection('LANDSAT/LC09/C02/T1_L2')
    .filterDate(startDate, endDate)
    .filter(ee.Filter.lt("CLOUD_COVER",cloudCover))
    .filterBounds(studyArea);
  return l8.merge(l9);
}

// ---- Function ----
function scaleLandsat(img) {
  var optical = img.select(['SR_B2','SR_B3','SR_B4','SR_B5','SR_B6','SR_B7'])
    .multiply(0.0000275)
    .add(-0.2);
  return img.select("QA_PIXEL").addBands(optical.rename(['B2','B3','B4','B5','B6','B7']));
}
var ls_janApr = getLandsatCollection(janAprStart, janAprEnd).map(scaleLandsat);
var ls_octDec = getLandsatCollection(octDecStart, octDecEnd).map(scaleLandsat);
print(ls_janApr)
Map.addLayer(ls_janApr.filterBounds(geometry).first(),{min:0,max:0.3000,bands:["B4","B3","B2"]},"landsat")
function maskLandsat(img) {
  var qa = img.select('QA_PIXEL');
  var mask = qa.bitwiseAnd(1 << 3).eq(0)
    .and(qa.bitwiseAnd(1 << 4).eq(0))
    .and(qa.bitwiseAnd(1 << 5).eq(0));
  return img.updateMask(mask);
}
var ls_janApr = ls_janApr.map(maskLandsat)
var ls_octDec = ls_octDec.map(maskLandsat)
Map.addLayer(ls_janApr.filterBounds(geometry).first(),{min:0,max:0.3000,bands:["B4","B3","B2"]},"cloud free")
var shadowMask = function(collection,studyArea,zScoreThresh,shadowSumThresh,contractPixels,dilatePixels) {
  var shadowSumBands = ["B5","B6"];
  var allCollection = getLandsatCollection(
                   ee.Date.fromYMD(targetYear - 2, 1, 1),
                   ee.Date.fromYMD(targetYear + 1, 12, 31))
  allCollection = allCollection.map(scaleLandsat)
  // Get some pixel-wise stats for the time series
  var irStdDev = allCollection.select(shadowSumBands).reduce(ee.Reducer.stdDev());
  var irMean = allCollection.select(shadowSumBands).mean();
  var maskDarkOutliers = function(img){
      var zScore = img.select(shadowSumBands).subtract(irMean).divide(irStdDev);
      var irSum = img.select(shadowSumBands).reduce(ee.Reducer.sum());
      var TDOMMask = zScore.lt(zScoreThresh).reduce(ee.Reducer.sum()).eq(2).and(irSum.lt(shadowSumThresh));
      TDOMMask = TDOMMask.focal_min(contractPixels).focal_max(dilatePixels).rename('TDOMMask');
      return img.updateMask(TDOMMask.not()).addBands(TDOMMask);
  };
  // Mask out dark dark outliers
  collection = collection.map(maskDarkOutliers);
  return collection;
};

// ---- Function ----
// contractPixels: The radius of the number of pixels to contract (negative
// buffer) clouds and cloud shadows by. Intended to eliminate smaller cloud
// patches that are likely errors
// (1.5 results in a -1 pixel buffer)(0.5 results in a -0 pixel buffer)
// (1.5 or 2.5 generally is sufficient)
var contractPixels = 2.0;
// dilatePixels: The radius of the number of pixels to dilate (buffer) clouds
// and cloud shadows by. Intended to include edges of clouds/cloud shadows
// that are often missed
// (1.5 results in a 1 pixel buffer)(0.5 results in a 0 pixel buffer)
// (2.5 or 3.5 generally is sufficient)
var dilatePixels = 2.5;
// zScoreThresh: Threshold for cloud shadow masking- lower number masks out
//    less. Between -0.8 and -1.2 generally works well
var zScoreThresh = -1.2;
// shadowSumThresh: Sum of IR bands to include as shadows within TDOM and the
//    shadow shift method (lower number masks out less)
var shadowSumThresh = 0.15;
var ls_janApr = shadowMask(ls_janApr,Bhutan,zScoreThresh,shadowSumThresh,contractPixels,dilatePixels)
var ls_octDec = shadowMask(ls_octDec,Bhutan,zScoreThresh,shadowSumThresh,contractPixels,dilatePixels)
Map.addLayer(ls_janApr.filterBounds(geometry).first(),{min:0,max:0.3000,bands:["B4","B3","B2"]},"cloud shadow free")

// ---- 8. Step 5 -Topographic Terrain Correction ----
// Scale for topographic correction
var scale = 300;
// get terrain layers
var dem = ee.Image("USGS/SRTMGL1_003")
var degree2radian = 0.01745;
print(ls_janApr)
var terrainCorrection = function(collection) {
  collection = collection.map(illuminationCondition);
  collection = collection.map(illuminationCorrection);
  return(collection);
  ////////////////////////////////////////////////////////////////////////////////
  // Function to calculate illumination condition (IC). Function by Patrick Burns
  // (pb463@nau.edu) and Matt Macander
  // (mmacander@abrinc.com)
  function illuminationCondition(img){
  // Extract image metadata about solar position
  var SZ_rad = ee.Image.constant(
      ee.Number(90).subtract(ee.Number(img.get('SUN_ELEVATION')))
    )
    .multiply(Math.PI)
    .divide(180)
    .clip(img.geometry().buffer(10000));
  var SA_rad = ee.Image.constant(
      ee.Number(img.get('SUN_AZIMUTH'))
    )
    .multiply(Math.PI)
    .divide(180)
    .clip(img.geometry().buffer(10000));
  var slp = ee.Terrain.slope(dem).clip(img.geometry().buffer(10000));
  var slp_rad = ee.Terrain.slope(dem).multiply(3.14159265359).divide(180).clip(img.geometry().buffer(10000));
  var asp_rad = ee.Terrain.aspect(dem).multiply(3.14159265359).divide(180).clip(img.geometry().buffer(10000));
  // Calculate the Illumination Condition (IC)
  // slope part of the illumination condition
  var cosZ = SZ_rad.cos();
  var cosS = slp_rad.cos();
  var slope_illumination = cosS.expression("cosZ * cosS",
                                          {'cosZ': cosZ,
                                           'cosS': cosS.select('slope')});
  // aspect part of the illumination condition
  var sinZ = SZ_rad.sin();
  var sinS = slp_rad.sin();
  var cosAziDiff = (SA_rad.subtract(asp_rad)).cos();
  var aspect_illumination = sinZ.expression("sinZ * sinS * cosAziDiff",
                                           {'sinZ': sinZ,
                                            'sinS': sinS,
                                            'cosAziDiff': cosAziDiff});
  // full illumination condition (IC)
  var ic = slope_illumination.add(aspect_illumination);
  // Add IC to original image
  var img_plus_ic = ee.Image(img.addBands(ic.rename('IC')).addBands(cosZ.rename('cosZ')).addBands(cosS.rename('cosS')).addBands(slp.rename('slope')));
  return img_plus_ic;
  }
  ////////////////////////////////////////////////////////////////////////////////
  // Function to apply the Sun-Canopy-Sensor + C (SCSc) correction method to each
  // image. Function by Patrick Burns (pb463@nau.edu) and Matt Macander
  // (mmacander@abrinc.com)
  function illuminationCorrection(img){
    var props = img.toDictionary();
    var st = img.get('system:time_start');
    var img_plus_ic = img;
    var mask1 = img_plus_ic.select('B5').gt(-0.1);
    var mask2 = img_plus_ic.select('slope').gte(5)
                            .and(img_plus_ic.select('IC').gte(0))
                            .and(img_plus_ic.select('B5').gt(-0.1));
    var img_plus_ic_mask2 = ee.Image(img_plus_ic.updateMask(mask2));
    // Specify Bands to topographically correct
    var bandList = ['B2','B3','B4','B5','B6','B7'];
    var compositeBands = img.bandNames();
    var nonCorrectBands = img.select(compositeBands.removeAll(bandList));
    var geom = ee.Geometry(img.get('system:footprint')).bounds().buffer(10000);
    function apply_SCSccorr(band){
      var method = 'SCSc';
      var out =  ee.Image(1).addBands(img_plus_ic_mask2.select('IC', band))
                            .reduceRegion({reducer: ee.Reducer.linearRegression(2,1),
                                           geometry: ee.Geometry(img.geometry()),
                                           scale: scale,
                                           bestEffort :true,
                                           maxPixels:1e10});
        var fit = out.combine({"coefficients": ee.Array([[1],[1]])}, false);
                //Get the coefficients as a nested list,
                // ast it to an array, and get just the selected column
                var out_a = (ee.Array(fit.get('coefficients')).get([0,0]));
                var out_b = (ee.Array(fit.get('coefficients')).get([1,0]));
                var out_c = out_a.divide(out_b);
        // Apply the SCSc correction
        var SCSc_output = img_plus_ic_mask2.expression(
        "((image * (cosB * cosZ + cvalue)) / (ic + cvalue))", {
        'image': img_plus_ic_mask2.select(band),
        'ic': img_plus_ic_mask2.select('IC'),
        'cosB': img_plus_ic_mask2.select('cosS'),
        'cosZ': img_plus_ic_mask2.select('cosZ'),
        'cvalue': out_c
        });
      return SCSc_output;
    }
    var img_SCSccorr = ee.Image(bandList.map(apply_SCSccorr)).addBands(img_plus_ic.select('IC'));
    var bandList_IC = ee.List([bandList, 'IC']).flatten();
    img_SCSccorr = img_SCSccorr.unmask(img_plus_ic.select(bandList_IC)).select(bandList);
    img_SCSccorr = ee.Image(img_SCSccorr.addBands(nonCorrectBands).setMulti(props).set('system:time_start',st))
    return img_SCSccorr.select(['B2','B3','B4','B5','B6','B7'])
  }
}  //
ls_janApr = terrainCorrection(ls_janApr)
print(ls_janApr)
ls_octDec = terrainCorrection(ls_octDec)
Map.addLayer(ls_janApr.filterBounds(geometry).first(),{min:0,max:0.3000,bands:["B4","B3","B2"]},"terrain corrected")

// ---- 9. Step 6 - Median compositing ----
// Create seasonal median composites
var janAprComposite = ls_janApr.median();
var octDecComposite = ls_octDec.median();

// ---- Function ----
janAprComposite = janAprComposite.multiply(10000).toInt16();
octDecComposite = octDecComposite.multiply(10000).toInt16();

// ---- Function ----
var janAprNames = ['B2_jan_apr','B3_jan_apr','B4_jan_apr','B5_jan_apr','B6_jan_apr','B7_jan_apr'];
var octDecNames = ['B2_oct_dec','B3_oct_dec','B4_oct_dec','B5_oct_dec','B6_oct_dec','B7_oct_dec'];
janAprComposite = janAprComposite.select(['B2','B3','B4','B5','B6','B7']).rename(janAprNames);
octDecComposite = octDecComposite.select(['B2','B3','B4','B5','B6','B7']).rename(octDecNames);
var visRGB_jan = {
  bands: ['B4_jan_apr','B3_jan_apr','B2_jan_apr'],
  min: 0,
  max: 3000
};
var visRGB_oct = {
  bands: ['B4_oct_dec','B3_oct_dec','B2_oct_dec'],
  min: 0,
  max: 3000
};
Map.addLayer(janAprComposite.clip(studyArea), visRGB_jan, 'Jan-Apr RGB 2025');
Map.addLayer(octDecComposite.clip(studyArea), visRGB_oct, 'Oct-Dec RGB 2025');

// ---- Function ----
var exportImage = janAprComposite.addBands(octDecComposite);
Export.image.toAsset({
  image: exportImage,
  description: 'bhutan_ls89_2024_janapr_octdec',
  assetId: 'projects/bhutan-hfld-readiness-training/assets/landsatComposite/bhutan_ls89_2025_yourname',
  region: Bhutan.geometry(),
  scale: 30,
  maxPixels: 1e13
});
