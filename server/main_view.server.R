## Init synteny data as reactiveValues
synteny <- reactiveValues()

## Setup file path
## query BED file path
queryBedFile <- reactive({
    if(input$use_mcscan){
        paste0(tempdir(), "/", input$query_species, ".bed")
    }else{
        input$queryBED$datapath
    }
})

## subject BED file path
subjectBedFile <- reactive({
    if(input$use_mcscan){
        paste0(tempdir(), "/", input$subject_species, ".bed")
    }else{
        input$subjectBED$datapath
    }
})

## anchor file path
anchorFile <- reactive({
    if(input$use_mcscan){
        paste0(tempdir(), "/", input$query_species, ".", input$subject_species, ".anchors")
    }else{
        input$anchorFile$datapath
    }
})

## anchor lifted file path
anchorLiftedFile <- reactive({
    if(input$use_mcscan){
        paste0(tempdir(), "/",input$query_species, ".", input$subject_species, ".lifted.anchors")
    }else{
        input$anchorLiftedFile$datapath
    }
})

queryBed <- reactive({
    req(queryBedFile())
    if(file.exists(queryBedFile())){
        vroom(queryBedFile(),
              col_names = c("chr", "start","end","gene", "score", "strand"))
    }else{
        NULL
    }
})

subjectBed <- reactive({
    req(subjectBedFile())
    if(file.exists(subjectBedFile())){
        vroom(subjectBedFile(),
              col_names = c("chr", "start","end","gene", "score", "strand"))
    }else{
       NULL
    }
})

observe({
    if(is.null(queryBed())){
        x <- NULL
    }else{
        x <- queryBed() %>% pull(chr) %>% unique()
    }
    ## Can also set the label and select items
    updateSelectInput(session, "synteny_query_chr",
                      choices = x)
})

observe({
    if(is.null(subjectBed())){
        x <- NULL
    }else{
        x <- subjectBed() %>% pull(chr) %>% unique()
    }

    updateSelectInput(session, "synteny_subject_chr",
                       choices = x)
})

observeEvent(input$macroSynteny, {

    output$microAnchor_out <- NULL
    if(is.null(queryBed()) || is.null(subjectBed())){
        shinyalert("Oops!", "query or subject BED file doesn't exist, please use MCscan pipeline first or upload your own BED file", type = "error")
    }else if(is.null(anchorFile()) || !file.exists(anchorFile())){
        shinyalert("Oops!", "Anchor file doesn't exist, please use MCscan pipeline first or upload your own anchor file", type = "error")
    }else if(is.null(anchorLiftedFile()) || !file.exists(anchorLiftedFile())){
        shinyalert("Oops!", "Anchor lifted file  doesn't exist, please use MCscan pipeline first or upload your own anchor lifted file", type = "error")
    }else{
        ## generate anchor simple
        anchorFile_new <- tempfile()
        system(paste0("python -m jcvi.compara.synteny screen ", anchorFile(), " ", anchorFile_new, " --minspan=30 --simple --qbed=", queryBedFile(), " --sbed=", subjectBedFile()))
        anchorFile_simple <- paste0(tempdir(), "/", basename(anchorFile_new), ".simple")

        ## generate i1 file
        i1File <- tempfile()
        system(paste0("python -m jcvi.compara.synteny mcscan ", queryBedFile(), " ", anchorLiftedFile(), " --iter=1 -o ", i1File))

        ## Read data
        anchor_simple <- vroom(
            anchorFile_simple,
            col_names = c("q_startGene","q_endGene",
                          "s_startGene","s_endGene",
                          "score","orientation")
        )

        ## Process anchor_simple
        anchor_simple <- anchor_simple %>%
            inner_join(queryBed(),
                       by = c("q_startGene" = "gene"),
                       suffix = c(".anchor", ".bed")) %>%
            select(q_startGene, q_endGene,
                   s_startGene, s_endGene,
                   score.anchor, orientation,
                   chr, start) %>%
            dplyr::rename(score = score.anchor,
                   queryChr = chr,
                   queryStart = start)

        anchor_simple <- anchor_simple %>%
            inner_join(queryBed(),
                       by = c("q_endGene" = "gene"),
                       suffix = c(".anchor", ".bed")) %>%
            select(q_startGene, q_endGene,
                   s_startGene, s_endGene,
                   score.anchor, orientation,
                   queryChr, queryStart, end) %>%
            dplyr::rename(score = score.anchor,
                   queryEnd = end)

        anchor_simple <- anchor_simple %>%
            inner_join(subjectBed(),
                       by = c("s_startGene" = "gene"),
                       suffix = c(".anchor", ".bed")) %>%
            select(q_startGene, q_endGene,
                   s_startGene, s_endGene,
                   score.anchor, orientation,
                   queryChr, queryStart, queryEnd,
                   chr, start) %>%
            dplyr::rename(score = score.anchor,
                   subjectChr = chr,
                   subjectStart = start)

        anchor_simple <- anchor_simple %>%
            inner_join(subjectBed(),
                       by = c("s_endGene" = "gene"),
                       suffix = c(".anchor", ".bed")) %>%
            select(q_startGene, q_endGene,
                   s_startGene, s_endGene,
                   score.anchor, orientation,
                   queryChr, queryStart, queryEnd,
                   subjectChr, subjectStart,
                   end) %>%
            dplyr::rename(score = score.anchor,
                   subjectEnd = end)

        ## Process anchor_full (i1block file)
        anchor_full <- vroom(
            i1File,
            col_names = c("q_Gene","s_Gene")
        )

        anchor_full <- anchor_full %>%
            inner_join(queryBed(),
                       by = c("q_Gene" = "gene"),
                       suffix = c(".anchor", ".bed")) %>%
            select(q_Gene,
                   chr, start, end, strand,
                   s_Gene) %>%
            dplyr::rename(q_GeneChr = chr,
                   q_GeneStart = start,
                   q_GeneEnd = end,
                   q_GeneStrand = strand)

        anchor_full <- anchor_full %>%
            left_join(subjectBed(),
                      by = c("s_Gene" = "gene"),
                      suffix = c(".anchor", ".bed")) %>%
            select(q_Gene,
                   q_GeneChr, q_GeneStart, q_GeneEnd, q_GeneStrand,
                   s_Gene,
                   chr, start, end, strand) %>%
            dplyr::rename(s_GeneChr = chr,
                   s_GeneStart = start,
                   s_GeneEnd = end,
                   s_GeneStrand = strand)

        synteny$queryBed <- queryBed() %>%
            filter(chr %in% input$synteny_query_chr) %>%
            arrange(chr, start)

        synteny$subjectBed <- subjectBed() %>%
            filter(chr %in% input$synteny_subject_chr) %>%
            arrange(chr, start)

        anchor_simple <- anchor_simple %>%
            filter(queryChr %in% input$synteny_query_chr & subjectChr %in% input$synteny_subject_chr)

        ## Filter and order anchor_full
        synteny$anchor_full <- anchor_full %>%
            filter(q_GeneChr %in% input$synteny_query_chr) %>%
            arrange(q_GeneChr, q_GeneStart)

        queryChrInfo <- summarizeChrInfo(synteny$queryBed)
        subjectChrInfo <- summarizeChrInfo(synteny$subjectBed)
        plotMode <- "circular"
        ## Generate macro_synteny_data
        macro_synteny_data <- list(
            "queryChrInfo" = queryChrInfo,
            "subjectChrInfo" = subjectChrInfo,
            "ribbon" = anchor_simple,
            "plotMode" = plotMode
        )
        session$sendCustomMessage(type = "plotMacroSynteny", macro_synteny_data)
        ##macroSynteny_waiter$hide()
    }
})

