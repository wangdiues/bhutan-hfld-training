"""Bhutan MRV Landsat 8/9 composite (Python / geemap version of landsat-mrv-composite.js).

Two seasonal median composites (Jan-Apr and Oct-Dec) of six bands, after QA and TDOM masking and
SCS+C terrain correction, exported as one 12-band Int16 image.

Bhutan ART-TREES HFLD Readiness Training, May 2026. Adapted from "D2-Bhutan_MRV_Landsat_Optical_Composite"
by Ate Poortinga & Samuel, Conservation International. Terrain correction functions by Patrick Burns
and Matt Macander. Code licence: MIT.
"""
import math

import ee

ee.Initialize(project="<your-project>")  # your Earth Engine Cloud project ID

bhutan = ee.FeatureCollection("projects/bhutan-hfld-readiness-training/assets/Bhutan")
target_year = 2025
cloud_cover = 30
seasons = {
    "jan_apr": (ee.Date.fromYMD(target_year, 1, 1), ee.Date.fromYMD(target_year, 4, 30).advance(1, "day")),
    "oct_dec": (ee.Date.fromYMD(target_year, 10, 1), ee.Date.fromYMD(target_year, 12, 31).advance(1, "day")),
}
bands = ["B2", "B3", "B4", "B5", "B6", "B7"]


def get_landsat_collection(start, end):
    def one(cid):
        return (
            ee.ImageCollection(cid)
            .filterDate(start, end)
            .filter(ee.Filter.lt("CLOUD_COVER", cloud_cover))
            .filterBounds(bhutan)
        )

    return one("LANDSAT/LC08/C02/T1_L2").merge(one("LANDSAT/LC09/C02/T1_L2"))


def scale_landsat(img):
    optical = img.select(["SR_B2", "SR_B3", "SR_B4", "SR_B5", "SR_B6", "SR_B7"]).multiply(0.0000275).add(-0.2)
    return img.select("QA_PIXEL").addBands(optical.rename(bands))


def mask_landsat(img):
    qa = img.select("QA_PIXEL")
    mask = qa.bitwiseAnd(1 << 3).eq(0).And(qa.bitwiseAnd(1 << 4).eq(0)).And(qa.bitwiseAnd(1 << 5).eq(0))
    return img.updateMask(mask)


def shadow_mask(collection, z_thresh=-1.2, shadow_sum_thresh=0.15, contract=2.0, dilate=2.5):
    sum_bands = ["B5", "B6"]
    ref = get_landsat_collection(
        ee.Date.fromYMD(target_year - 2, 1, 1), ee.Date.fromYMD(target_year + 1, 12, 31)
    ).map(scale_landsat)
    ir_std = ref.select(sum_bands).reduce(ee.Reducer.stdDev())
    ir_mean = ref.select(sum_bands).mean()

    def mask_dark_outliers(img):
        z = img.select(sum_bands).subtract(ir_mean).divide(ir_std)
        ir_sum = img.select(sum_bands).reduce(ee.Reducer.sum())
        tdom = z.lt(z_thresh).reduce(ee.Reducer.sum()).eq(2).And(ir_sum.lt(shadow_sum_thresh))
        tdom = tdom.focal_min(contract).focal_max(dilate).rename("TDOMMask")
        return img.updateMask(tdom.Not()).addBands(tdom)

    return collection.map(mask_dark_outliers)


dem = ee.Image("USGS/SRTMGL1_003")


def illumination_condition(img):
    region = img.geometry().buffer(10000)
    sz = ee.Image.constant(ee.Number(90).subtract(ee.Number(img.get("SUN_ELEVATION")))).multiply(math.pi / 180)
    sa = ee.Image.constant(ee.Number(img.get("SUN_AZIMUTH"))).multiply(math.pi / 180)
    slp = ee.Terrain.slope(dem).clip(region)
    slp_rad = slp.multiply(math.pi / 180)
    asp_rad = ee.Terrain.aspect(dem).multiply(math.pi / 180).clip(region)
    cos_z, cos_s = sz.cos().clip(region), slp_rad.cos()
    ic = cos_z.multiply(cos_s).add(sz.sin().multiply(slp_rad.sin()).multiply(sa.subtract(asp_rad).cos()))
    return img.addBands(ic.rename("IC")).addBands(cos_z.rename("cosZ")).addBands(cos_s.rename("cosS")).addBands(
        slp.rename("slope")
    )


def illumination_correction(img):
    props, st = img.toDictionary(), img.get("system:time_start")
    mask2 = img.select("slope").gte(5).And(img.select("IC").gte(0)).And(img.select("B5").gt(-0.1))
    masked = img.updateMask(mask2)

    def scsc(band):
        out = (
            ee.Image(1)
            .addBands(masked.select(["IC", band]))
            .reduceRegion(
                reducer=ee.Reducer.linearRegression(2, 1), geometry=img.geometry(), scale=300, bestEffort=True, maxPixels=1e10
            )
        )
        fit = out.combine({"coefficients": ee.Array([[1], [1]])}, False)
        coef = ee.Array(fit.get("coefficients"))
        c = coef.get([0, 0]).divide(coef.get([1, 0]))
        return masked.expression(
            "((image * (cosB * cosZ + cvalue)) / (ic + cvalue))",
            {"image": masked.select(band), "ic": masked.select("IC"), "cosB": masked.select("cosS"),
             "cosZ": masked.select("cosZ"), "cvalue": c},
        )

    corrected = ee.Image([scsc(b) for b in bands]).rename(bands)
    corrected = corrected.unmask(img.select(bands)).select(bands)
    return corrected.setMulti(props).set("system:time_start", st)


composites = []
for season, (start, end) in seasons.items():
    coll = get_landsat_collection(start, end).map(scale_landsat).map(mask_landsat)
    coll = shadow_mask(coll).map(illumination_condition).map(illumination_correction)
    composite = coll.median().multiply(10000).toInt16().select(bands)
    composites.append(composite.rename([f"{b}_{season}" for b in bands]))
export_image = composites[0].addBands(composites[1])
print("Bands:", export_image.bandNames().getInfo())

task = ee.batch.Export.image.toAsset(
    image=export_image,
    description=f"bhutan_ls89_{target_year}_janapr_octdec",
    assetId=f"projects/<your-project>/assets/bhutan_ls89_{target_year}_janapr_octdec",
    region=bhutan.geometry(),
    scale=30,
    maxPixels=1e13,
)
# task.start()  # uncomment to run the export
