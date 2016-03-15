define([
           'dojo/_base/declare',
           'JBrowse/Util',
           'JBrowse/Model/FileBlob',
           'JBrowse/Model/XHRBlob'
       ],
       function( declare, Util, FileBlob, XHRBlob ) {
var uniqCounter = 0;
return declare( null, {

    storeType: 'BioNanoGenomics/Store/SeqFeature/SMAP',

    tryResource: function( configs, resource ) {
        if( resource.type == 'smap' ) {
            var basename = Util.basename(
                resource.file ? resource.file.name :
                resource.url  ? resource.url       :
                                '',
                ['.smap']
            );
            if( !basename )
                return false;

            
             var smapName = basename+"_SMAP_";
            configs[smapName] = {
                trackName : "SMAP",
                type : 'BioNanoGenomics/Store/SeqFeature/SMAP', //This does not need to be part of xmap.
                displayMode : 'normal',
                style : {
                    className : 'bionanoSMAPFeatures',
                    subfeatureClasses: {
                      "inversion":"inversion",
                      "inversion_paired" : "inversion_paired",
                      "inversion_partial": "inversion_partial",
                      "insertion" : "insertion",
                      "deletion"  : "deletion",
                      "translocation_interchr" : "translocation_interchr",
                      "translocation_intrachr" : "translocation_intrachr"
                    }
                },
                fileBasename : basename,
                blob : this._makeBlob(resource),
                name : smapName,
                rendered : false
                // onClick: {
                //     "label": "Feature name {name}\nFeature start {start}\nFeature end {end}",
                //     "title" : "{name} {type}",
                //     "action": "defaultDialog"
                // }
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
