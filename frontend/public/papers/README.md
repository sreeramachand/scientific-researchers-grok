# Project paper PDFs

Upload the typeset PDF for each paywalled project paper here. The site serves files from this folder and keeps them behind the Snipcart / subscription lock on the paper page.

| Paper | File name |
| --- | --- |
| Nilearn image paper | `nilearn-image-paper.pdf` |
| GBM signatures | `gbm-signatures.pdf` |
| Uveal melanoma | `uveal-melanoma.pdf` |
| Diabetic retinopathy | `diabetic-retinopathy.pdf` |
| Lung paper | `lung-paper.pdf` |
| Colon cancer paper | `colon-cancer-paper.pdf` |

Replace the placeholder PDFs with the production files. Do not commit confidential manuscripts or files that contain patient identifiers.

The frontend preview path is `/papers/<file-name>.pdf`. Django stores the same file name on each `Paper.pdf_filename` row.
