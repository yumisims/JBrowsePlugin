/** One Driver file to load all the track information */
define([
           'dojo/_base/declare',
           'JBrowse/Util',
           'JBrowse/Model/FileBlob',
           'JBrowse/Model/XHRBlob',
           'plugins/BioNanoGenomics/js/JSZip/jszip.js'
       ],
       function( declare, Util, FileBlob, XHRBlob,JSZip ) {
var uniqCounter = 0;
return declare( null, {

    storeType: 'BioNanoGenomics/Store/SeqFeature/XMAP',
    moleculeBlob : undefined,
  

    viewMolecule : function( evt ){
        var browser = this.track.store.browser;

        // console.log("Loading the molecules for " + this.feature.get('name'));
        var basename = "Assemble Molecules/exp_refineFinal1_contig";
        browser.refSeqSelectBox.on("change",function() {
            // console.log("REFERENCE SEQUENCE CHANGED");
            browser.publish( '/jbrowse/v1/v/tracks/delete', [{label: basename+" MoleculeTrack"}] );
                   
        });
        var xmapName = this.feature.get('name')+".xmap";
        var qcMapName = this.feature.get('name')+"_q.cmap";
        var feature = this.feature;
        // console.log("XMAP Name "+xmapName);
        // console.log("QC MAP Name "+qcMapName);
        var contigId = this.feature.get("name");
        var reader = new FileReader();
        var f = this.track.store.getMolecule().file;
       
        // Closure to capture the file information.
        reader.onload = (function(theFile) {
        return function(e) {
         
          try {
            var zip = new JSZip(e.target.result);
            for(var file in zip.files){
                basename = file.substring(0,file.indexOf("/"))+"/exp_refineFinal1_contig";
                console.log(basename);
                break;
            }
            
            // console.log(zip.file(xmapName).asText());
            xmapText = zip.file(basename+xmapName).asText();
            qcMapText = zip.file(basename+qcMapName).asText();
            //Parse XMAP and QC Map and create additional Track.
            var MoleculeStore = "MoleculeStore"+contigId;
            browser.getStore(MoleculeStore,function(store)
            {
              
                 
                    browser.publish( '/jbrowse/v1/v/tracks/delete', [{label: basename+" MoleculeTrack"}] );
                    // store.clearFeatures();
                    // store.addFeatures(xmapText,qcMapText,feature);
                    // store.notifyChanged();
                // }
                if(store==null)
                {
                   moleculeStoreConf = {
                        type: 'BioNanoGenomics/Store/SeqFeature/Molecule',
                        displayMode : 'normal',
                        style :{
                            showLabels : false,
                            className : 'bionanoMoleculeFeatures',
                            subfeatureClasses: {                      
                              "1" : "bionanoLabelChannel_1",
                              "2"  : "bionanoLabelChannel_2"   
                            }
                        },
                        fileBasename: basename,
                        xmap : xmapText,
                        queryFeature : feature.data,
                        qcmap : qcMapText,
                        name: MoleculeStore
                    };
                     browser.addStoreConfig( moleculeStoreConf.name, moleculeStoreConf );
                }
                else
                {
                    moleculeStoreConf = store;
                     moleculeStoreConf.style = {
                            showLabels : false,
                            className : 'bionanoMoleculeFeatures',
                            subfeatureClasses: {                      
                              "1" : "bionanoLabelChannel_1",
                              "2"  : "bionanoLabelChannel_2"   
                            }
                        };
                }
                var label = basename+" MoleculeTrack"; 
                moleculeTrackConf =  {
                    store: moleculeStoreConf.name,
                    label: label,
                    maxHeight : 10000,
                    key: label.replace(/_\d+$/,'').replace(/_/g,' '),
                    type: 'BioNanoGenomics/View/Track/BioNanoHTMLFeatures',
                    displayMode: moleculeStoreConf.displayMode,
                    category: "BioNanoGenomics tracks/",
                    style : {                    
                        className : moleculeStoreConf.style.className, //If we just need a line, we can use transcript.
                        subfeatureClasses : moleculeStoreConf.style.subfeatureClasses,
                        showLabels : moleculeStoreConf.style.showLabels
                    },
                    // onClick : this.storeConfs[n].onClick,
                    autoscale: "local" // make locally-opened BigWig tracks default to local autoscaling
                };
                browser.publish( '/jbrowse/v1/v/tracks/new',  [moleculeTrackConf]  );
               
                browser.publish( '/jbrowse/v1/v/tracks/show', [moleculeTrackConf] );
            });
            
            } catch(e) {
            console.log("Error happened");
            console.log(e);
          }
        }
      })(f);       
        
        reader.readAsArrayBuffer(f);
    },

    tryResource: function( configs, resources ) {
        var resource = resources.xmap;
        var rcmap = resources.rcmap;
        var qcmap = resources.qcmap;
        var smap  = resources.smap;
        var cn = resources.cn;
        var molecule = resources.molecule;
        if( resource.type == 'xmap' ) {
            var basename = Util.basename(
                resource.file ? resource.file.name :
                resource.url  ? resource.url       :
                                '',
                ['.xmap']
            );
            if( !basename )
                return false;
            var queryName = basename+'_Query';
            var existingsmap;
            var existingmol;
            if(configs[queryName])
            {
                existingsmap = configs[queryName].smap;
                existingmol = configs[queryName].molecule;
            }
            
            configs[queryName] = {
                trackName : "Query Map",
                type: this.storeType,
                displayMode : 'collapsed',
                style :{
                    className : 'bionanoQueryFeatures',
                    subfeatureClasses: {
                      // "inversion":"bionanoInversion",
                      // "inversion_paired" : "bionanoInversionPaired",
                      // "inversion_partial": "bionanoInversionPartial",
                      "insertion" : "bionanoInsertion",
                      "deletion"  : "bionanoDeletion",
                       "1" : "bionanoLabelChannel_1",
                      "2"  : "bionanoLabelChannel_2"   
                      // "translocation_interchr" : "bionanoTransLocationInterChromosome",
                      // "translocation_intrachr" : "bionanoTransLocationIntraChromosome"
                    }
                },
                fileBasename: basename,
                xblob: this._makeBlob( resource ),
                name: queryName,
                rendered : false,
                //molecule : molecule,
                rcblob : this._makeBlob(rcmap),
                //smapblob : this._makeBlob(smap),
               
                qcblob : this._makeBlob(qcmap)
            };
            if(smap)
            {
                configs[queryName].smapblob = this._makeBlob(smap);
            }
            if(molecule)
            {
                configs[queryName].molecule = molecule;
                configs[queryName].menuTemplate = [
                    {
                      label : "View Molecules",
                      iconClass : "dijitIconDatabase",
                      action: this.viewMolecule,
                    }
                ];
            }
            if(existingsmap)
                configs[queryName].smapblob = existingsmap;
            if(existingmol)
                configs[queryName].molecule = existingmol;
            return true;
        }
        else
            return false;
    },

    // try to merge any singleton BAM and BAI stores.  currently can only do this if there is one of each
    finalizeConfiguration: function( configs ) {
    },

    _makeBlob: function( resource ) {
        var r = resource.file ? new FileBlob( resource.file ) :
                resource.url  ? new XHRBlob( resource.url )   :
                                null;
        if( ! r )
            throw 'unknown resource type';
        return r;

    },

    confIsValid: function( conf ) {
        return conf.blob || conf.urlTemplate;
    }
});
});