observeEvent(input$selected_macroRegion, {

    selectedRegion_queryStartGene <- input$selected_macroRegion[["q_startGene"]]
    selectedRegion_queryEndGene <- input$selected_macroRegion[["q_endGene"]]
    selectedRegion_subjectStartGene <- input$selected_macroRegion[["s_startGene"]]
    selectedRegion_subjectEndGene <- input$selected_macroRegion[["s_endGene"]]

    idx1 <- rownames(synteny$queryBed)[ synteny$queryBed$gene == selectedRegion_queryStartGene] %>%
        as.numeric()
    idx2 <- rownames(synteny$queryBed)[ synteny$queryBed$gene == selectedRegion_queryEndGene] %>%
        as.numeric()
    synteny$selectedQueryRegion <- synteny$queryBed %>% slice(idx1: idx2)

    idx1 <- rownames(synteny$anchor_full)[ synteny$anchor_full$q_Gene == selectedRegion_queryStartGene] %>%
        as.numeric()
    idx2 <- rownames(synteny$anchor_full)[ synteny$anchor_full$q_Gene == selectedRegion_queryEndGene] %>%
        as.numeric()
    synteny$selectedAnchors <- synteny$anchor_full %>% slice(idx1: idx2)

    idx1 <- rownames(synteny$subjectBed)[ synteny$subjectBed$gene == selectedRegion_subjectStartGene] %>%
        as.numeric()
    idx2 <- rownames(synteny$subjectBed)[ synteny$subjectBed$gene == selectedRegion_subjectEndGene] %>%
        as.numeric()
    synteny$selectedSubjectRegion <- synteny$subjectBed %>% slice(idx1: idx2) %>%
        arrange(chr, start)
    ## Put all anchor infor into result table
    ## including genes without subject hits
    output$microAnchor_out <- DT::renderDataTable({
        synteny$selectedAnchors
    }, selection="single", rownames = FALSE, server = FALSE)
    ## Filter anchor infor to discard records with
    ## subject genes not in the selected subject macro-synteny region
    ##synteny$selectedAnchors_filtered <- synteny$selectedAnchors %>%
    ##    filter(s_Gene %in% synteny$selectedSubjectRegion$gene)

    micro_synteny_data <- list(
        microQueryRegion = synteny$selectedQueryRegion,
        microSubjectRegion = synteny$selectedSubjectRegion,
        microAnchors = synteny$selectedAnchors
    )

    session$sendCustomMessage(type = "plotSelectedMicroSynteny", micro_synteny_data)

    ##shinyjs::show("microSynteny_download")

})

observeEvent(input$microAnchor_out_rows_selected, {
    selectedQueryGene <- synteny$selectedAnchors[input$microAnchor_out_rows_selected,] %>%
        pull(q_Gene)
    session$sendCustomMessage(type = "center_microSynteny", selectedQueryGene)
})
