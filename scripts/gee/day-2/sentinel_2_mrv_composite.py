"""Bhutan MRV Sentinel-2 composite (Python / geemap version of sentinel-2-mrv-composite.js).

Two seasonal median composites (Jan-Apr and Oct-Dec) of six bands, after Cloud Score+ masking,
TDOM shadow cleaning and terrain correction, exported as one 12-band Int16 image.

Bhutan ART-TREES HFLD Readiness Training, May 2026. Adapted from "D2-Bhutan_MRV_S2_Composite_Manual"
by Ate Poortinga & Samuel, Conservation International. Code licence: MIT.
"""
import math

import ee

ee.Initialize(project="<your-project>")  # your Earth Engine Cloud project ID

# Step 1: study area, reporting year and seasonal windows.
bhutan = ee.FeatureCollection("projects/bhutan-hfld-readiness-training/assets/Bhutan")
target_year = 2025
cloud_cover_max = 30
clear_threshold = 0.60
seasons = {
    "jan_apr": (ee.Date.fromYMD(target_year, 1, 1), ee.Date.fromYMD(target_year, 4, 30).advance(1, "day")),
    "oct_dec": (ee.Date.fromYMD(target_year, 10, 1), ee.Date.fromYMD(target_year, 12, 31).advance(1, "day")),
}
spectral_bands = ["B2", "B3", "B4", "B8", "B11", "B12"]


# Step 2: base collections.
def get_s2_collection(start, end):
    return (
        ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
        .filterDate(start, end)
        .filterBounds(bhutan)
        .filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", cloud_cover_max))
    )


# Step 4: Cloud Score+.
cs_plus = ee.ImageCollection("GOOGLE/CLOUD_SCORE_PLUS/V1/S2_HARMONIZED")


def apply_cloud_score(collection):
    return collection.linkCollection(cs_plus, ["cs_cdf"]).map(
        lambda img: img.updateMask(img.select("cs_cdf").gte(clear_threshold))
    )


# Step 5: TDOM shadow cleaning.
def apply_tdom(collection, ref_start, ref_end, z_thresh=-1.8, shadow_sum_thresh=0.20, contract=1.5, dilate=2.5):
    in_bands, out_bands = ["B8", "B11"], ["nir", "swir1"]
    ref = (
        ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
        .filterBounds(bhutan)
        .filterDate(ref_start, ref_end)
        .filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", 30))
        .select(in_bands, out_bands)
        .map(lambda img: img.divide(10000).copyProperties(img, img.propertyNames()))
    )
    ir_std, ir_mean = ref.reduce(ee.Reducer.stdDev()), ref.mean()

    def mask_dark_outliers(img):
        scaled = img.select(in_bands, out_bands).divide(10000)
        z = scaled.subtract(ir_mean).divide(ir_std)
        ir_sum = scaled.reduce(ee.Reducer.sum())
        tdom = z.lt(z_thresh).reduce(ee.Reducer.sum()).eq(2).And(ir_sum.lt(shadow_sum_thresh))
        tdom = tdom.focal_min(contract).focal_max(dilate)
        return img.updateMask(tdom.Not())

    return collection.map(mask_dark_outliers)


# Step 6: terrain (illumination) correction.
terrain = ee.Algorithms.Terrain(ee.Image("USGS/SRTMGL1_003"))
slope = terrain.select("slope")
slp_rad = slope.multiply(math.pi / 180)
asp_rad = terrain.select("aspect").multiply(math.pi / 180)
cos_s, sin_s = slp_rad.cos(), slp_rad.sin()


def topo_corr_s2(img):
    sz = ee.Image.constant(ee.Number(img.get("MEAN_SOLAR_ZENITH_ANGLE"))).multiply(math.pi / 180)
    sa = ee.Image.constant(ee.Number(img.get("MEAN_SOLAR_AZIMUTH_ANGLE"))).multiply(math.pi / 180)
    cos_z, sin_z = sz.cos(), sz.sin()
    ic = cos_z.multiply(cos_s).add(sin_z.multiply(sin_s).multiply(sa.subtract(asp_rad).cos())).rename("IC")
    mask = slope.gte(5).And(ic.gte(0)).And(img.select("B8").gt(0))

    def correct(band_name):
        band = img.select([band_name])
        fit = ic.addBands(band).updateMask(mask).reduceRegion(
            reducer=ee.Reducer.linearFit(), geometry=img.geometry(), scale=500, maxPixels=1e8, bestEffort=True, tileScale=4
        )
        scale_fit, offset_fit = ee.Number(fit.get("scale")), ee.Number(fit.get("offset"))
        c = ee.Number(ee.Algorithms.If(scale_fit, ee.Algorithms.If(scale_fit.neq(0), offset_fit.divide(scale_fit), 0), 0))
        return band.expression(
            "((img * (cosS * cosZ + c)) / (IC + c))", {"img": band, "cosS": cos_s, "cosZ": cos_z, "IC": ic, "c": c}
        ).rename(band_name)

    corrected = ee.ImageCollection.fromImages([correct(b) for b in spectral_bands]).toBands().rename(spectral_bands)
    return corrected.copyProperties(img, img.propertyNames()).set("system:time_start", img.get("system:time_start"))


# Steps 7-12: seasonal medians, Int16, season names, one image, export.
composites = []
for season, (start, end) in seasons.items():
    month0 = 1 if season == "jan_apr" else 10
    coll = apply_cloud_score(get_s2_collection(start, end))
    coll = apply_tdom(coll, ee.Date.fromYMD(target_year - 3, month0, 1), end)
    coll = coll.map(topo_corr_s2)
    composite = coll.median().select(spectral_bands).toInt16()
    composites.append(composite.rename([f"{b}_{season}" for b in spectral_bands]))
export_image = composites[0].addBands(composites[1])
print("Bands:", export_image.bandNames().getInfo())

task = ee.batch.Export.image.toAsset(
    image=export_image,
    description=f"bhutan_s2_{target_year}_janapr_octdec_int16",
    assetId=f"projects/<your-project>/assets/bhutan_s2_{target_year}_janapr_octdec_int16",
    region=bhutan.geometry(),
    scale=10,
    maxPixels=1e13,
)
# task.start()  # uncomment to run the export; follow it in the Code Editor's Tasks tab or with task.status()
