compile:
	cp ./src/html/index.html ./autoscrape-extractor.html
	sed -i -e "27r ./src/js/index.js" ./autoscrape-extractor.html
	sed -i -e "27r ./src/js/lca.js" ./autoscrape-extractor.html
	sed -i -e "27r ./src/js/html2hext.js" ./autoscrape-extractor.html
	sed -i -e "27r ./src/js/globals.js" ./autoscrape-extractor.html
	sed -i -e "6r ./src/css/style.css" ./autoscrape-extractor.html

