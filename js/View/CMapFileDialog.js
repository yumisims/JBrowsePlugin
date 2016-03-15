define( [
            'dojo/_base/declare',
            'dojo/_base/array',
            'dojo/aspect',
            'dijit/focus',
            'dijit/form/Button',
            'dijit/form/RadioButton',
            'dojo/dom-construct',
            'dijit/Dialog',

            'dojox/form/Uploader',
            'dojox/form/uploader/plugins/IFrame',

            './FileDialog/TrackList/CMAPDriver',
            './FileDialog/CMapResourceList',
            './FileDialog/CMapTrackList'

        ],
        function(
            declare,
            array,
            aspect,
            dijitFocus,
            Button,
            RadioButton,
            dom,
            Dialog,

            Uploaded,
            IFramePlugin,

            CMAPDriver,
            ResourceList,
            TrackList
        ) {

return declare( null, {

    constructor: function( args ) {
        this.browser = args.browser;
        this.config = dojo.clone( args.config || {} );
        this.browserSupports = {
            dnd: 'draggable' in document.createElement('span')
        };

        this._fileTypeDrivers = [ new CMAPDriver() ];
    },

    addFileTypeDriver: function( d ) {
        this._fileTypeDrivers.unshift( d );
    },
    getFileTypeDrivers: function() {
        return this._fileTypeDrivers.slice();
    },

    _makeActionBar: function( openCallback, cancelCallback ) {
        var actionBar = dom.create(
            'div', {
                className: 'dijitDialogPaneActionBar'
            });

        var disChoices = this.trackDispositionChoice = [
            new RadioButton({ id: 'openImmediately',
                              value: 'openImmediately',
                              checked: true
                            }),
            new RadioButton({ id: 'addToTrackList',
                              value: 'addToTrackList'
                            })
        ];

        var aux = dom.create('div',{className:'aux'},actionBar);
        disChoices[0].placeAt(aux);
        dom.create('label', { "for": 'openImmediately', innerHTML: 'Open immediately' }, aux ),
        disChoices[1].placeAt(aux);
        dom.create('label', { "for": 'addToTrackList', innerHTML: 'Add to tracks' }, aux );


        new Button({ iconClass: 'dijitIconDelete', label: 'Cancel',
                     onClick: dojo.hitch( this, function() {
                                              cancelCallback && cancelCallback();
                                              this.dialog.hide();
                                          })
                   })
            .placeAt( actionBar );
        new Button({ iconClass: 'dijitIconFolderOpen',
                     label: 'Add Track',
                     onClick: dojo.hitch( this, function() {
                         openCallback && openCallback({
                             trackConfs: this.trackList.getTrackConfigurations(),
                             trackDisposition: this.trackDispositionChoice[0].checked ? this.trackDispositionChoice[0].value :
                                               this.trackDispositionChoice[1].checked ? this.trackDispositionChoice[1].value :
                                                                                        undefined
                         });
                         this.dialog.hide();
                     })
                   })
            .placeAt( actionBar );

        return { domNode: actionBar };
    },

    show: function( args ) {
        var dialog = this.dialog = new Dialog(
            { title: "Upload BioNanoGenomics Map file", className: 'bionanoFileDialog' }
            );

        var localFilesControl   = this._makeLocalFilesControl();
        var resourceListControl = this._makeResourceListControl();
        var trackListControl    = this._makeTrackListControl();
        var actionBar           = this._makeActionBar( args.openCallback, args.cancelCallback );

        // connect the local files control to the resource list
        dojo.connect( localFilesControl.uploader, 'onChange', function() {
            resourceListControl.addLocalFiles( localFilesControl.uploader._files );
        });

         // connect the resource list to the track list
        dojo.connect( resourceListControl, 'onChange', function( resources ) {
            trackListControl.update( resources );
        });
      

        var div = function( attr, children ) {
            var d = dom.create('div', attr );
            array.forEach( children, dojo.hitch( d, 'appendChild' ));
            return d;
        };
        var content = [
                dom.create( 'div', { className: 'intro', innerHTML: 'Upload BioNano Map file to the server to get the track.' } ),
                div({className:'bionanoResourceControls'},[localFilesControl.domNode]),
                resourceListControl.domNode,
                trackListControl.domNode,
                actionBar.domNode
        ];
        dialog.set( 'content', content );
        dialog.show();

        aspect.after( dialog, 'hide', dojo.hitch( this, function() {
                              dijitFocus.curNode && dijitFocus.curNode.blur();
                              setTimeout( function() { dialog.destroyRecursive(); }, 500 );
                      }));
    },

    _makeLocalFilesControl: function() {
        var container = dom.create('div', { className: 'bionanoLocalFilesControl' });

        dom.create('h3', { innerHTML: 'Local files' }, container );

        var dragArea = dom.create('div', { className: 'dragArea' }, container );

        var fileBox = new dojox.form.Uploader({
            multiple: true
        });
        fileBox.placeAt( dragArea );

        if( this.browserSupports.dnd ) {
            // let the uploader process any files dragged into the dialog
            fileBox.addDropTarget( this.dialog.domNode );

            // add a message saying you can drag files in
            dom.create(
                'div', {
                    className: 'dragMessage',
                    innerHTML: 'Select or drag files here.'
                }, dragArea
            );
        }

        // little elements used to show pipeline-like connections between the controls
        dom.create( 'div', { className: 'connector', innerHTML: '&nbsp;'}, container );

        return { domNode: container, uploader: fileBox };
    },

     _makeResourceListControl: function () {
        var rl = new ResourceList({ dialog: this });
        return rl;
    },
    _makeTrackListControl: function() {
        var tl = new TrackList({ browser: this.browser.browser, fileDialog: this });
        this.trackList = tl;
        return tl;
    }
});
});
