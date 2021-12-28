downloadButton_custom <- function (outputId, label = "Download", class = NULL, status = "primary",
                                   ...,
                                   icon = shiny::icon("download"))
{
    aTag <- tags$a(id = outputId,
                   class = paste(paste0("btn btn-", status, " shiny-download-link"),
                                 class),
                   href = "", target = "_blank", download = NA,
                   icon, label, ...)
}

summarizeChrInfo <- function(inputBed){
    ## summarize input bed tibble to generate
    ## chr start, end and length
    summarizedBed <- inputBed %>%
        group_by(chr) %>%
        summarise(start = min(start),
                  end = max(end)) %>%
        mutate(chrLength = end - start + 1)
    return(summarizedBed)
}

## Altered label of colourInput
colourInput <- function (inputId, label, value = "white", showColour = c("both",
    "text", "background"), palette = c("square", "limited"),
    allowedCols = NULL, allowTransparent = FALSE, returnName = FALSE,
    closeOnClick = FALSE)
{
    showColour <- match.arg(showColour)
    palette <- match.arg(palette)
    value <- restoreInput(id = inputId, default = value)
    shiny::addResourcePath("colourpicker-binding", system.file("srcjs",
        package = "colourpicker"))
    shiny::addResourcePath("colourpicker-lib", system.file("www",
        "shared", "colourpicker", package = "colourpicker"))
    deps <- list(htmltools::htmlDependency("colourpicker-binding",
        "0.1.0", c(href = "colourpicker-binding"), script = "input_binding_colour.js"),
        htmltools::htmlDependency("colourpicker-lib", "0.1.0",
            c(href = "colourpicker-lib"), script = "js/colourpicker.min.js",
            stylesheet = "css/colourpicker.min.css"))
    inputTag <- shiny::tags$input(id = inputId, type = "text",
        class = "form-control shiny-colour-input", `data-init-value` = value,
        `data-show-colour` = showColour, `data-palette` = palette)
    if (!is.null(allowedCols)) {
        allowedCols <- jsonlite::toJSON(allowedCols)
        inputTag <- shiny::tagAppendAttributes(inputTag, `data-allowed-cols` = allowedCols)
    }
    if (returnName) {
        inputTag <- shiny::tagAppendAttributes(inputTag, `data-return-name` = "true")
    }
    if (allowTransparent) {
        inputTag <- shiny::tagAppendAttributes(inputTag, `data-allow-alpha` = "true")
    }
    if (closeOnClick) {
        inputTag <- shiny::tagAppendAttributes(inputTag, `data-close-on-click` = "true")
    }
    inputTag <- shiny::div(class = "form-group shiny-input-container",
        `data-shiny-input-type` = "colour", label %AND% shiny::tags$label(label, class="control-label",
            `for` = inputId), inputTag)
    htmltools::attachDependencies(inputTag, deps)
}

# copied from shiny since it's not exported
`%AND%` <- function(x, y) {
  if (!is.null(x) && !isTRUE(is.na(x)))
    if (!is.null(y) && !isTRUE(is.na(y)))
      return(y)
  return(NULL)
}
