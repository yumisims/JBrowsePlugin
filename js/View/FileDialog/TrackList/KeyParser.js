define([
           'dojo/_base/declare',
           'dojo/_base/array',
           'dojo/_base/lang',
           'dojo/json'
       ],
       function(
           declare,
           array,
           lang,
           JSON
       ) {

return declare( null, {

    constructor: function( args ) {
        lang.mixin( this, {
            featureCallback:   args.featureCallback || function() {},
            endCallback : args.endCallback || function() {},
          
            // if this is true, the parser ignores the
            // rest of the lines in the file.  currently
            // set when the file switches over to FASTA
            eof: false
        }); 
    },

    addLine: function( line ) {
        var match;
        if( this.eof ) {
            // do nothing
        } else if( /^\s*[^#\s>]/.test(line) ) { //< feature line, most common case
            var f = CN.parse_feature( line );
            // console.log(this.browser);
            this._buffer_feature( [f] );
        }
        // directive or comment
        else if(( match = /^\s*(\#+)(.*)/.exec( line ) )) {
           
        }
        else if( /^\s*$/.test( line ) ) {
            // blank line, do nothing
        }
        else if( /^\s*>/.test(line) ) {
            // implicit beginning of a FASTA section.  just stop
            // parsing, since we don't currently handle sequences
            this._return_all_under_construction_features();
            this.eof = true;
        }
        else { // it's a parse error
            line = line.replace( /\r?\n?$/g, '' );
            throw "SimpleCMAP parse error.  Cannot parse '"+line+"'.";
        }
    },

    _buffer_feature: function( feature_line ) {
        this.featureCallback(feature_line);
    },

    finish : function()
    {
        this.endCallback();
    }
});
});