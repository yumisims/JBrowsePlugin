/**
 * This is the File dialog to load the different bio nano files.
 *
 */
define( [
            'dojo/_base/declare',
            'dojo/_base/array',
            'dojo/_base/window',
            'dojo/aspect',
            'dijit/focus',
            'dijit/form/Button',
            'dijit/form/RadioButton',
            'dojo/dom-construct',
            'dijit/Dialog',

            'dojox/form/Uploader',
            'dojox/form/uploader/plugins/IFrame',

            './FileDialog/TrackList/CMAPDriver',
            './FileDialog/TrackList/XMAPDriver',
            './FileDialog/TrackList/SMAPDriver',
            './FileDialog/TrackList/CNDriver',
            './FileDialog/TrackList/RCMAPDriver',
            './FileDialog/TrackList/KeyDriver',
            './FileDialog/ResourceList',
            './FileDialog/TrackList'

        ],
        function(
            declare,
            array,
            window,
            aspect,
            dijitFocus,
            Button,
            RadioButton,
            dom,
            Dialog,

            Uploaded,
            IFramePlugin,

            CMAPDriver,
            XMAPDriver,
            SMAPDriver,
            CNDriver,
            RCMAPDriver,
            KeyDriver,
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

        this._xmapDriver = new XMAPDriver();
        this._rcmapDriver= new RCMAPDriver();
        this._cmapDriver = new CMAPDriver();
        this._smapDriver = new SMAPDriver();
        this._cnDriver   = new CNDriver();
        this._keyDriver  = new KeyDriver();

        this._fileTypeDrivers = [ new CMAPDriver(), new RCMAPDriver(), new XMAPDriver(), new SMAPDriver(), new CNDriver() ];
        dom.place('<div data-dojo-type="dojox/widget/Toaster" data-dojo-props="positionDirection:\'br-left\'" id="first_toaster"></div>',window.body());
       
    },

    getKeyDriver : function()
    {
        return this._keyDriver;
    },

    getRCMAPDriver : function()
    {
        return this._rcmapDriver;
    },

    getCNDriver : function() {
        return this._cnDriver;
    },

    getSMAPDriver : function()
    {
        return this._smapDriver;
    },

    getXMAPDriver : function()
    {
        return this._xmapDriver;
    },

    getCMAPDriver : function()
    {
        return this._cmapDriver;
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
            { title: "Upload BioNanoGenomics files", className: 'bionanoFileDialog' }
            );

        var fileUploadSection   = this._makeNewFilesControl();
        var local = this;

        var localFilesControl   = this._makeLocalFilesControl();
        var resourceListControl = this._makeResourceListControl();
        var trackListControl    = this._makeTrackListControl();
        var actionBar           = this._makeActionBar( args.openCallback, args.cancelCallback );

        dojo.connect(fileUploadSection.keyUploader, 'onChange',function(){
            fileUploadSection.keyList.setResource(fileUploadSection.keyUploader._files);
            trackListControl.setKeyFile(fileUploadSection.keyList.getResource());
        });

        dojo.connect(fileUploadSection.xmapUploader, 'onChange',function(){
            fileUploadSection.xmapRList.setResource(fileUploadSection.xmapUploader._files);
            local._allFilesChosen(fileUploadSection,trackListControl);
        });
        dojo.connect(fileUploadSection.cmapUploader, 'onChange',function(){
            fileUploadSection.cmapRList.setResource(fileUploadSection.cmapUploader._files);
            local._allFilesChosen(fileUploadSection,trackListControl);
            trackListControl.updateReferenceTrack(fileUploadSection.cmapRList.getResource());
        });
        dojo.connect(fileUploadSection.qcmapUploader,'onChange',function(){
            fileUploadSection.qcmapRList.setResource(fileUploadSection.qcmapUploader._files);
            local._allFilesChosen(fileUploadSection,trackListControl);
        });
        dojo.connect(fileUploadSection.smapUploader,'onChange',function(){
            fileUploadSection.smapRList.setResource(fileUploadSection.smapUploader._files);
            local._allFilesChosen(fileUploadSection,trackListControl);
            trackListControl.updateSMAPTrack(fileUploadSection.smapRList.getResource());
        });
        dojo.connect(fileUploadSection.moleculeUploader,'onChange',function(){
            fileUploadSection.moleculeRList.setResource(fileUploadSection.moleculeUploader._files);
            local._allFilesChosen(fileUploadSection,trackListControl);
        });
        dojo.connect(fileUploadSection.cnUploader,'onChange',function(){
            fileUploadSection.cnRList.setResource(fileUploadSection.cnUploader._files);
            // local._allFilesChosen(fileUploadSection,trackListControl);
            trackListControl.updateCNTrack(fileUploadSection.cnRList.getResource());
        });


        // connect the local files control to the resource list
        //TODO Not used.
        // dojo.connect( localFilesControl.uploader, 'onChange', function() {
        //     resourceListControl.addLocalFiles( localFilesControl.uploader._files );
        // });

         // connect the resource list to the track list
         //Not used
        // dojo.connect( resourceListControl, 'onChange', function( resources ) {
        //     trackListControl.update( resources );
        // });
      

        var div = function( attr, children ) {
            var d = dom.create('div', attr );
            array.forEach( children, dojo.hitch( d, 'appendChild' ));
            return d;
        };
        var content = [
                dom.create( 'div', { className: 'intro', innerHTML: 'Upload BioNano Map file to the server to get the track.' } ),
                div({className:'bionanoResourceControls'},[fileUploadSection.domNode]),
               // div({className:'bionanoResourceControls'},[localFilesControl.domNode]),
               // resourceListControl.domNode,
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

    _makeOnefileUploadControl : function()
    {
        var container = dom.create('div', {
            className : 'bionanoLocalFilesControl'
        });

        dom.create('h3', { innerHTML:'Select BioNano Files'},container);
        var xmapArea = dom.create('div', { className: 'xmapArea' }, container );

        var xmapFileBox = new dojox.form.Uploader({
            multiple: true
        });
        var childContainer1 =  dom.create('div', {
            className : 'jlt'
        },xmapArea);
        var rList = new OneResourceList({dialog:this});
        dojo.place(rList.domNode,childContainer1,'first');
        dojo.place(xmapFileBox.domNode,childContainer1,'last');

        return {
            domNode :  container, 
            xmapRList: rList,
            xmapUploader : xmapFileBox
        };
    },

    _allFilesChosen : function(fileUploadSection,trackListControl)
    {
        var xmap = fileUploadSection.xmapRList.getResource();
        var rcmap = fileUploadSection.cmapRList.getResource();
        var qcmap = fileUploadSection.qcmapRList.getResource();
        var smap = fileUploadSection.smapRList.getResource();
        var molecule = fileUploadSection.moleculeRList.getResource();
        // var cn = fileUploadSection.cnRList.getResource();
        var resources = { xmap : xmap,rcmap : rcmap, qcmap:qcmap,smap : smap,molecule:molecule};
        //, qcmap : qcmap, smap : smap, cn:cn };
        // trackListControl.update(resources);
        if(xmap && qcmap && rcmap)
        {
            console.log("All the files are selected");
            trackListControl.update(resources);
        }
        else
        {
            console.log("Missing files");
        }
    },

    _makeNewFilesControl : function()
    {
        var container = dom.create('div', {
            className : 'bionanoLocalFilesControl'
        });

        dom.create('h3', { innerHTML:"Select Key File (Key File is used to map JBrowse Reference Sequences to BioNano Sequences)"},container);
        var keyArea = dom.create('div', { className: 'xmapArea' }, container );

        var keyFileBox = new dojox.form.Uploader({
            multiple: false
        });
        var keyContainer =  dom.create('div', {
            className : 'jlt'
        },keyArea);
        var keyList = new ResourceList({dialog:this,type:'txt'});
        dojo.place(keyList.domNode,keyContainer,'first');
        dojo.place(keyFileBox.domNode,keyContainer,'last');

        dom.create('h3', { innerHTML:'Select XMAP File (Creates Query Track with .xmap and q.cmap files)'},container);
        var xmapArea = dom.create('div', { className: 'xmapArea' }, container );

        var xmapFileBox = new dojox.form.Uploader({
            multiple: false
        });
        var childContainer1 =  dom.create('div', {
            className : 'jlt'
        },xmapArea);
        var rList = new ResourceList({dialog:this,type:'xmap'});
        dojo.place(rList.domNode,childContainer1,'first');
        dojo.place(xmapFileBox.domNode,childContainer1,'last');

        dom.create('h3', { innerHTML:'Select Reference CMAP File (Creates the BioNano Reference Track with r.cmap file.)'},container);
        var cmapArea = dom.create('div', { className: 'xmapArea' }, container );

        var cmapFileBox = new dojox.form.Uploader({
            multiple: false
        });

        var childContainer2 =  dom.create('div', {
            className : 'jlt'
        },cmapArea);
        var rList2 = new ResourceList({dialog:this,type:'_r.cmap'});
        dojo.place(rList2.domNode,childContainer2,'first');
        dojo.place(cmapFileBox.domNode,childContainer2,'last');

        dom.create('h3', { innerHTML:'Select Query CMAP File (Creates Query Track with .xmap and q.cmap files)'},container);
        var qcmapArea = dom.create('div', { className: 'xmapArea' }, container );

        var qcmapFileBox = new dojox.form.Uploader({
            multiple: false
        });

        var childContainer3 =  dom.create('div', {
            className : 'jlt'
        },qcmapArea);
        var rList3 = new ResourceList({dialog:this,type:'_q.cmap'});
        dojo.place(rList3.domNode,childContainer3,'first');
        dojo.place(qcmapFileBox.domNode,childContainer3,'last');

        dom.create('h3', { innerHTML:'Select SMAP File (Creates BioNano SMAP Track)'},container);
        var smapArea = dom.create('div', { className: 'xmapArea' }, container );

        var smapFileBox = new dojox.form.Uploader({
            multiple: false
        });

        var childContainer4 =  dom.create('div', {
            className : 'jlt'
        },smapArea);
        var rList4 = new ResourceList({dialog:this,type:'smap'});
        dojo.place(rList4.domNode,childContainer4,'first');
        dojo.place(smapFileBox.domNode,childContainer4,'last');

        dom.create('h3', { innerHTML:'Select Zipped Molecules File (Used to create Molecule Track for Query)'},container);
        var moleculeArea = dom.create('div', { className: 'xmapArea' }, container );

        var moleculeFileBox = new dojox.form.Uploader({
            multiple: false
        });

        var childContainerX =  dom.create('div', {
            className : 'jlt'
        },moleculeArea);
        var rListX = new ResourceList({dialog:this,type:'zip'});
        dojo.place(rListX.domNode,childContainerX,'first');
        dojo.place(moleculeFileBox.domNode,childContainerX,'last');

        dom.create('h3', { innerHTML:'Select CN File (Creates Copy Number Track)'},container);
        var cnArea = dom.create('div', { className: 'xmapArea' }, container );

        var cnFileBox = new dojox.form.Uploader({
            multiple: false
        });

        var childContainer5 =  dom.create('div', {
            className : 'jlt'
        },cnArea);
        var rList5 = new ResourceList({dialog:this,type:'cn'});
        dojo.place(rList5.domNode,childContainer5,'first');
        dojo.place(cnFileBox.domNode,childContainer5,'last');

        return {
            domNode :  container, 
            xmapRList: rList, 
            cmapRList: rList2,
            qcmapRList : rList3,
            smapRList : rList4,
            moleculeRList : rListX,
            cnRList : rList5,
            keyList : keyList,

            xmapUploader : xmapFileBox, 
            cmapUploader : cmapFileBox,
            qcmapUploader : qcmapFileBox,
            smapUploader : smapFileBox,
            moleculeUploader : moleculeFileBox,
            cnUploader : cnFileBox,
            keyUploader : keyFileBox
        };
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
