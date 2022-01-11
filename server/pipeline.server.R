observe({
    toggleState(id = "mcscan_go",
                condition = isTruthy(input$query_species) &&
                    isTruthy(input$queryGenome) &&
                    isTruthy(input$queryGFF) &&
                    isTruthy(input$subject_species) &&
                    isTruthy(input$subjectGenome) &&
                    isTruthy(input$subjectGFF)
                )
})

observe({
    toggleState(id = "mcscan_download",
                file.exists(paste0(tempdir(), "/", input$query_species, ".bed")) &&
                file.exists(paste0(tempdir(), "/", input$subject_species, ".bed")) &&
                file.exists(paste0(tempdir(), "/", input$query_species, ".", input$subject_species, ".anchors")) &&
                file.exists(paste0(tempdir(), "/", input$query_species, ".", input$subject_species, ".lifted.anchors"))
                )
})

observe({
    if(input$use_mcscan){
        if(!file.exists(paste0(tempdir(), "/", input$query_species, ".bed")) ||
           !file.exists(paste0(tempdir(), "/", input$subject_species, ".bed")) ||
           !file.exists(paste0(tempdir(), "/", input$query_species, ".", input$subject_species, ".anchors")) ||
           !file.exists(paste0(tempdir(), "/", input$query_species, ".", input$subject_species, ".lifted.anchors"))){
            shinyalert("Oops!", "Please run pipeline first, then switch this on", type = "error")
            updateMaterialSwitch(session, "use_mcscan", value = FALSE)
        }
    }
})

## Init loading bars for mcscan pipeline
waitress <- Waitress$new(theme = "overlay-percent")
observeEvent(input$mcscan_go, {
    ## mcscan pipeline needs user to upload valid files\
    req(input$query_species)
    req(input$subject_species)
    req(input$queryGenome)
    req(input$subjectGenome)
    req(input$queryGFF)
    req(input$subjectGFF)

    waitress$start()
    ## user uploaded files
    ## genome files
    message("Preparing genome files...")
    query_genome <- input$queryGenome$datapath
    subject_genome <- input$subjectGenome$datapath
    if(str_detect(query_genome, ".gz$")){
        query_genome_uncompressed <- tempfile(pattern=paste0(input$query_species, "."), fileext=".fa")
        system(paste0("gunzip -c ", query_genome, " > ", query_genome_uncompressed))
        query_genome <- query_genome_uncompressed
    }
    if(str_detect(subject_genome, ".gz$")){
        subject_genome_uncompressed <- tempfile(pattern=paste0(input$subject_species, "."), fileext=".fa")
        system(paste0("gunzip -c ", subject_genome, " > ", subject_genome_uncompressed))
        subject_genome <- subject_genome_uncompressed
    }

    waitress$set(10)
    ## GFF files
    query_gff <- input$queryGFF$datapath
    subject_gff <- input$subjectGFF$datapath

    waitress$set(20)
    ## pipeline start
    ## prepare bed
    message("Generating bed files...")
    query_bed <- tempfile(pattern=paste0(input$query_species, "."), fileext=".bed")
    subject_bed <- tempfile(pattern=paste0(input$subject_species, "."), fileext=".bed")
    query_bed_cmd <- paste0("python -m jcvi.formats.gff bed --type=mRNA --key=ID --primary_only ", query_gff, " -o ", query_bed)
    subject_bed_cmd <- paste0("python -m jcvi.formats.gff bed --type=mRNA --key=ID --primary_only ", subject_gff, " -o ", subject_bed)
    system(query_bed_cmd)
    system(subject_bed_cmd)

    waitress$set(30)
    ## prepare cds
    message("Generating CDS files...")
    query_cds <- tempfile(pattern=paste0(input$query_species, "."), fileext=".cds")
    subject_cds <- tempfile(pattern=paste0(input$subject_species, "."), fileext=".cds")
    if(str_detect(query_gff, ".gz$")){
        query_cds_cmd <- paste0("zcat ", query_gff, " | gffread -x ", query_cds, " -g ", query_genome)
    }else{
        query_cds_cmd <- paste0("gffread -x ", query_cds, " -g ", query_genome, " ", query_gff)
    }
    if(str_detect(subject_gff, ".gz$")){
        subject_cds_cmd <- paste0("zcat ", subject_gff, " | gffread -x ", subject_cds, " -g ", subject_genome)
    }else{
        subject_cds_cmd <- paste0("gffread -x ", subject_cds, " -g ", subject_genome, " ", subject_gff)
    }
    system(query_cds_cmd)
    system(subject_cds_cmd)

    waitress$set(40)
    ## mcscan
    ## create link file for all input bed and cds files, since mcscan has some input file name limitations
    system(paste0("ln -s -f ", query_bed, " ", tempdir(), "/", input$query_species, ".bed"))
    system(paste0("ln -s -f ", subject_bed, " ", tempdir(), "/", input$subject_species, ".bed"))
    system(paste0("ln -s -f ", query_cds, " ", tempdir(), "/", input$query_species, ".cds"))
    system(paste0("ln -s -f ", subject_cds, " ", tempdir(), "/", input$subject_species, ".cds"))
    mcscan_cmd <- paste0("python -m jcvi.compara.catalog ortholog ", input$query_species, " ", input$subject_species, " --cscore=", input$cscore, " --no_strip_names")
    ## Perform compare command
    system(paste0("cd ", tempdir(), ";", mcscan_cmd, " 2>&1"))
    waitress$close()

})


## Create download result
output$mcscan_download <- downloadHandler(
    filename = function(){ paste0("mcscan_result.", Sys.Date(), ".tgz") },
    content =function(file){
        system(paste("tar cvzf", file,
                     "--dereference",
                     "-C",
                     tempdir(),
                     paste0(input$query_species, ".bed"),
                     paste0(input$subject_species, ".bed"),
                     paste0(input$query_species, ".", input$subject_species, ".anchors"),
                     paste0(input$query_species, ".", input$subject_species, ".lifted.anchors"),
                     sep=" "))
    }
)
