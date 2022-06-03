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

mcscan_result <- reactivePoll(1000, session,
      ## This function returns the time stamp of data file
      checkFunc = function() {
          queryBedFile <- paste0(tempdir(), "/", input$query_species, ".bed")
          subjectBedFile <- paste0(tempdir(), "/", input$subject_species, ".bed")
          anchorSeed <- paste0(tempdir(), "/", input$query_species, ".", input$subject_species, ".anchors")
          anchorLifted <- paste0(tempdir(), "/", input$query_species, ".", input$subject_species, ".lifted.anchors")
          if (file.exists(queryBedFile) &&
              file.exists(subjectBedFile) &&
              file.exists(anchorSeed) &&
              file.exists(anchorLifted)){
              list(
                  file.info(queryBedFile)$mtime[1],
                  file.info(subjectBedFile)$mtime[1],
                  file.info(anchorSeed)$mtime[1],
                  file.info(anchorLifted)$mtime[1]
              )
          }else{
              ""
          }
      },
      valueFunc = function() {
          queryBedFile <- paste0(tempdir(), "/", input$query_species, ".bed")
          subjectBedFile <- paste0(tempdir(), "/", input$subject_species, ".bed")
          anchorSeed <- paste0(tempdir(), "/", input$query_species, ".", input$subject_species, ".anchors")
          anchorLifted <- paste0(tempdir(), "/", input$query_species, ".", input$subject_species, ".lifted.anchors")
          if(file.exists(queryBedFile) &&
             file.exists(subjectBedFile) &&
             file.exists(anchorSeed) &&
             file.exists(anchorLifted)){
              return(file.info(anchorLifted)$mtime[1])
          }else{
              return(NULL)
          }
      }
      )

observe({
    toggleState(
        id = "mcscan_download",
        !is.null(mcscan_result())
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
    ## all the command will assume gzipped files as input,
    ## if user uploaded files are not gzipped, they will be compressed

    ## genome files
    message("Preparing genome files...")
    query_genome_name <- input$queryGenome$name
    query_genome_input <- input$queryGenome$datapath
    subject_genome_name <- input$subjectGenome$name
    subject_genome_input <- input$subjectGenome$datapath

    check_genome_input <- function(genome_name, genome_input){
        genome_file <- file_temp(ext = ".fa.gz")
        if(str_detect(genome_name, regex(".(fa|fasta)$"))){
            system(paste0("gzip -c ", genome_input, " > ", genome_file))
        }else if(str_detect(genome_name, regex(".(fa.gz|fasta.gz)$"))){
            system(paste0("ln -s ", genome_input, " ", genome_file))
        }
        return(genome_file)
    }

    query_genome <- check_genome_input(query_genome_name, query_genome_input)
    subject_genome <- check_genome_input(subject_genome_name, subject_genome_input)

    waitress$set(10)
    message("Preparing gff files...")
    ## GFF files
    query_gff_name <- input$queryGFF$name
    query_gff_input <- input$queryGFF$datapath
    subject_gff_name <- input$subjectGFF$name
    subject_gff_input <- input$subjectGFF$datapath

    ## check input format, convert gtf to gff
    check_gff_input <- function(gff_input_name, gff_input_path){
        ## create tmpfile
        gzipped_gff <- file_temp(ext = ".gff.gz")

        if(str_detect(gff_input_name, ".gff$")){
            gzip_gff_cmd <- paste0("gzip -c ", gff_input_path, " > ", gzipped_gff)
            system(gzip_gff_cmd)
        }else if(str_detect(gff_input_name, regex(".(gff.gz|gff3.gz)$"))){
            link_gff_cmd <- paste0("ln -s ", gff_input_path, " ", gzipped_gff)
            system(link_gff_cmd)
        }else if(str_detect(gff_input_name, ".gtf$")){
            convertGTF_cmd <- paste0("gffread ", gff_input_path, " | gzip -c > ", gzipped_gff)
            system(convertGTF_cmd)
        }else if(str_detect(gff_input_name, regex(".gtf.gz$"))){
            gunzipped_gtf <- file_temp(ext = ".gtf")
            gunzip_gtf_cmd <- paste0("gunzip -c ", gff_input_path, " > ", gunzipped_gtf)
            system(gunzip_gtf_cmd)
            convertGTF_cmd <- paste0("gffread ", gunzipped_gtf, " | gzip -c > ", gzipped_gff)
            system(convertGTF_cmd)
            system(paste0("rm ", gunzipped_gtf))
        }else{
            message("gff_input is ", gff_input_name)
            message("Input annotation file is not GFF/GTF format")
        }
        return(gzipped_gff)
    }

    query_gff <- check_gff_input(query_gff_name, query_gff_input)
    subject_gff <- check_gff_input(subject_gff_name, subject_gff_input)


    waitress$set(20)
    ## pipeline start
    ## prepare bed
    message("Generating bed files...")
    query_bed <- path_temp(paste0(input$query_species, ".bed"))
    subject_bed <- path_temp(paste0(input$subject_species, ".bed"))
    query_bed_cmd <- paste0("python -m jcvi.formats.gff bed --type=mRNA,transcript --key=ID --primary_only ", query_gff, " -o ", query_bed)
    subject_bed_cmd <- paste0("python -m jcvi.formats.gff bed --type=mRNA,transcript --key=ID --primary_only ", subject_gff, " -o ", subject_bed)
    system(query_bed_cmd)
    system(subject_bed_cmd)

    waitress$set(30)
    ## prepare cds
    ## use gffread to generate cds fasta file
    gffread_extract_cds <- function(gzip_gff, gzip_fa, out_cds_fileName){
        temp_gff <- file_temp(ext = ".gff")
        temp_fasta <- file_temp(ext = ".fa")
        gunzip_gff_cmd <- paste0("gunzip -c ", gzip_gff, " > ", temp_gff)
        gunzip_fasta_cmd <- paste0("gunzip -c ", gzip_fa, " > ", temp_fasta)
        system(gunzip_gff_cmd)
        system(gunzip_fasta_cmd)
        ## extract cds
        gffread_cmd <- paste0("gffread -x ", out_cds_fileName, " -g ",
                              temp_fasta, " ", temp_gff)
        system(gffread_cmd)
        system(paste0("rm ", temp_gff))
        system(paste0("rm ", temp_fasta))
    }

    message("Generating CDS files...")
    query_cds <- path_temp(paste0(input$query_species, ".cds"))
    subject_cds <- path_temp(paste0(input$subject_species, ".cds"))

    gffread_extract_cds(query_gff, query_genome, query_cds)
    gffread_extract_cds(subject_gff, subject_genome, subject_cds)

    waitress$set(40)
    ## mcscan
    ## create link file for all input bed and cds files, since mcscan has some input file name limitations
    ##system(paste0("ln -s -f ", query_bed, " ", tempdir(), "/", input$query_species, ".bed"))
    ##system(paste0("ln -s -f ", subject_bed, " ", tempdir(), "/", input$subject_species, ".bed"))
    ##system(paste0("ln -s -f ", query_cds, " ", tempdir(), "/", input$query_species, ".cds"))
    ##system(paste0("ln -s -f ", subject_cds, " ", tempdir(), "/", input$subject_species, ".cds"))
    mcscan_cmd <- paste0("python -m jcvi.compara.catalog ortholog ", input$query_species, " ", input$subject_species, " --cscore=", input$cscore, " --no_strip_names --no_dotplot")
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
