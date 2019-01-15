# AutoScrape Extractor for Workbench

Add this module to workbench via the "Import module..."
option. Paste the URL of this GitHub repository.

Once you've followed the Hext builder UI instructions, copy
the Hext template to the template param in the module. It
will extract all the matching data, using your template, and
display the columns as a table.

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

