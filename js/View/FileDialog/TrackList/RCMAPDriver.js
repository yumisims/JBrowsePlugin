define([
           'dojo/_base/declare',
           'JBrowse/Util',
           'JBrowse/Model/FileBlob',
           'JBrowse/Model/XHRBlob'
       ],
       function( declare, Util, FileBlob, XHRBlob ) {
var uniqCounter = 0;
return declare( null, {
    storeType: 'BioNanoGenomics/Store/SeqFeature/RCMAP',

    tryResource: function( configs, resource ) {
        if( resource.type == 'cmap' ) {
            var basename = Util.basename(
                resource.file ? resource.file.name :
                resource.url  ? resource.url       :
                                '',
                ['r.cmap']
            );
            if( !basename )
                return false;

             var counter = uniqCounter++;
            var refName = basename+'_Ref_'+counter;
            configs[refName] = {
                trackName : "Reference Map",
                type : this.storeType,
                displayMode : 'collapsed',
                style: {
                    className : 'bionanoRefFeatures',
                    subfeatureClasses: {                    
                      "1" : "bionanoLabelChannel_1",
                      "2"  : "bionanoLabelChannel_2"                      
                    }
                },
                fileBasename : basename, 
                name : refName,
                blob : this._makeBlob(resource),
                rendered : false
            };
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
