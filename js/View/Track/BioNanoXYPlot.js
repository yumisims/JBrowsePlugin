define( [
            'dojo/_base/declare', 
            'dojo/_base/array',
            'JBrowse/View/Track/Wiggle/XYPlot'
        ],
        function( declare,array,XYPlot ) {

var BioNanoXYPlot = declare( [XYPlot],

/**
 * Extended Wiggle XY Plot track to move the tooltip little down.
 *
 * @lends BioNanoGenomics/View/Track/BioNanoXYPlot
 * @extends JBrowse.View.Track.Wiggle.XYPlot
 */
{
    mouseover: function( bpX, evt ) {
       
        if( bpX === undefined ) {
            var thisB = this;
            //this._scoreDisplayHideTimeout = window.setTimeout( function() {
                thisB.scoreDisplay.flag.style.display = 'none';
                thisB.scoreDisplay.pole.style.display = 'none';
            //}, 1000 );
        }
        else {
            var block;
            array.some(this.blocks, function(b) {
                           if( b && b.startBase <= bpX && b.endBase >= bpX ) {
                               block = b;
                               return true;
                           }
                           return false;
                       });

            if( !( block && block.canvas && block.pixelScores && evt ) )
                return;

            var pixelValues = block.pixelScores;
            var canvas = block.canvas;
            var cPos = dojo.position( canvas );
            var x = evt.pageX;
            var cx = evt.pageX - cPos.x;

            if( this._showPixelValue( this.scoreDisplay.flag, pixelValues[ Math.round( cx ) ] ) ) {
                this.scoreDisplay.flag.style.display = 'block';
                this.scoreDisplay.pole.style.display = 'block';

                this.scoreDisplay.flag.style.left = evt.clientX+'px';
                this.scoreDisplay.flag.style.top  = (cPos.y+25)+'px';
                this.scoreDisplay.pole.style.left = evt.clientX+'px';
                this.scoreDisplay.pole.style.height = cPos.h+'px';
            }
        }
    },

});

return BioNanoXYPlot;
});
