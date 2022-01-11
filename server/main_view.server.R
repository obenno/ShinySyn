## Init synteny data as reactiveValues
synteny <- reactiveValues()

## create waiter
mainView_waiter <- Waiter$new()

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

    ## show spinner
    mainView_waiter$show()

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
        anchorFile_simple <- paste0(tempdir(), "/",
                                    str_replace(basename(anchorFile_new), regex("\\..*"), ""),
                                    ".simple")

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

        ## Process anchor_full
        anchor_full <- vroom(
            anchorLiftedFile(),
            col_names = c("q_Gene","s_Gene", "score"),
            comment = "#"
        )

        synteny$queryBed <- queryBed() %>%
            filter(chr %in% input$synteny_query_chr) %>%
            arrange(factor(chr, levels = input$synteny_query_chr), start)

        synteny$subjectBed <- subjectBed() %>%
            filter(chr %in% input$synteny_subject_chr) %>%
            arrange(factor(chr, levels = input$synteny_subject_chr),start)

        anchor_simple <- anchor_simple %>%
            filter(queryChr %in% input$synteny_query_chr & subjectChr %in% input$synteny_subject_chr)

        ## Filter and order anchor_full
        synteny$anchor_full <- anchor_full ##%>%
             ##filter(q_GeneChr %in% input$synteny_query_chr) %>%
             ##arrange(q_GeneChr, q_GeneStart)

        queryChrInfo <- summarizeChrInfo(synteny$queryBed, input$synteny_query_chr)
        subjectChrInfo <- summarizeChrInfo(synteny$subjectBed, input$synteny_subject_chr)
        ## Define macro plot mode
        if(input$macroPlotMode == "Circular"){
            plotMode <- "circular"
        }else{
            plotMode <- "parallel"
        }
        ## Generate macro_synteny_data
        macro_synteny_data <- list(
            "queryChrInfo" = queryChrInfo,
            "subjectChrInfo" = subjectChrInfo,
            "ribbon" = anchor_simple,
            "plotMode" = plotMode
        )
        session$sendCustomMessage(type = "plotMacroSynteny", macro_synteny_data)

        ## Generate dot_view_data
        if(input$generateDotPlot){
            anchorSeed <- read_tsv(anchorFile(), comment ="#",
                                    col_names = c("queryGene", "subjectGene", "mcscan_score")) %>%
                inner_join(synteny$queryBed, by = c("queryGene" = "gene")) %>%
                inner_join(synteny$subjectBed,
                           by = c("subjectGene" = "gene"),
                           suffix = c("_query", "_subject"))

            dot_view_data <- list(
                "queryChrInfo" = queryChrInfo,
                "subjectChrInfo" = subjectChrInfo,
                "anchorSeed" = anchorSeed
            )

            session$sendCustomMessage(type = "plotDotView", dot_view_data)
        }
        ## hide spinner
        mainView_waiter$hide()

    }
})

