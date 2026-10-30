/**
 * Assemblage: decision-tree rules
 *
 * Bhutan ART-TREES HFLD Readiness Training, May 2026.
 * Source: EXERCISE D3_ Final- Assemblage-DECISION TREE RULE.docx
 * Original authors: Ate Poortinga & Samuel (Conservation International).
 * Adapted with the trainers' permission for https://wangdiues.github.io/bhutan-hfld-training/
 * Code licence: MIT. Changes from the source are listed in CHANGELOG.md:
 *   - init(), called but not defined in the exercise, is written here: a panel with one threshold
 *     slider per primitive, buttons to re-run the assemblage and the areas, and export tools.
 *   - Restored as in the exercise (commented out when the code was extracted): the primitive stack,
 *     the default thresholds and the panel borders.
 *   - computeArea() labelled class 1 "Cropland" and class 2 "Forest", but the decision tree numbers
 *     classes in the order of `primitives` (forest = 1, crop = 2...); the names now follow that order.
 *   - The year is 2025, matching the primitives (the exercise said 2024).
 *
 * The primitives (s2_<Class>_2025) and the Landsat image used for the area of interest are the
 * trainers' assets; with no access, use your own primitives from the Forest primitives lesson.
 *
 * Original Code Editor script(s):
 *   https://code.earthengine.google.com/f3ac214d04f1543897bba62c26a9a878
 */

// ---- Part 1: Import AOI ----
// ============================================================
// 1. LOAD BASE IMAGE (AOI)
// ============================================================
var ls_image = ee.Image("projects/servir-mekong/temp/bhutan_ls89_2024_janapr_octdec");
var aoi = ls_image.geometry();
Map.centerObject(aoi, 6);

// ---- Part 2: Define the year of analysis ----
// Define the year of analysis (used for labeling outputs and organizing results)
var year = 2025;

// ---- Part 3: Load Primitive Layers ----
// ============================================================
// 2. LOAD PRIMITIVES
// ============================================================
var CropLand = ee.Image("projects/servir-mekong/bhutan_primitives/s2_CropLand_2025")
  .select('target_probability').rename('crop');
var Forest = ee.Image("projects/servir-mekong/bhutan_primitives/s2_Forest_2025")
  .select('target_probability').rename('forest');
var Grassland = ee.Image("projects/servir-mekong/bhutan_primitives/s2_Grassland_2025")
  .select('target_probability').rename('grass');
var Otherland = ee.Image("projects/servir-mekong/bhutan_primitives/s2_Otherland_2025")
  .select('target_probability').rename('other');
var Settlement = ee.Image("projects/servir-mekong/bhutan_primitives/s2_Settlement_2025")
  .select('target_probability').rename('bu');
var Wetland = ee.Image("projects/servir-mekong/bhutan_primitives/s2_Wetland_2025")
  .select('target_probability').rename('wet');
// Stack
var primiImg = ee.Image.cat([
  CropLand, Forest, Grassland, Otherland, Settlement, Wetland
]);

// ---- Part 4: Define Settings for Assemblage ----
// ============================================================
// SETTINGS
// ============================================================
// 📌 Primitive layer names (must match band names in primiImg)
var primitives = ['forest','crop','grass','other','bu','wet'];
// 📌 Default probability thresholds for each class
// These values determine how confident the model must be
// before assigning a class to a pixel
var defaultThresholds = [
  0.50, // forest
  0.55, // crop
  0.55, // grass
  0.60, // other
  0.30, // built-up
  0.25  // wetland
];
// 📌 Visualization settings for final land cover map
var lcVis = {
  min: 1,
  max: 6,
  palette: [
    '267300', // forest
    'AAFF00', // crop
    'D7C29E', // grass
    'FFFFBE', // other
    'E600A9', // built-up
    '004DA8'  // wetland
  ]
};
// 📌 Variables for interactive UI (sliders and outputs)
var sliders = {};          // store slider controls
var landClass;             // final classification result
var stackImageGlobal;      // stacked primitive image
var valLabels = {};        // store threshold labels
var assetInput;            // input asset reference
// ============================================================
// FUNCTIONS
// ============================================================
// ---------------------------------------------------------------------
// Load and display primitive layer
// ---------------------------------------------------------------------
// 📌 Purpose:
// Select a primitive band and display it on the map for inspection
function getPrimitiveImages(p){
  var img = primiImg.select(p);
  Map.layers().set(
    primitives.indexOf(p),
    ui.Map.Layer(
      img,
      {min:0, max:1, palette:['white','green']},
      p,
      false
    )
  );
  return img;
}
// ---------------------------------------------------------------------
// Build decision tree based on thresholds
// ---------------------------------------------------------------------
// 📌 Purpose:
// Create rule-based logic to combine primitives into final classes
function buildDecisionTree(){
  // Store threshold values from sliders
  var values = {};
  primitives.forEach(function(p){
    values[p] = sliders[p].getValue();
  });
  // Initialize decision tree
  var DT = ['1) root 9999 9999 9999'];
  var base = 1;
  // Loop through each primitive layer
  for (var i = 0; i < primitives.length; i++){
    var a = base * 2;       // true branch
    var b = base * 2 + 1;   // false branch
    // If condition met → assign class
    DT.push(
      a + ') ' + primitives[i] + '>=' + values[primitives[i]] +
      ' 9999 9999 ' + (i + 1) + ' *'
    );
    // If condition not met → move to next rule
    if(i === primitives.length - 1){
      DT.push(
        b + ') ' + primitives[i] + '<' + values[primitives[i]] +
        ' 9999 9999 0 *'
      );
    } else {
      DT.push(
        b + ') ' + primitives[i] + '<' + values[primitives[i]] +
        ' 9999 9999 9999'
      );
    }
    base = b;
  }
  return DT.join('\n');
}

