/**
 * Custom BioNano HTML Feature Track to show tooltip on the subfeatures.
 */

define( [
             'dojo/_base/declare',
             'dojo/promise/all',
             "dijit/Tooltip",
             "dojo/on",
             "dojo/mouse",
             'JBrowse/View/Track/HTMLFeatures',
             "dojo/ready",
             "dojo/query"
         ],

         function(
             declare,
             all,
             Tooltip,
             on,
             mouse,
             HTMLFeatures,
             ready,
             query
         ) {
return declare( [ HTMLFeatures ], {

    renderFeature: function( feature, uniqueId, block, scale, labelScale, descriptionScale, containerStart, containerEnd ) {
        var featDiv = this.inherited(arguments);
        // featDiv.title = "";
        // if (featDiv) {
        //     var label = "<div>"
        //     featDiv.id = uniqueId;
        //     for(var key in feature.data) {
        //         if(key!="subfeatures" && key != "attributes")
        //             label +=  "<span class=\"propertyName\">"+key+"</span><span class=\"propertyValue\">"+feature.data[key]+"</span><span class=\"break\"></span>";
        //     }
        //     label += "</div>"
        //     featDiv.popup = label;
        //     var _this = this;
        //     var containerNode = this.domNode; // Assuming that the widget has a domNode

        //     var fooTooltip = new Tooltip({      
        //         connectId: query('.block', containerNode ), // Search the Node starting at the containerNode.
        //         selector: '.feature',
        //         getContent: function(matchedNode) {
        //             return matchedNode.popup;
        //         }
        //     });
        //     block.domNode.appendChild(fooTooltip.domNode);
        // }
        return featDiv;
    },
  
    renderSubfeature: function( feature, featDiv, subfeature, displayStart, displayEnd, block ) {
		var subDiv = this.inherited(arguments);
		

        //Rich Tooltip is causing performance issue.
		/*if(subDiv)
		{
			var label = "<div>";
			subDiv.id = subfeature._uniqueID;
			for(var key in subfeature.data) {
                if(key!="attributes")
                    label +=  "<span class=\"propertyName\">"+key+"</span><span class=\"propertyValue\">"+subfeature.data[key]+"</span><span class=\"break\"></span>";
			}
			label += "</div>"
			subDiv.popup = label;
			var _this = this;
            var containerNode = this.domNode; // Assuming that the widget has a domNode

            var fooTooltip = new Tooltip({  	
                connectId: query('.feature', containerNode ), // Search the Node starting at the containerNode.
                selector: '.subfeature',
                getContent: function(matchedNode) {
                    return matchedNode.popup;
                }
            });
            featDiv.appendChild(fooTooltip.domNode);

		}*/
        if(subDiv)
        {
            var label = "";
            subDiv.id = subfeature._uniqueID;
            for(var key in subfeature.data) {
                if(key!="attributes")
                    label += key+" => "+subfeature.data[key]+"\n";
            }
            subDiv.title = label;
        }
		return subDiv;
   	}
});
});