observeEvent(input$selected_macroRegion, {
    ## The start and end gene were from 5' to 3' order on the genome
    ## no matter the orientation relationship between query and subject region
    selectedRegion_queryStartGene <- input$selected_macroRegion[["q_startGene"]]
    selectedRegion_queryEndGene <- input$selected_macroRegion[["q_endGene"]]
    selectedRegion_subjectStartGene <- input$selected_macroRegion[["s_startGene"]]
    selectedRegion_subjectEndGene <- input$selected_macroRegion[["s_endGene"]]

    microQueryChr <- synteny$queryBed %>%
        filter(gene == selectedRegion_queryStartGene) %>%
        pull(chr)
    microQueryStart <- synteny$queryBed %>%
        filter(gene == selectedRegion_queryStartGene) %>%
        pull(start)
    microQueryEnd <- synteny$queryBed %>%
        filter(gene == selectedRegion_queryEndGene) %>%
        pull(end)

    synteny$selectedQueryRegion <- synteny$queryBed %>%
        filter(chr == microQueryChr,
               start >= microQueryStart,
               end <= microQueryEnd)

    microSubjectChr <- synteny$subjectBed %>%
        filter(gene == selectedRegion_subjectStartGene) %>%
        pull(chr)
    microSubjectStart <- synteny$subjectBed %>%
        filter(gene == selectedRegion_subjectStartGene) %>%
        pull(start)
    microSubjectEnd <- synteny$subjectBed %>%
        filter(gene == selectedRegion_subjectEndGene) %>%
        pull(end)

    synteny$selectedSubjectRegion <- synteny$subjectBed %>%
        filter(chr == microSubjectChr,
               start >= microSubjectStart,
               end <= microSubjectEnd)

    synteny$selectedAnchors <- synteny$anchor_full %>%
        filter(q_Gene %in% synteny$selectedQueryRegion$gene,
               s_Gene %in% synteny$selectedSubjectRegion$gene)

    ## firstly filter anchors, retain the one with highest score value
    ## this behaviour should be the same as generating i1 blocks in mcscan doc
    if(input$oneBestSubject){
        synteny$selectedAnchors <- synteny$selectedAnchors %>%
            group_by(q_Gene) %>%
            summarise(s_Gene  = first(s_Gene, order_by = desc(score)))
    }

    ## Added genomics coordinates to anchors
    synteny$selectedAnchors <- synteny$selectedAnchors %>%
        inner_join(synteny$selectedQueryRegion,
                   by = c("q_Gene" = "gene"),
                   suffix = c(".anchor", ".bed")) %>%
        select(q_Gene,
               chr, start, end, strand,
               s_Gene) %>%
        dplyr::rename(q_GeneChr = chr,
                      q_GeneStart = start,
                      q_GeneEnd = end,
                      q_GeneStrand = strand) %>%
        left_join(synteny$selectedSubjectRegion,
                  by = c("s_Gene" = "gene"),
                  suffix = c(".anchor", ".bed")) %>%
        select(q_Gene,
               q_GeneChr, q_GeneStart, q_GeneEnd, q_GeneStrand,
               s_Gene,
               chr, start, end, strand) %>%
        dplyr::rename(s_GeneChr = chr,
                      s_GeneStart = start,
                      s_GeneEnd = end,
                      s_GeneStrand = strand) %>%
        arrange(q_GeneChr, q_GeneStart, q_GeneEnd)

    ## Put all anchor infor into result table
    output$microAnchor_out <- DT::renderDataTable({
        synteny$selectedAnchors
    }, selection="single", rownames = FALSE, server = TRUE)

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

observeEvent(input$selected_anchors, {

    ## shiny transferred data are nested lists
    ## not friendly
    print(input$selected_anchors %>% unlist())
    output$selected_anchors  <- DT::renderDataTable({
        input$selected_anchors %>%
            as_tibble() %>%
            dplyr::rename(
                       "QueryGene" = queryGene,
                       "QueryChr" = chr_query,
                       "QueryStart" = start_query,
                       "QueryEnd" = end_query,
                       "QueryStrand" = strand_query,
                       "SubjectGene" = subjectGene,
                       "SubjectChr" = chr_subject,
                       "SubjectStart" = start_subject,
                       "SubjectEnd" = end_subject,
                       "SubjectStrand" = strand_subject
                   ) %>%
            unnest(cols = c(QueryGene,QueryChr,QueryStart,QueryEnd,QueryStrand,SubjectGene,SubjectChr,SubjectStart,SubjectEnd,SubjectStrand))
    }, selection="single", rownames = FALSE, server = TRUE)

    output$dotviewTable <- renderUI({
        tagList(
            h4("Anchor Genes:"),
            p(style="color: gray;",
              "Please selected your region of interest from the dot plot on the left panel, the table below will be updated automatically."),
            DTOutput("selected_anchors")
        )
    })
})