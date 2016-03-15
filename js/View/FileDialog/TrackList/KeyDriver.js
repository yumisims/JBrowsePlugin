define([
           'dojo/_base/declare',
           'dojo/_base/lang',
           'JBrowse/Util',
           'JBrowse/Model/FileBlob',
           'JBrowse/Model/XHRBlob',
           'dojo/_base/array'
       ],
       function( declare, lang, Util, FileBlob, XHRBlob,array) {
var uniqCounter = 0;
return declare( null, {

    getReferenceNames : function(refNames,resource)
    {
        if(resource.type == "txt")
        {
            var fail = lang.hitch( this, 'finish' );
            var blob = this._makeBlob(resource);
            var self = this;
            blob.fetchLines(
                function( line ) {
                    try {
                        self.addLine(refNames,line);
                    } catch(e) {
                        fail('Error parsing GFF3.');
                        throw e;
                    }
                },
                lang.hitch( self, 'finish' ),
                fail
            );
        }
    },   

    finish : function()
    {
        
    },

    addLine : function(refNames,line)
    {
        // console.log(line);
        var match;
        if( /^\s*[^#\s>]/.test(line) ) { //< feature line, most common case
            var f = array.map( line.split("\t"), function(a) {
                if( a == '.' ) {
                    return null;
                }
                return a;
            });
            // console.log(f);
            refNames[f[0]] = f[1];

        }
        // directive or comment
        else if(( match = /^\s*(\#+)(.*)/.exec( line ) )) {
            //do nothing for now.
        }
    },

    _makeBlob: function( resource ) {
        var r = resource.file ? new FileBlob( resource.file ) :
                resource.url  ? new XHRBlob( resource.url )   :
                                null;
        if( ! r )
            throw 'unknown resource type';
        return r;

    }
});
});