// ---- Part 6: Apply Decision Tree Classification (Assemblage) ----
// ============================================================
// CLASSIFICATION
// ============================================================
function process(){
  // 📌 Clear existing map layers
  Map.layers().reset();
  // 📌 Clip primitive layers to AOI
  stackImageGlobal = primiImg.clip(aoi);
  // 📌 Display each primitive layer
  primitives.forEach(getPrimitiveImages);
  // 📌 Prepare stacked image for classification
  var stackImage = primiImg.select(primitives);
  // 📌 Apply decision tree classification
  landClass = stackImage.classify(
    ee.Classifier.decisionTree(buildDecisionTree())
  );
  // 📌 Display classification result
  Map.addLayer(
    landClass.clip(aoi),
    lcVis,
    'Decision Tree LC'
  );
  // 📌 Add legend
  addLegend();
}

// ---- Part 7: Add Legend to Map ----
// ============================================================
// LEGEND
// ============================================================
function addLegend(){
  // 📌 Create legend panel
  var legend = ui.Panel({
    style:{
      position:'bottom-right',
      padding:'15px',
      width:'230px',
      backgroundColor:'white',
      border:'3px solid #2C5AA0'
    }
  });
  // 📌 Add title
  legend.add(ui.Label({
    value:'Sentinel-2 Land Cover 2025',
    style:{fontWeight:'bold', color:'#2C5AA0'}
  }));
  // 📌 Class names and colors
  var names = ['Cropland','Forest','Grassland','Other land','Built-up','Wetland'];
  var colors = ['#AAFF00','#267300','#D7C29E','#FFFFBE','#E600A9','#004DA8'];
  // 📌 Create legend entries
  names.forEach(function(name, i){
    legend.add(ui.Panel([
      ui.Label({style:{backgroundColor:colors[i], padding:'10px'}}),
      ui.Label(name)
    ], ui.Panel.Layout.Flow('horizontal')));
  });
  // 📌 Add legend to map
  Map.add(legend);
}

// ---- Part 8: Inspect Pixel Values (Interactive Panel) ----
// ============================================================
// INSPECT PANEL
// ============================================================
function addInspectPanel(){
  // 📌 Create panel
  var panel = ui.Panel({
    style:{
      position:'bottom-center',
      padding:'12px',
      width:'220px',
      backgroundColor:'white',
      border:'3px solid #2C5AA0'
    }
  });
  // 📌 Panel title
  panel.add(ui.Label('Inspect Values',{color:'#2C5AA0'}));
  // 📌 Create labels for each primitive
  primitives.forEach(function(p){
    valLabels[p] = ui.Label('---');
    panel.add(ui.Panel([
      ui.Label(p + ':', {width:'60px'}),
      valLabels[p]
    ], ui.Panel.Layout.Flow('horizontal')));
  });
  // 📌 Add panel to map
  Map.add(panel);
  // ---------------------------------------------------------------------
  // Map click event
  // ---------------------------------------------------------------------
  Map.onClick(function(coords){
    var pt = ee.Geometry.Point(coords.lon, coords.lat);
    // 📌 Sample pixel values from stacked image
    stackImageGlobal.sample(pt, 30).first().evaluate(function(f){
      if(!f) return;
      // 📌 Update values for each primitive
      primitives.forEach(function(p){
        var v = f.properties[p];
        if (v !== null && v !== undefined){
          valLabels[p].setValue(Number(v).toFixed(2));
        } else {
          valLabels[p].setValue('N/A');
        }
      });
    });
  });
}

