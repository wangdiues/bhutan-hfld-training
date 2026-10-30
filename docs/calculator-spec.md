# Calculator specification (Labs 1 and 2)

The formulas in the two Day 5 workbooks, with cell references, so the TypeScript engine (`src/lib/stats/`, task M5-01) reproduces them exactly. Fixtures holding each workbook's own inputs and cached outputs are in `tests/fixtures/`. **Tests must match them to a relative tolerance of 1e-6.** Never edit a fixture to make a test pass.

Task M2-05 · 2026-10-26.

Notation: strata (map classes) *i* = 1…k; *A* = total mapped area; *Aᵢ* = mapped area of stratum *i*; *Wᵢ = Aᵢ / A*; *nᵢⱼ* = sample count with map class *i* and reference class *j*; *nᵢ.* = row total; *n.ⱼ* = column total; *n* = total.

---

## Lab 1 — Sample size (`Exercise D5-Sample Size Calculator.xlsx`)

### Inputs
| Input | Cell(s) | Workbook value |
|---|---|---|
| Strata report (class code, name, area ha) | `strata report!A2:C9` | 8 rows (null 866.854; Cropland 103,503.83; Deforestation 12,136.25; Forest 2,675,342.29; Grassland 637,136.24; Wetland 37,036.39; Settlement 61,392.09; Other Land 348,884.70) |
| Forest sub-strata split (%) | `J4:J6` | 70 / 20 / 10 |
| Expected proportion of the target class (deforestation) in each stratum, *pᵢ* | `B4:F4` | 0.0005, 0.001, 0.003, 0, 0.8 |
| Target margin of error (% of the deforestation proportion, at 90%) | `M5` | 25 |
| z (90%, 95%) | `M2`, `M3` | 1.6449, 1.96 |
| Minimum samples per small stratum (scenarios) | `A13:A17` | 130, 140, 150, 160, 170 |
| Deforestation rate % | `J2` | 0.3 (*shown but not used by any formula*) |

### Strata built from the report
| Stratum | Formula | Cell |
|---|---|---|
| Forest 1, 2, 3 | Forest area × split% / 100 | `B2:D2` |
| Non Forest | null + Cropland + Grassland + Wetland + Settlement + Other Land (`C2:C3` + `C6:C9`) | `E2` |
| Deforestation | Deforestation area (`C4`) | `F2` |

### Formulas
| Quantity | Formula | Cell |
|---|---|---|
| Weight | *Wᵢ = Aᵢ / Σ(report areas)* | `B3:F3` |
| Standard deviation | *Sᵢ = √(pᵢ(1 − pᵢ))* | `B5:F5` |
| *ΣWᵢSᵢ* | sum of `B6:F6` | `G6` |
| Target SE of the deforestation proportion | *SE = (MoE/100) × W_defor / z* (90%: `M6`; 95%: `M7`) | `M6`, `M7` |
| **Total sample size** | ***n = (ΣWᵢSᵢ / SE)²*** (Cochran stratified; Olofsson et al. 2014, Eq. 13, ignoring the finite-population correction) | `G7` |
| Equal allocation | *round(n) / (number of strata with Aᵢ > 0)* (no rounding per stratum) | `B10:F10` |
| Proportional allocation | *round(n) × Wᵢ* (unrounded) | `B11:F11` |
| "Minimum of m" allocation | Deforestation = *m*; Non Forest = 0; each Forest *f* = *(round(n) − m − 0 − 3m) × A_f / ΣA_forest + m* | `B13:F17` |
| Sampling density (ha/sample) | *Aᵢ / nᵢ* (0 if *nᵢ* = 0) | `B20:F27` |

The workbook's results: *n* = 1,800.30 → round(n) = 1,800; equal = 360 each; proportional = 869.6 / 248.5 / 124.2 / 552.0 / 5.6; minimum-130 = 1,026 / 386 / 258 / 0 / 130.

**Notes for the lab (not errors in the workbook):**
- "Minimum of" gives Non Forest 0 samples by design (`E13:E17` are constant 0). The lab should explain this choice and let the user change it.
- The forest-stratum formula hard-codes 3 forest strata (`$A13*3`). The lab generalises it to however many forest strata the user creates.

---

## Lab 2 — Accuracy and area (`Exercise D5-Confusion Matrix, Accuracy Assessment, Area Adjustment.xlsx`)

Rows of the matrix are the **map class (stratum)**; columns are the **reference class**.

