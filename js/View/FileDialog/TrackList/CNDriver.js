define([
           'dojo/_base/declare',
           'JBrowse/Util',
           'JBrowse/Model/FileBlob',
           'JBrowse/Model/XHRBlob'
       ],
       function( declare, Util, FileBlob, XHRBlob ) {
var uniqCounter = 0;
return declare( null, {

    storeType: 'BioNanoGenomics/Store/SeqFeature/CN',

    tryResource: function( configs, resource ) {
        if( resource.type == 'cn' ) {
            var basename = Util.basename(
                resource.file ? resource.file.name :
                resource.url  ? resource.url       :
                                '',
                ['.cn']
            );
            if( !basename )
                return false;

             var cnName = basename+"_CN";
            configs[cnName] = {
                trackName :"Copy Number",
                type : 'BioNanoGenomics/Store/SeqFeature/CN', //This does not need to be part of xmap.
                displayMode : 'normal',
                // trackType : 'JBrowse/View/Track/Wiggle/XYPlot',
                trackType : 'BioNanoGenomics/View/Track/BioNanoXYPlot',
                style : {
                    className : 'bionanoCNFeatures',
                    // subfeatureClasses: {
                    //   // "inversion":"bionanoInversion",
                    //   // "inversion_paired" : "bionanoInversionPaired",
                    //   // "inversion_partial": "bionanoInversionPartial",
                    //   "insertion" : "bionanoInsertion",
                    //   "deletion"  : "bionanoDeletion"
                    //   // "translocation_interchr" : "bionanoTransLocationInterChromosome",
                    //   // "translocation_intrachr" : "bionanoTransLocationIntraChromosome"
                    // }
                },
                fileBasename : basename,
                blob : this._makeBlob(resource),
                name : cnName,
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
