define([
'dojo/_base/declare', 
'dojo/_base/lang', 
'dojo/_base/array', 
'dojo/Deferred', 
'JBrowse/Model/SimpleFeature', 
'JBrowse/Store/SeqFeature', 
'JBrowse/Store/DeferredFeaturesMixin', 
'JBrowse/Store/DeferredStatsMixin', 
'JBrowse/Store/SeqFeature/GlobalStatsEstimationMixin', 
'JBrowse/Model/XHRBlob', 
'./XMAP/MoleculeXMapParser', 
'./CMAP/SimpleCMAPParser'
], 
function(
declare, 
lang, 
array, 
Deferred, 
SimpleFeature, 
SeqFeatureStore, 
DeferredFeatures, 
DeferredStats, 
GlobalStatsEstimationMixin, 
XHRBlob, 
MoleculeXMapParser, 
SimpleCMAPParser
) {
    
    return declare([SeqFeatureStore, DeferredFeatures, DeferredStats, GlobalStatsEstimationMixin], 
    
    /**
  * @lends JBrowse.Store.SeqFeature.GFF3
  */
    {
        constructor: function(args) {
            this.xmap = args.xmap;
            this.qcmap = args.qcmap;
            this.queryFeature = args.queryFeature;
            this.features = [];
            this.qcBareFeatures= [];
            this.bareFeatures = [];
            var defaultRefNames = { 1 : "chr1",
2 : "chr2",
3 : "chr3", 
4 : "chr4",
5 : "chr5",
6 : "chr6",
7 : "chr7",
8 : "chr8",
9  : "chr9",
10 : "chr10",
11 : "chr11",
12 : "chr12",
13 : "chr13",
14 : "chr14",
15 : "chr15",
16 : "chr16",
17 : "chr17",
18 : "chr18",
19 : "chr19",
20 : "chr20",
21 : "chr21",
22 : "chr22",
23 : "chrX",
24 : "chrY"};
        this.referenceNames = args.referenceNames || defaultRefNames;
            this._loadFeatures();
        },

        clearFeatures : function()
        {
            // this.features = [];
            // this.bareFeatures = [];
            // this.qcBareFeatures = [];
            // this.queryFeature = undefined;
        },

        addFeatures : function(xmap,qcmap,queryFeature)
        {
            this.xmap = xmap;
            this.qcmap = qcmap;
            this.queryFeature = queryFeature;
            this._loadFeatures();
        },
        
        _loadFeatures: function() {
            var thisB = this;
            var features = this.bareFeatures;
            
            var featuresSorted = true;
            var seenRefs = this.refSeqs = {};
            var qcFeatures = this.qcBareFeatures;
            var fail = this.fail =  lang.hitch(this, '_failAllDeferred');
            
            if (this.xmap && this.qcmap) 
            {                
                var qcParser = new SimpleCMAPParser({
                    
                    featureCallback: function(fs) 
                    {
                        array.forEach(fs, function(feature) 
                        {                      
                            //For molecule maps the cmap id is not the sequence id.
                            if (!qcFeatures[feature.cmap_id])
                                qcFeatures[feature.cmap_id] = {};
                            qcFeatures[feature.cmap_id][feature.site_id] = feature;
                        });
                    
                    },
                    endCallback: function() 
                    {
                        thisB._xMapParser(thisB);
                    }
                });
                
                var qc = this.qcmap.split("\n")
                for(var i=0;i<qc.length;i++)
                {
                    if(qc[i].trim().length>0)
                        qcParser.addLine(qc[i]);
                }
                qcParser.finish();
            } 
        },

       
        _xMapParser : function(scope) 
        {
             // var fail = lang.hitch(this, '_failAllDeferred');
            var thisB = scope;
            var features = thisB.bareFeatures;
            var seenRefs = thisB.refSeqs;
            var parser = new MoleculeXMapParser(
                {
                    featureCallback: function(fs) {
                        array.forEach(fs, function(feature) {
                            feature.seq_id = thisB.browser.refSeq.name;                
                            var prevFeature = features[features.length - 1];
                          
                            // console.log("Chromosome ID->"+feature.seq_id+"<-");
                            var regRefName = thisB.browser.regularizeReferenceName(feature.seq_id);
                            if (regRefName in seenRefs && prevFeature && prevFeature.seq_id != feature.seq_id)
                                featuresSorted = false;
                            if (prevFeature && prevFeature.seq_id == feature.seq_id && feature.start < prevFeature.start)
                                featuresSorted = false;
                            
                            if (!(regRefName in seenRefs))
                                seenRefs[regRefName] = features.length;
                            
                            // feature.start = feature.start+thisB.queryFeature.start;
                            //Parent's first label position
                            thisB.queryFeature.subfeatures = thisB.queryFeature.subfeatures.sort(thisB._subfeatureCompare);                        
                            feature = thisB._labelData(feature);

                            var map = feature.subfeatures[0].map;
                            var refSub = thisB._getQCSubFeature(thisB.queryFeature.subfeatures,map.ref);
                            var start = 1;
                            while(!refSub && start <feature.subfeatures.length)
                            {
                                map = feature.subfeatures[start].map;
                                refSub = thisB._getQCSubFeature(thisB.queryFeature.subfeatures,map.ref);
                                start++;
                            }                           
                           
                            var queSub = thisB._getMolQCSubFeature(feature.subfeatures,map.query);                              

                            if(refSub && queSub)
                            {
                                var plstart = parseInt(refSub.data.start);
                                         
                                if(feature.strand === '+')
                                {
                                    feature.start = parseInt(plstart - queSub.position) ; // The query start is from the first label backwards.
                                    feature.end = feature.start + parseInt(queSub.contig_length);
                                    var matchedFeatures  = {};
                                    for (var i = 0; i < feature.subfeatures.length; i++) {                                                       
                                        matchedFeatures[feature.subfeatures[i].name] = true;
                                    }
                                    feature.subfeatures.length = 0;
                                    for(var key in thisB.qcBareFeatures[feature.name])
                                    {
                                        var subf= thisB.qcBareFeatures[feature.name][key];
                                        
                                        var parsed = {};
                                        parsed.seq_id = subf.seq_id;
                                        parsed.name = subf.site_id;
                                        if(matchedFeatures[parsed.name])
                                            parsed.type = subf['label_channel'];
                                        else
                                            parsed.type = 'nomatch';
                                        parsed.start = feature.start + parseInt(subf['position']);
                                                                                               
                                        parsed.end = parsed.start+7;
                                        parsed.score = null;
                                        parsed.phase = 0;                                            
                                        feature.subfeatures.push(parsed);
                                        
                                    } 
                                }
                                else
                                {    
                                    if(feature.name==="57660630")
                                    {
                                        console.log("adsfad");
                                    }
                                    var startOffset = parseInt(queSub.contig_length)-parseInt(thisB.qcBareFeatures[feature.name]["1"]['position'])-parseInt(thisB.qcBareFeatures[feature.name][queSub.num_sites]['position']);
                                    var endOffset = parseInt(queSub.contig_length)-parseInt(thisB.qcBareFeatures[feature.name][queSub.num_sites]['position']);
                                    feature.start = parseInt(plstart - startOffset); // The query start is from the first label backwards.
                                    feature.end = feature.start + parseInt(queSub.contig_length);
                                    var matchedFeatures  = {};
                                    for (var i = 0; i < feature.subfeatures.length; i++) {                                                       
                                        matchedFeatures[feature.subfeatures[i].name] = true;
                                    }
                                    feature.subfeatures.length = 0;
                                    for(var key in thisB.qcBareFeatures[feature.name])
                                    {
                                        var subf= thisB.qcBareFeatures[feature.name][key];
                                        
                                        var parsed = {};
                                        parsed.seq_id = subf.seq_id;
                                        parsed.name = subf.site_id;
                                        if(matchedFeatures[parsed.name])
                                            parsed.type = subf['label_channel'];
                                        else
                                            parsed.type = 'nomatch';
                                        
                                        parsed.start = feature.start + startOffset + feature.qstart - parseInt(subf['position']);// + parseInt(f.start);
                                        parsed.end = parsed.start + 7;                                    
                                        parsed.score = null;
                                        parsed.phase = 0;                                            
                                        if(thisB.queryFeature.strand==="-")
                                        {                                        
                                            parsed.start = parsed.start-(2*(parsed.start-plstart));
                                            parsed.end = parsed.start +1;
                                        }
                                        feature.subfeatures.push(parsed);
                                        
                                    }
                                    if(thisB.queryFeature.strand==="-")
                                    {
                                        var fstart = feature.start;
                                        var fend = feature.end;
                                        feature.end = fstart - (2*(fstart-plstart));
                                        feature.start = fend - (2*(fend-plstart));
                                    }
                                    
                                   
                                }                                
                                
                                 features.push(feature); 
                            }         
                            else
                            {
                                console.log("Something wrong with the way the labels are matched.");
                            }                  
                            
                        }
                        );
                    },
                    endCallback: function() {
                        
                        
                        if (!thisB.featuresSorted) {
                            features.sort(thisB._compareFeatureData);
                            // need to rebuild the refseq index if changing the sort order
                            thisB._rebuildRefSeqs(features);
                        }
                        
                        thisB._estimateGlobalStats()
                        .then(function(stats) {
                            thisB.globalStats = stats;
                            thisB._deferred.stats.resolve();
                        }
                        );
                        
                        thisB._deferred.features.resolve(features);
                    
                    }
                });
                var x = thisB.xmap.split("\n");
                for(var i=0;i<x.length;i++)
                {
                    if(x[i].trim().length>0)
                        parser.addLine(x[i]);
                }
                parser.finish();
        },

        _getMolQCSubFeature : function(features,subfeatureName)
        {
            for(var i=0;i<features.length;i++)
            {
                if(features[i].name === subfeatureName)
                    return features[i];
            }
            return undefined;
        },

        _getQCSubFeature : function(features,subfeatureName)
        {
            for(var i=0;i<features.length;i++)
            {
                if(features[i].data.name === subfeatureName)
                    return features[i];
            }
            return undefined;
        },
        
        _rebuildRefSeqs: function(features) {
            var refs = {};
            for (var i = 0; i < features.length; i++) 
            {
                if (features[i].seq_id) 
                {
                    var regRefName = this.browser.regularizeReferenceName(features[i].seq_id);
                    
                    if (!(regRefName in refs))
                        refs[regRefName] = i;
                }
            }
            this.refSeqs = refs;
        },

        _subfeatureCompare : function(a, b) {

            if (a.data.seq_id < b.data.seq_id)
                return -1;
            else if (a.data.seq_id > b.data.seq_id)
                return 1;
            
            return a.data.start - b.data.start;
        },
        
        _compareFeatureData: function(a, b) {

            if (a.seq_id < b.seq_id)
                return -1;
            else if (a.seq_id > b.seq_id)
                return 1;
            
            return a.start - b.start;
        },
        
        _getFeatures: function(query, featureCallback, finishedCallback, errorCallback) {
            var thisB = this;
            thisB._deferred.features.then(function() {
                thisB._search(query, featureCallback, finishedCallback, errorCallback);
            }
            );
        },
        
        _search: function(query, featureCallback, finishCallback, errorCallback) {
            // search in this.features, which are sorted
            // by ref and start coordinate, to find the beginning of the
            // relevant range
            var bare = this.bareFeatures;
            var converted = this.features;
            
            var refName = this.browser.regularizeReferenceName(query.ref);
            
            var i = this.refSeqs[refName];
            if (!(i >= 0)) {
                finishCallback();
                return;
            }
            
            var checkEnd = 'start' in query 
            ? function(f) {
                return f.get('end') >= query.start;
            }
             
            : function() {
                return true;
            }
            ;
            
            for (; i < bare.length; i++) {
                // lazily convert the bare feature data to JBrowse features
                var f = converted[i] || 
                (converted[i] = function(b, i) {
                    bare[i] = false;
                    return this._formatFeature(b);
                }
                .call(this, bare[i], i)
                );
                // features are sorted by ref seq and start coord, so we
                // can stop if we are past the ref seq or the end of the
                // query region
                if (f._reg_seq_id != refName || f.get('start') > query.end)
                    break;
                
                if (checkEnd(f)) {
                    featureCallback(f);
                }
            }
            
            finishCallback();
        },
        
        _formatFeature: function(data) {
            if(!data)
                return {};
            var f = new SimpleFeature({
                data: this._featureData(data),
                id: (data.attributes.ID || [])[0]
            });
            f._reg_seq_id = this.browser.regularizeReferenceName(data.seq_id);
            return f;
        },
        
        // flatten array like [ [1,2], [3,4] ] to [ 1,2,3,4 ]
        _flattenOneLevel: function(ar) {
            var r = [];
            for (var i = 0; i < ar.length; i++) {
                r.push.apply(r, ar[i]);
            }
            return r;
        },

        _labelData : function(data)
        {
             var f = lang.mixin({}, data);
          
            if (this.xmap) 
            {
                var sub = [];
                //QC Map matching using the alignment string.
                if(!f.alignment){
                    // console.log("Feature has some issues ");
                    // console.log(f);
                    return f;
                }
                var alignments = f.alignment.split(')');

                for (var i = 0; i < alignments.length - 1; i++) 
                {
                    var alignment = alignments[i];
                    var tokens = alignment.substring(1);
                    tokens = tokens.split(",");
                    var ref = tokens[0];
                    var query = tokens[1];
                    var parsed = {};
                    parsed.seq_id = f.seq_id;
                       parsed.position = this.qcBareFeatures[f.query_contig_id][query]['position'];
                            parsed.num_sites =this.qcBareFeatures[f.query_contig_id][query]['num_sites'];
                            parsed.contig_length = parseInt(this.qcBareFeatures[f.query_contig_id][query].contig_length);       
                    parsed.type = this.qcBareFeatures[f.query_contig_id][query]['label_channel'];
                    // parsed.start = this.average(subfeatures[query]);
                    // parsed.start = parseInt(this.qcBareFeatures[f.query_contig_id][query]['position']);
                    // if(f.strand==="-")                
                    //     parsed.start = f.start + f.qstart-parseInt(this.qcBareFeatures[f.query_contig_id][query]['position']);// + parseInt(f.start);
                    // else
                    // {
                    //     if(parseInt(f.qstart) === parseInt(this.qcBareFeatures[f.query_contig_id][query]['position']))
                    //         parsed.start = f.start;
                    //     else
                    //         parsed.start = parseInt(this.qcBareFeatures[f.query_contig_id][query]['position']) + parseInt(f.start);
                    // }
                    parsed.end = parsed.start+7;
                    parsed.score = null ;
                    parsed.phase = 0;
                    parsed.name = query;
                    // parsed.strand = f[7];
                    parsed.strand = null ;
                    parsed.map = { ref : ref, query : query};
                    parsed.attributes = {
                        "ID": [query]
                    };
                    sub.push(parsed);
                }
                //Make sure the labels are sorted.
                sub.sort(this._compareFeatureData);
                if (sub.length)
                    f.subfeatures = sub;
                f.alignment = null ;
            } 
            return f;
        },
        
        _featureData: function(data) {
            var f = lang.mixin({}, data);
            if (false) 
            {
                var sub = [];
                //QC Map matching using the alignment string.
                if(!f.alignment){
                    // console.log("Feature has some issues ");
                    // console.log(f);
                    return f;
                }
                var alignments = f.alignment.split(')');

                for (var i = 0; i < alignments.length - 1; i++) 
                {
                    var alignment = alignments[i];
                    var tokens = alignment.substring(1);
                    tokens = tokens.split(",");
                    var ref = tokens[0];
                    var query = tokens[1];
                    var parsed = {};
                    parsed.seq_id = f.seq_id;
                    parsed.type = this.qcBareFeatures[f.query_contig_id][query]['label_channel'];
                    // parsed.start = this.average(subfeatures[query]);
                    parsed.start = parseInt(this.qcBareFeatures[f.query_contig_id][query]['position'])+parseInt(f.start);
                    parsed.end = parsed.start+7;
                    parsed.score = null ;
                    parsed.phase = 0;
                    // parsed.strand = f[7];
                    parsed.strand = null ;
                    parsed.attributes = {
                        "ID": [query]
                    };
                    sub.push(parsed);
                }
                if (sub.length)
                    // f.subfeatures = sub;
                f.alignment = null ;
            } 
            return f;
        },
        
        average: function(positions) 
        {
            var sum = 0;
            for (var i = 0; i < positions.length; i++) {
                sum += positions[i];
                //don't forget to add the base
            }
            
            return sum / positions.length;
        },
        
        /**
     * Interrogate whether a store has data for a given reference
     * sequence.  Calls the given callback with either true or false.
     *
     * Implemented as a binary interrogation because some stores are
     * smart enough to regularize reference sequence names, while
     * others are not.
     */
        hasRefSeq: function(seqName, callback, errorCallback) {
            var thisB = this;
            this._deferred.features.then(function() {
                callback(thisB.browser.regularizeReferenceName(seqName) in thisB.refSeqs);
            }
            );
        }
    
    });
}
);
