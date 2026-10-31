"""Hello Bhutan: a first Earth Engine script, Python (geemap) version.

LULC Mapping Training: https://wangdiues.github.io/lulc-mapping-training/
Code licence: MIT.
"""
import ee
import geemap

ee.Initialize(project="<your-project>")  # your Earth Engine Cloud project ID

print("Hello Bhutan")

thimphu = ee.Geometry.Point([89.64, 27.47])
s2 = (
    ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
    .filterBounds(thimphu)
    .filterDate("2025-01-01", "2025-05-01")
    .filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", 20))
)
print("Number of images:", s2.size().getInfo())

m = geemap.Map()
m.centerObject(thimphu, 11)
m.addLayer(s2.median(), {"bands": ["B4", "B3", "B2"], "min": 0, "max": 3000}, "Sentinel-2, Jan-Apr 2025")
m  # noqa: B018  (displays the map in a notebook)
