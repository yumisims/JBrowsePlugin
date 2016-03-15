# JBrowse Plugin for BioNanoGenomics Data files

## Installation

1. Download the [BioNanoGenomics JBrowse Plugin](https://bionanogenomics.com/download/BioNanoGenomics.zip) plugin.
2. Unzip the downloaded plugin file in your JBrowse installation plugins directory. This will create a folder BioNanoGenomics folder. 
	```
		zip -r BioNanoGenomics.zip <jbrowse_installation>/plugins/
	```
3. Make sure the following folder exists,
	```
		<jbrowse_installation>/plugins/BioNanoGenomics
	```
4. Modify the jbrowse.conf to include the BioNanoGenomics plugin. Edit 
	```
		<jbrowse_installation>/jbrowse.conf file.
	```
5. Add 
	```
		[plugins.BioNanoGenomics]
		location=plugins/BioNanoGenomics
	```
6. Access JBrowse via a browser, File menu will have a new menu item
	```
		Add BioNanoGenomics Map file
	```