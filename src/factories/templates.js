/**
*   @description
*   @name: TemplateFactory
*
*	@params default: template and css styles placed here and are dynamically set
*	@params custom: user can set their own template urls that are styled by themselves application-wide
*/

angular
.module('isu.templates', ['isu.provider'])
.factory('TemplateFactory', ['isuSectionProvider',
    function(isuSectionProvider) {

	'use strict';

    function Template() {
      this.defaults = isuSectionProvider.defaults.possibleTypes;
    }

    /* this is an interesting problem because setting custom templates on the HTML DOM does not 
    * seem very elegant
    * @example:
    * 	<isu-sections
    *	text-section-url = 'app/components/section/textSection.tpl.html'
    *	image-section-url = 'app/components/section/imageSection.tpl.html'	
    */
    Template.prototype.custom  = {};

    Template.prototype.$getDefault = function(type) {
        return this.defaults.filter(function(obj){
              if(obj.type === type) return obj;
        }).map(function(obj){
              return obj.html || Template.retrieveHtml(obj.url);
        })[0];
    };


    //psueodcode
    Template.prototype.$setCustom = function(data) {
        var possibleTypes = isuSectionProvider.possibleTypes();
        if(possibleTypes.hasOwnProperty(data.type)){
            //do something
            return;
        }

        this.defaults.possibleTypes.push(data);
    };

    Template.prototype.$getCustom = function(type) {
        
        // this needs an error handler if theres no custom page for this
        return this.custom.filter(function(obj){
              if(obj.type === type) return obj;
        }).map(function(obj){
            return obj.html || Template.retrieveHtml(obj.url);
        })[0];
    };

    Template.retrieveHtml = function(url) {
        return '<div>Function to retreive HTML</div>';
    };
  
    // pseudocode
    Template.build = function(data) {
        if(!data || angular.isUndefined(data))
          return new Template(defaults);
        return new Template(data);
    };

    return Template;
}]);