### Inputs
| Input | Cells | Workbook value |
|---|---|---|
| Classes | `B1:D1` | Forest, Non-Forest, Deforestation |
| Mapped area (ha) | `B2:D2` | 2,675,342.29; **2,687,478.54**; 12,136.25 |
| Confusion matrix (counts) | `B7:D9` | [1595, 50, 5], **[0, 0, 0]**, [20, 10, 120] |
| z | hard-coded in `B39:D39` | 1.6449 (90%) |

### Formulas
| Quantity | Formula | Cell |
|---|---|---|
| User's accuracy | *nᵢᵢ / nᵢ.* | `H6:H8` |
| Producer's accuracy (sample counts, **not** area-weighted) | *nⱼⱼ / n.ⱼ* | `J6:J8` |
| Overall accuracy (sample counts) | *Σnᵢᵢ / n* | `H10` |
| Kappa | *(OA − Pₑ)/(1 − Pₑ)*, *Pₑ = Σ (nᵢ./n)(n.ᵢ/n)* | `H11`, `L9` |
| Stratum weight | *Wᵢ = Aᵢ / ΣA* | `C14:C16` |
| Estimated cell proportion | *p̂ᵢⱼ = Wᵢ nᵢⱼ / nᵢ.* (0 if *nᵢ.* = 0) | `B21:D23` |
| Reference-class proportion | *p̂.ⱼ = Σᵢ p̂ᵢⱼ* | `B24:D24` |
| **Adjusted area** | ***Âⱼ = p̂.ⱼ × A*** | `B29:D29` |
| Variance term | *Wᵢ² (nᵢⱼ/nᵢ.)(1 − nᵢⱼ/nᵢ.) / (nᵢ. − 1)*, set to 0 **if nᵢⱼ < 2** | `B33:D35` |
| SE of the proportion | *√(Σᵢ term)* (Olofsson et al. 2014, Eq. 10) | `B37:D37` |
| SE of the area | *SE(p̂.ⱼ) × A* | `B38:D38` |
| **Uncertainty (%)** | ***1.6449 × SE(Âⱼ) / Âⱼ × 100*** (half-width of the 90% CI as a % of the estimate) | `B39:D39` |

The workbook's results: UA = 0.967 / #DIV/0! / 0.800; PA = 0.988 / 0.000 / 0.960; OA = 0.953; κ = 0.725; adjusted areas = 2,587,782 / 81,880 / 17,816 ha; uncertainty = 0.75% / 22.69% / 33.63%.

### Issues found in this workbook (for the lab and CHANGELOG)
1. **The Non-Forest row has no samples** (`B8:D8` = 0), so its user's accuracy is #DIV/0!. Every reference-class proportion then misses Non-Forest's 50% of the weight, and the **adjusted areas sum to 2,687,478 ha instead of 5,374,957 ha**. The lab must warn when any stratum has *nᵢ.* = 0 and refuse to report totals.
2. **Mapped areas don't match the sample-size workbook.** Non-Forest is 2,687,478.54 ha here (close to the Forest area) but 1,188,820.10 ha in the strata report, so the total is 5.37 M ha here versus 3.88 M ha (Bhutan's mapped total) there. The lab opens with the workbook's own areas so that its results can be checked against the workbook, and it warns about the empty Non-Forest stratum.
3. **The variance rule differs from Olofsson.** `IF(nᵢⱼ < 2, 0, …)` drops any cell with exactly one sample. Olofsson et al. (2014) include it; only strata with *nᵢ.* < 2 must be excluded, to avoid dividing by zero. This doesn't change this example (no cell equals 1). The engine implements Olofsson, and a separate test documents the difference.
4. **Producer's and overall accuracy are computed from raw sample counts.** Under stratified sampling these are biased; the unbiased versions are area-weighted (Olofsson et al. 2014, Eqs. 1–3). The lab shows both, labelled "sample-based (as in the workbook)" and "area-weighted (recommended)".

### Fixtures
- `tests/fixtures/sample-size.workbook.json`: inputs and all outputs above.
- `tests/fixtures/accuracy-area.workbook.json`: inputs and all outputs (`null` = #DIV/0!).

### Reference
Olofsson, P., Foody, G. M., Herold, M., Stehman, S. V., Woodcock, C. E., & Wulder, M. A. (2014). Good practices for estimating area and assessing accuracy of land change. *Remote Sensing of Environment*, 148, 42–57. https://doi.org/10.1016/j.rse.2014.02.015
