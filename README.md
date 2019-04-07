# AutoScrape Extractor for Workbench

This module provides a web-based user interface for
building [Hext templates](https://github.com/thomastrapp/hext)
to extract structured data from source HTML documents.

It can run in two modes:
- as a standalone static HTML script (just open in your browser)
- as a Workbench module

Add this module to workbench via the "Import module..."
option. Paste the URL of this GitHub repository.

## Building

The frontend component of this module uses webpack. To build
the module for development, run:

    npm run build

This will build the static HTML file to `dist/index.html`.

To build for production/Workbench, run:

    npm run build-prod

This will update the root `autoscrape-extractor.html` file
and will be picked up by Workbench if you are running
Workbench's `./bin/dev develop-module autoscrape-extractor-workbench`
tool.

## Design Overview

This is a basic layout of the extractor hierarchy. It consists of the following layers:
1. On the left we have the extractor modules which control the parameters and dispatches the extractor Python code.
2. To the right of this, we have the first, upper level extractor iFrame. This consists of a control header for generating extractor templates and selecting HTML documents and ending/clearing extraction. This iFrame controls a sandboxed child iFrame for displaying HTML documents that users want to extract data from. The extractor iFrame sets event handlers on nodes inside the document iFrame, injects selector CSS styles.
3. The lowest level iFrame is sandboxed, so no JS will run inside of it, but CSS styles will be loaded if they're present.


    +--------------------------------+
    |            WORKBENCH           |   ^ Workbench listens for template
    +---------+----------------------+ D |
    | Scraper |   Extractor iFrame   | A | Sends template up to workbench
    | Module  |      (header)        | T | Extractor template building
    |         |                      | A | Element tracking, LCA finding
    |---------+----------------------+   |
    |Extractor| HTML Document iFrame | F | Renders CSS
    | Module  |                      | L | Element events
    |         |                      | O |   click, hover
    |         |                      | W |
    |         |                      |   | Data Flows Upwards
    +---------+----------------------+

The control flow for extraction of data works like this:

1. Some HTML documents have been fetched using the upper level scraper module. This
   contains standard "url" and "html" columns.
2. The extractor Python module parses these columns, JSONifies them, and passes them to the
   extractor iFrame.
3. The extractor iFrame reads the first HTML document and loads it into a
   sandboxed HTML document iFrame. It also sets event handlers on elements inside of this iFrame
   and injects selection CSS styles. No JS runs inside of the sandboxed
   document iFrame. Instead, the upper level iFrame controls the lower level one.
4. When the user selects an element to extract, the extractor JavaScript code
   finds the lowest common ancestor (LCA) of this element (and any others selected).
   The lowest common ancestor is visually marked in the child iFrame DOM, as are the
   individually selected records.
5. When the user has selected all records, they click the "complete" button in the
   extractor iFrame header. This takes the LCA and selected elements, passes them to a
   extractor generator function. The output of this function is a usable
   extractor template.
6. The extractor iFrame then dispatches a `postMessage` instructing Workbench
   to update the `template` parameter of the module.
7. The extractor Python module gets the updated params, sees the template, and
   applies this template to all HTML documents. The output table is rendered.
8. At the same time, the extractor JavaScript sees the template parameter is
   filled and requests the iFrame to be completely hidden, allowing room for
   the table.

## Code Layout

The code is laid out in the following manner:

    .
    ├── src
    │   ├── js
    │   │   ├── api.js . . . . . . . Workbench messaging (set param, resize)
    │   │   ├── html2hext.js . . . . HTML to Hext extractor building
    │   │   ├── hextHighlighting.js  Hext-specific matching highlighting
    │   │   ├── loaders.js . . . . . Code for loading/outputting ZIP files
    │   │   ├── lca.js . . . . . . . Lowest Common Ancestor from DOM elements
    │   │   ├── index.js . . . . . . Entry point, UI code
    │   │   └── constants.js . . . . HTML selectors, injectable CSS
    │   ├── css
    │   │   └── style.css  . . . . . Style for extractor iFrame (header)
    │   └── html
    │       └── index.html . . . . . HTML base template for extractor iFrame
    ├── dist
    │   ├── index.html . . . . . . . Development-compiled HTML output
    │   └── main.js  . . . . . . . . Bundled JS payload, copied into above
    ├── autoscrape-extractor.py  . . Extractor module Python code
    ├── autoscrape-extractor.json  . Extractor configuration
    └── autoscrape-extractor.html  . Bundled extractor JavaScript (don't edit!)
