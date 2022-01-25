## ShinySyn Usage

### Introduction

`ShinySyn` could use `mcscan` output files directly to 
visualize synteny blocks 
(<i aria-label="binoculars icon" class="fa fa-binoculars fa-fw" role="presentation"></i> Main View)
or invoke `mcscan` pipeline 
(<i aria-label="mouse icon" class="fa fa-mouse fa-fw" role="presentation"></i> MCscan Pipeline) 
with genome sequence (`fasta` file) and gene coordinates (`gff3` file containing CDS annotation)
as input.

This document will compare *Arabidopsis thaliana TAIR10* and 
*Arabidopsis lyrata v2.1* as an example to demonstrate usage of
`ShinySyn`.

### Usage Demo

#### Macro/micro-synteny

<img src="images/main_view.gif" alt="" class="docImage" width = "100%">

#### Dot Plot

<img src="images/dot_plot.gif" alt="" class="docImage" width = "100%">


### Input Files

Firstly we will need to downlaod the genmoe fasta and the gene gff3 file from 
[phytozome](https://phytozome-next.jgi.doe.gov/):

- Find *Arabidopsis thaliana TAIR10* from phytozome's species selection block, and click info
button <i class="fas fa-info-circle"></i> to visit Athaliana\_TAIR10's genome information 
page (https://phytozome-next.jgi.doe.gov/info/Athaliana_TAIR10),

<img src="images/Phytozome_species_ath.png" alt="" class="docImage" width = "40%">

- Click "Download" button and click "proceed to data". Please remember to cite genome's original
paper if you downlaod the data and use it in your research.

<img src="images/Phytozome-info-A-thaliana-TAIR10.png" alt="" class="docImage" width = "40%"> 

<img src="images/Phytozome-info-A-thaliana-TAIR10_proceed.png" alt="" class="docImage" width = 40%>

- Choose genome fasta file and gene annotation gff3 file, and click download

<img src="images/Phytozome-info-A-thaliana-TAIR10_files.png" alt="" class="docImage" width = "100%">

- Similiar steps for *Arabidopsis lyrata v2.1*: ![](images/Aly_info.png)

<img src="images/Aly_files.png" alt="" class="docImage" width = "100%">

### MCscan Pipeline

With the input files ready, user could navigate to <i class="fa fa-mouse"></i> **MCscan Pipeline** page and
start running MCscan with several clicks,
please note all input files could be compressed by `gzip` (with `.gz` suffix):

1. Input query species name (e.g. `Athaliana167`)
2. Input query fasta file (e.g. `Athaliana_167_TAIR10.fa.gz`)
3. Input query gff3 file (e.g. `Athaliana_167_gene_exons.gff3.gz`)
4. Input subject species name (e.g. `Alyrata384`)
5. Input subject fasta file (e.g. `Alyrata_384_v1.fa.gz`)
6. Input subject gff3 file (e.g. `Alyrata_384_v2.1.gene.gff3.gz`)
7. Adjust `cscore` cut-off
8. Click <i class="fa fa-running"></i> `Run Pipeline` button

<img src="images/ShinySyn_pipeline.png" alt="" class="docImage" width = "100%">

Please note the default `cscore` cut-off is 0.7, here we used 0.99 to retrieve
the reciprocal best hits (RBHs) of the orthologous genes. More explanation of `csocre`
could refer to this [discussion](https://github.com/tanghaibao/jcvi/issues/141) 
mentioned in the [MCscan's wiki page](https://github.com/tanghaibao/jcvi/wiki/MCscan-%28Python-version%29).

After pipeline finished, user could download all the result file by 
clicking <i class="fa fa-download"></i> `Download Result`. The result will be
a tarball named as `mcscan_result.<time>.tgz`. User could extract all the files
with `tar` in linux or `7-zip` in windows. 

The result files include:

- query BED file (e.g. `Athaliana167.bed`)
- subject BED file (e.g. `Alyrata384.bed`)
- anchor file (e.g. `Athaliana167.Alyrata384.anchors`)
- anchor lifted file (e.g. `Athaliana167.Alyrata384.lifted.anchors`)

### Main View

User could either use the output files generated externally by running Mcscan pipeline
on command line, or the output files returned in the previous section as
the inputs of `ShinySyn`'s visualization.

<img src="images/help_main_view.png" alt="Main Page View" class="docImage" width = "100%">

#### Macro-synteny

After inputing query/subject species name, as well as uploading the four output file mentioned above,
user could generate macro-synteny plot with just one click. We provide two layouts of
macro-synteny: **parallel** and **circular**, which could be switched in the setting block.

**Parallel Layout:**

<img src="images/parallelLayout.png" alt="" class="docImage" width = "100%">

**Circular Layout:**

<img src="images/circularLayout.png" alt="" class="docImage" width = "100%">

If user put mouse over the ribbons (blocks), it will be highlighted and a detial 
information containing start/end query/subject genes will be shown. 

#### Micro-synteny

If user click the ribbon, the micro-synteny associated with the selected region 
will be rendered in the lower panel. There will a heatmap indicating gene density
of the selected region (from query species), and user could brush a small 
region from the heatmap, the genes pairs within will be shown as a typical
micro-synteny view as mcscan, but with a zoom in/out capability. The micro-synteny
will be automatically updated when user choose a different "focused" region
from heatmap.

By default, for each query anchor gene, only the **best hit** from subject 
genes will be retained. User could unpick `Extract one best Subject` in 
the setting block to disable this and keep all the possible orthologous 
pairs. This will retain the "multiple-to-multiple" relationship.

Additionally, a table containing all the gene pairs in the
selected macro-synteny will be shown. The gene pairs are extracted from
`.lifted.anchors` file, and contains "low quality anchor genes close to 
high quality anchors". User could search any gene of interest, and clicking
any row from table will automatically update micro-synteny view with
the anchor highlighted.

<img src="images/help_macro2micro.png" alt="" class="docImage" width = "100%">

#### Colors

A tuned color scheme was used in `ShinySyn`, however, user is able to simply
customize this in the setting block.

### Dot View

If `Generate Dot Viw` was picked in the setting block, a dot plot will be
generated at the same time. User could navigate to 
<i class="fa fa-microscope fa-fw"></i> **Dot View** page to check the result.

There will be a table containing all high quality anchors (from `.anchors` file)
aside of the plot. User could select a small rectangle region to zoom in on the dot plot,
and the table will be updated as well. Double clicking will reset the zoom level.

<img src="images/help_dot_view.png" alt="" class="docImage" width = "100%">
