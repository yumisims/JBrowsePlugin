define( ['dojo/_base/declare',
         'dojo/_base/array',
         'dojo/dom-construct',
         'dijit/form/Select',
         'dijit/registry',
         'dojo/parser'
        ],
        function( declare, array, dom, Select,registry,parser ) {

return declare( null, {

    constructor: function( args ) {
        this.dialog = args.dialog;
        this.domNode = dom.create( 'div', { className: 'resourceList' } );
        this.type = args.type;
        this._updateView();
        this.valid = false;
        this.resource = undefined;
        // this._errorDialog = new ConfirmDialog({
        //     title: "Invalid File",
        //     content: "Please select the file with extension "+this.type,
        //     style: "width: 300px"
        // });
        if(!registry.byId('first_toaster'))
            parser.parse();
    },

    getResource : function()
    {
        return this.resource;
    },

    setResource : function(resources)
    {
        var resource = resources[0];
        var type = this.getType(resource.name);
        if(this.guessType(resource.name) === this.type)
        {
            this.valid = true;
            this._updateView(resource);
            this.resource = {
                file : resource,
                type : type
            };
            if(registry.byId('first_toaster'))
                registry.byId('first_toaster').setContent('Successful. File with '+this.type+' extenstion selected', 'fatal');
            
        }
        else
        {
           // this._errorDialog.show();
            if(registry.byId('first_toaster'))
                registry.byId('first_toaster').setContent('Invalid File Selected. Please select file with extension '+this.type, 'error');
        }
        if(registry.byId('first_toaster'))
            registry.byId('first_toaster').show();
    },

    clearLocalFiles: function() {
        this._resources = array.filter( this._resources || [], function(res) {
            return ! res.file;
        });
        this._notifyChange();
    },

    _notifyChange: function() {
        this.onChange( array.map( this._resources || [], function( res ) {
            var r = {};
            if( res.file )
                r.file = res.file;
            if( res.url )
                r.url = res.url;
            r.type = res.type.get('value');
            return r;
        }));
    },

    _addResources: function( resources ) {
        var seenFile = {};
        var allRes = ( this._resources||[] ).concat( resources );
        this._resources = array.filter( allRes.reverse(), function( res ) {
            var key = res.file && res.file.name || res.url;
            if( seenFile[key] ) {
                return false;
            }
            seenFile[key] = true;
            return true;
        }).reverse();

        this._updateView();
        this._notifyChange();
    },

    addLocalFiles: function( fileList ) {
        this._addResources( array.map( fileList, function(file) {
            return { file: file };
        }));
    },

    clearURLs: function() {
        this._resources = array.filter( this._resources || [], function(res) {
            return ! res.url;
        });
        this._notifyChange();
    },
    addURLs: function( urls ) {
        this._addResources( array.map( urls, function(u) {
            return { url: u };
        }));
    },

    // old-style handler stub
    onChange: function() { },

    _updateView : function(resource)
    {
        var container = this.domNode;
        dom.empty( container );
        var filename = "";
        if(resource!==undefined)
            filename = resource.name;
        dom.create('h3',{innerHTML : "Filename : "+filename},container);
    },

    _updateView1: function() {
        var container = this.domNode;
        dom.empty( container );

        dom.create('h3', { innerHTML: 'Files and URLs' }, container );

        if( (this._resources||[]).length ) {
            var table = dom.create('table',{}, container );

            // render rows in the resource table for each resource in our
            // list
            array.forEach( this._resources, function( res, i){
               var that = this;
               var tr = dom.create('tr', {}, table );
               var name = res.url || res.file.name;

               // make a selector for the resource's type
               var typeSelect = new Select({
                    options: [
                        { label: '<span class="ghosted">file type?</span>', value: null     },
                        { label: "Reference CMAP",value: "cmap" },
                        { label: "XMAP",value: "xmap" }
                    ],
                    value: this.guessType( name ),
                    onChange: function() {
                        that._rememberedTypes = that._rememberedTypes||{};
                        that._rememberedTypes[name] = this.get('value');
                        that._notifyChange();
                    }
                });
                typeSelect.placeAt( dojo.create('td',{ width: '4%'},tr) );
                res.type = typeSelect;

                dojo.create( 'td', {
                  width: '1%',
                  innerHTML: '<div class="'+(res.file ? 'dijitIconFile' : 'jbrowseIconLink')+'"></div>'
                },tr);
                dojo.create('td',{ innerHTML: name },tr);
                dojo.create('td',{
                  width: '1%',
                  innerHTML: '<div class="dijitIconDelete"></div>',
                  onclick: function(e) {
                      e.preventDefault && e.preventDefault();
                      that.deleteResource( res );
                  }
                }, tr);
            }, this);
        }
        else {
            dom.create('div', { className: 'emptyMessage',
                                innerHTML: 'Add files and URLs using the controls above.'
                              },
                       container);
        }

        // little elements used to show pipeline-like connections between the controls
        dom.create( 'div', { className: 'connector', innerHTML: '&nbsp;'}, container );
    },

    deleteResource: function( resource ) {
        this._resources = array.filter( this._resources || [], function(res) {
            return res !== resource;
        });
        this._updateView();
        this._notifyChange();
    },
    getType: function( name ) {
        return  /\.cmap$/i.test( name )  ? 'cmap'    : /\.xmap$/i.test( name ) ? 'xmap' : /\.smap$/i.test( name ) ? 'smap' :  /\.cn$/i.test(name)? 'cn' : /\.zip$/i.test(name)? 'zip' : /\.txt$/i.test(name)? "txt" : null;
    },

    guessType: function( name ) {
        return ( this._rememberedTypes||{} )[name] || (
                /_q\.cmap$/i.test( name )          ? '_q.cmap'    :
                    /\.xmap$/i.test( name ) ? 'xmap' : 
                    /_r\.cmap$/i.test( name ) ? '_r.cmap':
                    /\.smap$/i.test(name)? 'smap' : 
                    /\.cn$/i.test(name)? 'cn':
                    /\.zip$/i.test(name)? 'zip': 
                    /\.txt$/i.test(name)? 'txt' : null
        );
    }

});
});
