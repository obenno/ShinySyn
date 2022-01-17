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
              col_names = c("chr", "start","end","gene", "score", "strand")) %>%
            mutate(chr = factor(chr, levels = unique(chr))) %>%
            arrange(chr, start, end)
    }else{
        NULL
    }
})

subjectBed <- reactive({
    req(subjectBedFile())
    if(file.exists(subjectBedFile())){
        vroom(subjectBedFile(),
              col_names = c("chr", "start","end","gene", "score", "strand")) %>%
            mutate(chr = factor(chr, levels = unique(chr))) %>%
            arrange(chr, start, end)
    }else{
       NULL
    }
})

querySpecies <- reactive({
    if(input$use_mcscan){
        input$query_species
    }else{
        input$query_species_main
    }
})

subjectSpecies <- reactive({
    if(input$use_mcscan){
        input$subject_species
    }else{
        input$subject_species_main
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
        anchorFile_new <- tempfile()
        system(paste0("awk 'BEGIN{blockID=0}{if($1~/^##/){blockID+=1;}else{print blockID\"\\t\"$0}}' ", anchorFile(), " > ", anchorFile_new))
        anchorNew <- vroom(
            anchorFile_new,
            col_names = c("blockID", "queryGene", "subjectGene", "score")) %>%
            inner_join(queryBed(),
                       by = c("queryGene" = "gene"),
                       suffix = c(".anchor", ".bed")) %>%
            dplyr::rename("queryChr" = chr,
                          "queryStart" = start,
                          "queryEnd" = end,
                          "queryStrand" = strand) %>%
            select(blockID,
                   queryGene, queryChr,
                   queryStart, queryEnd,
                   subjectGene) %>%
            inner_join(subjectBed(),
                       by = c("subjectGene" = "gene"),
                       suffix = c(".anchor", ".bed")) %>%
            dplyr::rename("subjectChr" = chr,
                          "subjectStart" = start,
                          "subjectEnd" = end,
                          "subjectStrand" = strand) %>%
            select(blockID,
                   queryGene, queryChr,
                   queryStart, queryEnd,
                   subjectGene, subjectChr,
                   subjectStart, subjectEnd)

        get_anchorGene <- function(gene){
            return(paste(gene, collapse = ","))
        }

        get_spanGenes <- function(chr, start, end, bed){
            bed %>%
                filter(
                    chr == {{ chr }},
                    start >= {{ start }},
                    end <= {{ end }}
                ) %>%
                arrange(chr, start, end) %>%
                pull(gene)
        }

        anchorSimple <- anchorNew %>%
            group_by(blockID) %>%
            summarize(
                summarized_queryChr = unique(queryChr),
                summarized_queryStart = min(queryStart),
                summarized_queryEnd = max(queryEnd),
                summarized_queryAnchorList = get_anchorGene(queryGene),
                summarized_subjectChr = unique(subjectChr),
                summarized_subjectStart = min(subjectStart),
                summarized_subjectEnd = max(subjectEnd),
                summarized_subjectAnchorList = get_anchorGene(subjectGene)
            ) %>%
            mutate(
                summarized_queryAnchorList = str_split(summarized_queryAnchorList, ","),
                summarized_subjectAnchorList = str_split(summarized_subjectAnchorList, ",")
            )

        querySpanList <- pmap(
            .l = list(anchorSimple$summarized_queryChr,
                      anchorSimple$summarized_queryStart,
                      anchorSimple$summarized_queryEnd),
            .f=get_spanGenes, queryBed()
        )

        subjectSpanList <- pmap(
            .l = list(anchorSimple$summarized_subjectChr,
                      anchorSimple$summarized_subjectStart,
                      anchorSimple$summarized_subjectEnd),
            .f=get_spanGenes, subjectBed()
        )

        anchorSimple <- anchorSimple %>%
            mutate(
                summarized_querySpanList = querySpanList,
                summarized_subjectSpanList = subjectSpanList
            ) %>%
            mutate(
                aspan = lengths(summarized_querySpanList),
                bspan = lengths(summarized_subjectSpanList),
                asize = lengths(summarized_queryAnchorList),
                bsize = lengths(summarized_subjectAnchorList)
            ) %>%
            mutate(
                a_idx = map2(summarized_queryAnchorList,
                             summarized_querySpanList, .f = match),
                b_idx = map2(summarized_subjectAnchorList,
                             summarized_subjectSpanList, .f = match)
            ) %>%
            mutate(
                orientation = map2_chr(a_idx, b_idx,
                                       .f = function(x, y){
                                           slope <- coefficients(lm(y ~ x))[2]
                                           if(slope<0){
                                               return("-")
                                           }else{
                                               return("+")
                                           }
                                       })
            ) %>%
            mutate(
                summarized_q_startGene = map_chr(summarized_querySpanList,1),
                summarized_q_endGene = map_chr(summarized_querySpanList, .f=function(x){x[length(x)]}),
                summarized_s_startGene = map_chr(summarized_subjectSpanList, 1),
                summarized_s_endGene = map_chr(summarized_subjectSpanList, .f=function(x){x[length(x)]})
            ) %>%
            dplyr::rename(
                       queryChr = summarized_queryChr,
                       queryStart = summarized_queryStart,
                       queryEnd = summarized_queryEnd,
                       q_startGene = summarized_q_startGene,
                       q_endGene = summarized_q_endGene,
                       subjectChr = summarized_subjectChr,
                       subjectStart = summarized_subjectStart,
                       subjectEnd = summarized_subjectEnd,
                       s_startGene = summarized_s_startGene,
                       s_endGene = summarized_s_endGene
                   ) %>%
            mutate(
                score = as.integer(sqrt(aspan * bspan))
            ) %>%
            select(
                -contains("List"),
                -c(a_idx, b_idx)
            )

        ## Filter anchor file by minsize and minspan
        minsize <- 0
        minspan <- 30
        anchorSimple <- anchorSimple %>%
            filter(asize >= minsize & bsize >= minsize) %>%
            filter(aspan >= minspan & bspan >= minspan)
        ##write_tsv(anchorSimple, file = paste0(tempdir(), "/1111"))

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

        anchorSimple <- anchorSimple %>%
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
            "querySpecies" = querySpecies(),
            "queryChrInfo" = queryChrInfo,
            "subjectSpecies" = subjectSpecies(),
            "subjectChrInfo" = subjectChrInfo,
            "ribbon" = anchorSimple,
            "plotMode" = plotMode
        )
        session$sendCustomMessage(type = "plotMacroSynteny", macro_synteny_data)

        ## Generate dot_view_data
        if(input$generateDotPlot){
            anchorSeed <- vroom(anchorFile(), comment ="#",
                                    col_names = c("queryGene", "subjectGene", "mcscan_score")) %>%
                inner_join(synteny$queryBed, by = c("queryGene" = "gene")) %>%
                inner_join(synteny$subjectBed,
                           by = c("subjectGene" = "gene"),
                           suffix = c("_query", "_subject"))

            dot_view_data <- list(
                "querySpecies" = querySpecies(),
                "queryChrInfo" = queryChrInfo,
                "subjectSpecies" = subjectSpecies(),
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

    macroQueryChr <- input$selected_macroRegion[["macroQueryChr"]]
    macroQueryStart <- input$selected_macroRegion[["macroQueryStart"]]
    macroQueryEnd <- input$selected_macroRegion[["macroQueryEnd"]]
    macroSubjectChr <- input$selected_macroRegion[["macroSubjectChr"]]
    macroSubjectStart <- input$selected_macroRegion[["macroSubjectStart"]]
    macroSubjectEnd <- input$selected_macroRegion[["macroSubjectEnd"]]

    synteny$selectedQueryRegion <- synteny$queryBed %>%
        filter(chr == macroQueryChr,
               start >= macroQueryStart,
               end <= macroQueryEnd)

    synteny$selectedSubjectRegion <- synteny$subjectBed %>%
        filter(chr == macroSubjectChr,
               start >= macroSubjectStart,
               end <= macroSubjectEnd)

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
        full_join(synteny$selectedQueryRegion,
                   by = c("q_Gene" = "gene"),
                   suffix = c(".anchor", ".bed")) %>%
        select(q_Gene,
               chr, start, end, strand,
               s_Gene) %>%
        dplyr::rename(q_GeneChr = chr,
                      q_GeneStart = start,
                      q_GeneEnd = end,
                      q_GeneStrand = strand) %>%
        full_join(synteny$selectedSubjectRegion,
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
        arrange(q_GeneChr, q_GeneStart, q_GeneEnd, s_GeneChr, s_GeneStart, s_GeneEnd)

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
              "Please select your region of interest from the dot plot on the left panel, the table below will be updated automatically."),
            DTOutput("selected_anchors")
        )
    })
})