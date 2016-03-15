define(['dojo/_base/declare',
        'dojo/_base/array',
        'dojo/dom-construct',
        'JBrowse/Util',
        'dijit/form/TextBox',
        'dijit/form/Select',
        'dijit/form/Button',
        'JBrowse/View/TrackConfigEditor'
       ],
       function(
           declare,
           array,
           dom,
           Util,
           TextBox,
           Select,
           Button,
           TrackConfigEditor
       ) {

var uniqCounter = 0;

return declare( null, {

constructor: function( args ) {
    this.browser = args.browser;
    this.fileDialog = args.fileDialog;
    this.domNode = dom.create('div', { className: 'trackList', innerHTML: 'track list!' });
    this.storeConfs = {};
    this.trackConfs = {};
    this.referenceStoreConf = {};
    this.queryStoreConf = {};
    this.smapStoreConf = {};
    this.cnStoreConf = {};

    this._updateDisplay();
},


getTrackConfigurations: function() {
    return Util.dojof.values( this.trackConfs || {} );
},

setKeyFile : function(resource)
{
    this.referenceNames = this.referenceNames || {};
    var keyDriver = this.fileDialog.getKeyDriver();
    keyDriver.getReferenceNames(this.referenceNames,resource);
},

updateReferenceTrack : function(resource)
{
    this.storeConfs = this.storeConfs || {};
    var rcmapDriver = this.fileDialog.getRCMAPDriver();
    rcmapDriver.tryResource(this.storeConfs,resource);
    this._makeTrackConfs();
    this._updateDisplay();
},

updateSMAPTrack : function(resource)
{
    this.storeConfs = this.storeConfs || {};
    var smapDriver = this.fileDialog.getSMAPDriver();
    smapDriver.tryResource(this.storeConfs,resource);
    this._makeTrackConfs();
    this._updateDisplay();
},

updateCNTrack : function(resource)
{
    this.storeConfs = this.storeConfs || {};
    var cnDriver = this.fileDialog.getCNDriver();
    cnDriver.tryResource(this.storeConfs,resource);
    this._makeTrackConfs();
    this._updateDisplay();
},

update: function( resources) {
    
    this._makeStoreConfs( resources );

    // make some track configurations from the store configurations
    this._makeTrackConfs();

    this._updateDisplay();
},

_makeStoreConfs: function( resources ) {
    // when called, rebuild the store and track configurations that we are going to add
    this.storeConfs = this.storeConfs || {};

    var xmapDriver = this.fileDialog.getXMAPDriver();

    xmapDriver.tryResource(this.storeConfs, resources);



    // // anneal the given resources into a set of data store
    // // configurations by offering each file to each type driver in
    // // turn until no more are being accepted
    // var lastLength = 0;
    // while( resources.length && resources.length != lastLength ) {
    //     resources = array.filter( resources, function( resource ) {
    //         return ! array.some( typeDrivers, function( typeDriver ) {
    //            return typeDriver.tryResource( this.storeConfs, resource );
    //         },this);
    //     },this);

    //     lastLength = resources.length;
    // }

    // array.forEach( typeDrivers, function( typeDriver ) {
    //     typeDriver.finalizeConfiguration( this.storeConfs );
    // },this);

    if( resources.length )
        console.warn( "Not all resources could be assigned to tracks.  Unused resources:", resources );
},

_makeTrackConfs: function() {
    // object that maps store type -> default track type to use for the store
    var typeMap = this.browser.getTrackTypes().trackTypeDefaults;

    // find any store configurations that appear to be coverage stores
    var coverageStores = {};
    for( var n in this.storeConfs ) {
        if( this.storeConfs[n].fileBasename ) {
            var baseBase = this.storeConfs[n].fileBasename.replace(/\.(coverage|density|histograms?)$/,'');
            if( baseBase != this.storeConfs[n].fileBasename ) {
                coverageStores[baseBase] = { store: this.storeConfs[n], name: n, used: false };
            }
        }
    }

    // make track configurations for each store configuration
    for( var n in this.storeConfs ) {
        var store = this.storeConfs[n];
        if(!store.rendered)
        {
            store.rendered = true;
        }
        else
        {
            continue;
        }
        // var trackType = typeMap[store.type] || 'JBrowse/View/Track/HTMLFeatures';

        var trackType = 'BioNanoGenomics/View/Track/BioNanoHTMLFeatures';

        this.trackConfs = this.trackConfs || {};
        store.referenceNames = this.referenceNames;
        this.trackConfs[ n ] =  {
            store: this.storeConfs[n],
            label: n,
            key: n.replace(/_\d+$/,'').replace(/_/g,' '),
            type: this.storeConfs[n].trackType || trackType,
            displayMode: this.storeConfs[n].displayMode,
            category: "BioNanoGenomics tracks/",
            style : {
                
                className : this.storeConfs[n].style.className, //If we just need a line, we can use transcript.
                subfeatureClasses : this.storeConfs[n].style.subfeatureClasses

            },
            menuTemplate : this.storeConfs[n].menuTemplate,
            rendered : false,
            // onClick : this.storeConfs[n].onClick,
            autoscale: "local" // make locally-opened BigWig tracks default to local autoscaling
        };
        if(!this.trackConfs[n].style.subfeatureClasses)
        {
             this.trackConfs[n].style.subfeatureClasses = {
                    "Label":"bionanoLabels"
                }
        }

        // if we appear to have a coverage store for this one, use it
        // and mark it to have its track removed after all the tracks are made
        var cov = coverageStores[ store.fileBasename ];
        if( cov ) {
            this.trackConfs[n].histograms = {
                store: cov.store,
                description: cov.store.fileBasename
            };
            cov.used = true;
        }
    }

    // delete the separate track confs for any of the stores that were
    // incorporated into other tracks as histograms
    for( var n in coverageStores ) {
        if( coverageStores[n].used )
            delete this.trackConfs[ coverageStores[n].name ];
    }
},

_delete: function( trackname ) {
    delete (this.trackConfs||{})[trackname];
    this._updateDisplay();
},

_updateDisplay: function() {
    var that = this;

    // clear it
    dom.empty( this.domNode );

    dom.create('h3', { innerHTML: 'New Tracks' }, this.domNode );

    if( ! Util.dojof.keys( this.trackConfs||{} ).length ) {
        dom.create('div', { className: 'emptyMessage',
                            innerHTML: 'None'
                          },this.domNode);
    } else {
        var table = dom.create('div', { innerHTML: ''}, this.domNode );

        var trackTypes = this.browser.getTrackTypes();

        for( var n in this.trackConfs ) {
            var t = this.trackConfs[n];
            var r = dom.create('div', {className:"trackName"}, table );
            
            var trackName =t.store.trackName;
            dom.create('label', { innerHTML: trackName }, r ),
            new TextBox({
                value: t.key,
                onChange: (function(t) { 
                    return function() {
                        t.key = this.get('value'); 
                    };
                }(t))
            }).placeAt( dom.create('div',{ className: 'trackListNames' }, r ) );

            dom.create('div',{ className: 'type' }, r );
        }
    }
}

});
});

