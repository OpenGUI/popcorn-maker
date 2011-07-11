/**********************************************************************************

Copyright (C) 2011 by Mozilla Foundation

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

**********************************************************************************/

(function( window, document, undefined, Butter ) {

  Butter.registerModule( "eventeditor", (function() {
  
    var editorTarget,
      targetType,
      
      toggleVisibility = function( attr ) {

        if ( editorTarget && editorTarget.style && attr ) {
          editorTarget.style.visibility = attr;
        } else if ( editorTarget && editorTarget.frameElement && attr ) {
          editorTarget.frameElement.style.visibility = attr;
        }
      },

      useCustomEditor = function( trackEvent ) {
        
        //use a custom editor
        var butter = this,
          editor = trackEvent.popcornEvent._natives.manifest.customEditor;
        clearTarget();
        toggleVisibility( "visible" );
        typeof editor === "function" && editor.call( this, { 
          trackEvent: trackEvent || {},
          target: editorTarget || {}, 
          callback: function( trackEvent, popcornOptions ){
            applyChanges.call( butter, trackEvent, popcornOptions );
          }
        });
      },
      
      // call when no custom editor markup/source has been provided
      constructDefaultEditor = function( trackEvent ) {

        var options = trackEvent.popcornEvent._natives.manifest.options,
          prop,
          opt,
          elemType,
          elemLabel,
          elem,
          label,
          attr,
          surroundingDiv = document.createElement("div"),
          style = surroundingDiv.style;
          
        style.margin = "0.5em 0 0";
        style.padding = "0.3em 1em 0.5em 0.4em";  
        style.background = "none repeat scroll 0 0 #FFFFFF";
        style.border = "1px solid #DDDDDD";
        style.color = "#333333";
        style.backgroundImage = "none";
        style.borderWidth = "1px 0 0";
        style.textAlign = "left";
        style.verticalAlign = "baseline";
        style.lineHeight = "1.5";
        
        //clear editor target
        clearTarget();
        
        for ( prop in options ) {

          opt = options[ prop ];
          if ( typeof opt === "object" && prop !== "target-object" ) {

            elemType = opt.elem;
            elemLabel = opt.label;

            elem = document.createElement( elemType );
            elem.setAttribute( "className", "butter-editor-element" );
            elem.setAttribute( "id", elemLabel + "-input-element" );

            label = document.createElement( "label" );
            label.innerHTML = elemLabel;
            label.setAttribute( "for", elemLabel );
            label.setAttribute( "text", elemLabel );
            label.setAttribute( "className", "butter-editor-label butter-editor-element" );

            if ( elemType === "input" ) {

              attr = trackEvent.popcornOptions[ prop ] || "";

              //  Round displayed times to nearest quarter of a second
              if ( typeof +attr === "number" && [ "start", "end" ].indexOf( prop ) > -1 ) {

                attr = Math.round( attr * 4 ) / 4;
              }

              elem.setAttribute( "value", attr );
            }

            if ( elemType === "select" ) {
              attr = trackEvent.popcornOptions[ prop ];
              elem.style.width = "150px"
              var populate = function( type ) {

                var selectItem = document.createElement( "option" );
                selectItem.value = type;
                selectItem.text = type.charAt( 0 ).toUpperCase() + type.substring( 1 ).toLowerCase();
                elem.appendChild( selectItem );
              };
              
              opt.options.forEach( populate );
              for (var i = 0, l = elem.options.length; i < l; i ++ ) {
                if ( elem.options[ i ].value === attr ) {
                  elem.options.selectedIndex = i;
                  i = l;
                }
              }
            }

            label.appendChild( elem );
            surroundingDiv.appendChild( label );
            surroundingDiv.appendChild( document.createElement("br"));
          }
        }
        
        
        openBtn = document.createElement ("input");
        openBtn.type = "button";
        openBtn.addEventListener( "click", function() {
          clearTarget();
          toggleVisibility( "hidden" );
        }, false );
        openBtn.value = "Close";
        surroundingDiv.appendChild( openBtn );
        
        if ( targetType === "element" ) {
          
          editorTarget.appendChild( surroundingDiv );
        } else if ( targetType === "iframe" ) {
        
          editorTarget.document.body.appendChild( surroundingDiv );
        }
        
        toggleVisibility( "visible" );
      },

      cancelEdit = function() {

        clearTarget();
        toggleVisibility( "hidden" );
      },

      deleteTrack =  function( trackEvent ) {

        Butter.removeTrackEvent( trackEvent );
      },

      clearTarget = function() {
        if ( targetType === "element" ) {
          while ( editorTarget.firstChild ) {
            editorTarget.removeChild( editorTarget.firstChild );
          }
        } else if ( targetType === "iframe" ){
        
          var ifrm = editorTarget.document.body;
          while ( ifrm.firstChild ) {
        
            ifrm.removeChild( ifrm.firstChild );
          }
        }

      },

      updateTrackData = function( trackEvent ) {
        // update information in the editor if a track changes on the timeline.
        return undefined;
      },

      applyChanges = function( trackEvent, popcornOptions ) {
        
        var newEvent = {};
        
        this.extendObj( newEvent, trackEvent );
        newEvent.popcornOptions = popcornOptions;
        
        this.removeTrackEvent( trackEvent.track, trackEvent );
        this.addTrackEvent( newEvent.track, newEvent );
        
        clearTarget();
        toggleVisibility( "hidden" );
        
        alert( "Information recieved from the custom Editor: \n\n Latitude: " + popcornOptions.lat + "\n Longitude: " + 
          popcornOptions.lng + "\n Map Type: " + popcornOptions.type +
          "\n Zoom: " + popcornOptions.zoom );
      },

      beginEditing = function( trackEvent ) {
        
        if ( !trackEvent ) {

          return;
        }

        if ( !trackEvent.popcornEvent._natives.manifest.customEditor ) {

          constructDefaultEditor.call( this, trackEvent );
        } else {

          useCustomEditor.call( this, trackEvent );
        }

      };
  
    return { 
      setup: function( options ) {
         
        var target;
        
        if ( options.target && typeof options.target === "string" ) {
        
          target = document.getElementById( options.target || "butter-editor-target" ) || {};
        } else if ( options.target ) {
        
          target = options.target;
        } else {
        
          throw new Error( "ERROR - setup: options.target invalid" );
        }
        
        editorTarget = ((target.contentWindow) ? target.contentWindow : (target.contentDocument && target.contentDocument.document) ? target.contentDocument.document : target.contentDocument) || target; 
        
        if ( target.nodeName && target.nodeName === "IFRAME" ) {
        
          targetType = "iframe"
        } else {
        
          editorTarget = target;
          targetType = "element";
        }

      },
      
      extend: {
        
        editTrackEvent: function( trackEvent ) {
           
           beginEditing.call( this, trackEvent );
        },
        
        updateEditor: function( trackEvent ) {
        
          updateTrackData.call( this, trackEvent );
        },
        
        extendObj: function( obj ) {
          var dest = obj, src = [].slice.call( arguments, 1 );

          src.forEach( function( copy ) {
            for ( var prop in copy ) {
              dest[ prop ] = copy[ prop ];
            }
          });
        }
      }
    }
  })());

})( window, document, undefined, Butter );

