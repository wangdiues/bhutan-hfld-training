"""Introduction to Google Earth Engine: the five things Earth Engine does (geemap version).

LULC Mapping Training: https://wangdiues.github.io/lulc-mapping-training/
Acknowledgements and sources: https://wangdiues.github.io/lulc-mapping-training/about/credits/
Code licence: MIT.
"""
import ee
import geemap

ee.Initialize(project="<your-project>")  # your Earth Engine Cloud project ID

thimphu = ee.Geometry.Point([89.64, 27.47])

# 1. Filter a collection.
s2 = (
    ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
    .filterBounds(thimphu)
    .filterDate("2025-01-01", "2025-05-01")
    .filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", 20))
)
print("Images in the collection:", s2.size().getInfo())

# 2. Get an image.
image = s2.sort("CLOUDY_PIXEL_PERCENTAGE").first()


# 3. Apply an algorithm to an image.
def add_ndvi(img):
    return img.addBands(img.normalizedDifference(["B8", "B4"]).rename("NDVI"))


# 4. Map it over the collection; 5. reduce the collection, then a region.
median_ndvi = s2.map(add_ndvi).select("NDVI").median()
mean_ndvi = median_ndvi.reduceRegion(reducer=ee.Reducer.mean(), geometry=thimphu.buffer(5000), scale=10)
print("Mean NDVI within 5 km of Thimphu:", mean_ndvi.get("NDVI").getInfo())

m = geemap.Map()
m.centerObject(thimphu, 10)
m.addLayer(image, {"bands": ["B4", "B3", "B2"], "min": 0, "max": 3000}, "Least cloudy image")
m.addLayer(median_ndvi, {"min": 0, "max": 0.8, "palette": ["white", "green"]}, "Median NDVI, Jan-Apr 2025")
m  # noqa: B018  (displays the map in a notebook)
