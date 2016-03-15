define([
           'dojo/_base/declare',
           'dojo/_base/array',
           'dojo/has',
           'JBrowse/Util/TextIterator'
       ],
       function( declare, array, has, TextIterator ) {
var ZipFileBlob = declare( null,
{
    constructor: function(b) {
        this.blob = b;
        this.size = b.size;
        this.totalSize = b.size;
        this.zipfile = new new JSZip(this.blob);
    },
    fetchLines: function(filename) {
        var thisB = this;
        this.fetch( function( data ) {
                        data = new Uint8Array(data);

                        var lineIterator = new TextIterator.FromBytes(
                            { bytes: data,
                              // only return a partial line at the end
                              // if we are not operating on a slice of
                              // the file
                              returnPartialRecord: !this.end
                            });
                        var line;
                        while(( line = lineIterator.getline() )) {
                                lineCallback( line );
                        }

                        endCallback();
             }, failCallback );
    },
    fetch: function( callback, failCallback ) {
        var that = this,
            reader = new FileReader();
        reader.onloadend = function(ev) {
            callback( that._stringToBuffer( reader.result ) );
        };
        reader.readAsBinaryString( this.blob );
    }

});
return ZipFileBlob;
});