// ---- Part 9: Compute Area by Class (Hectares) ----
// ============================================================
// AREA (HECTARES)
// ============================================================
function computeArea(){
  // 📌 Convert pixel size to hectares
  var pixelArea = ee.Image.pixelArea().divide(10000);
  // 📌 Class names (must match class IDs 1–6)
  // Same order as `primitives`: the decision tree gives class i + 1 to primitives[i].
  var classNames = [
    'Forest','Cropland','Grassland',
    'Other_land','Built_up','Wetland'
  ];
  var areaBands = [];
  // ---------------------------------------------------------------------
  // Create area layer for each class
  // ---------------------------------------------------------------------
  for (var i = 1; i <= 6; i++) {
    areaBands.push(
      landClass.eq(i)             // select class
        .multiply(pixelArea)      // convert to area
        .rename(classNames[i - 1])
    );
  }
  // Combine all class areas into one image
  var areaImg = ee.Image.cat(areaBands);
  // ---------------------------------------------------------------------
  // Calculate total area per class
  // ---------------------------------------------------------------------
  var stats = areaImg.reduceRegion({
    reducer: ee.Reducer.sum(),
    geometry: aoi,
    scale: 10,
    maxPixels: 1e12,
    tileScale: 4
  });
  // ---------------------------------------------------------------------
  // Print results
  // ---------------------------------------------------------------------
  stats.evaluate(function(res){
    print('==== Bhutan Area (ha) ====');
    classNames.forEach(function(c){
      var v = res[c];
      print(c + ':', v ? Math.round(v) : 0);
    });
  });
}

// ---- Part 10: Export Results and Build Interactive UI ----
// ============================================================
// EXPORT FUNCTIONS
// ============================================================
// 📌 Export to GEE Asset
function exportToAsset(){
  var assetId = assetInput.getValue();
  if (!assetId){
    print('⚠️ Enter Asset ID');
    return;
  }
  Export.image.toAsset({
    image: landClass.toInt8(),
    description: 'LandCover_' + year,
    assetId: assetId,
    region: aoi,
    scale: 10,
    maxPixels: 1e13,
    // Important for categorical data
    pyramidingPolicy: {
      '.default': 'mode'
    }
  });
  print('Exporting to Asset:', assetId);
}
// 📌 Export to Google Drive
function exportToDrive(){
  Export.image.toDrive({
    image: landClass.toInt8(),
    description: 'LandCover_' + year,
    folder: 'GEE_Exports',
    region: aoi,
    scale: 10,
    maxPixels: 1e13
  });
  print('Exporting to Drive...');
}

// ---- Part 10b: User interface (init) ----
// ============================================================
// UI PANEL (written for the website: the exercise calls init() but does not define it)
// ============================================================
function init(){
  var panel = ui.Panel({style: {width: '300px', padding: '8px'}});
  panel.add(ui.Label('Assemblage thresholds', {fontWeight: 'bold', fontSize: '16px'}));
  panel.add(ui.Label('Rules are applied top to bottom: the first primitive at or above its threshold sets the class.'));
  primitives.forEach(function(p, i){
    sliders[p] = ui.Slider({min: 0, max: 1, value: defaultThresholds[i], step: 0.05, style: {stretch: 'horizontal'}});
    panel.add(ui.Label((i + 1) + '. ' + p));
    panel.add(sliders[p]);
  });
  panel.add(ui.Button('Run assemblage', function(){ process(); computeArea(); }));
  assetInput = ui.Textbox({placeholder: 'projects/<your-project>/assets/landcover_' + year});
  panel.add(ui.Label('Export', {fontWeight: 'bold'}));
  panel.add(assetInput);
  panel.add(ui.Button('Export to asset', exportToAsset));
  panel.add(ui.Button('Export to Drive', exportToDrive));
  ui.root.insert(0, panel);
  addInspectPanel();
}

// ---- Part 11: Run Application ----
// ============================================================
// RUN APPLICATION
// ============================================================
// 📌 Initialize UI panel (sliders, buttons, export tools)
init();
// 📌 Run classification using decision tree
process();
// 📌 Compute area statistics (hectares)
computeArea();
