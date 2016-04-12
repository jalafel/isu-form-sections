/**
 * @description
 * @name Section
 */
angular
	.module('isu.sections', ['isu.templates', 'isu.provider'])
	.factory('Section', function(TemplateFactory, isuSectionProvider) {

	  'use strict';

    /**
  	* Constructor, with class name
  	*/
  	function Section(type, order, content) {
  	    // Public properties, assigned to the instance ('this')
  	    this.type = type;
  	    this.order = order;
  	    this.content = content || null;
  	}

  	/**
   	* Public methods, assigned to prototype
   	*/
	  Section.prototype.$setChildScope = function(data) {
        this.$$childScope = data;
    };

    Section.prototype.$getChildScope = function() {
    	return this.$$childScope;
    };

   	Section.prototype.$getTemplate = function () {

   		var template = new TemplateFactory();

   		if (isuSectionProvider.defaults.useDefaultTemplate)
   			return template.$getDefault(this.type);
   		return template.$getCustom(this.type);
    };


    var possibleTypes = isuSectionProvider.possibleTypes();

  	/**
   	* Private function
   	*/
   	function checkType(type) {
   		// better error handler
   		// try (  ) 
   		// catch return true;
   		// throw ( check if is of a prototypical type that's not)
   		// being configured // error: This type is not active right now.
   		// else if ( default is false ) This sectionable type does not exist, check your config.
   		// else Whoops. Something crazy happened. This sectionable type does not exist.
   		return possibleTypes.indexOf(type) !== -1;
   	}

   	/**
   	*
   	*/
   	function setPrivateProperties(section, data) {
   		angular.forEach(data, function(obj, key){
   			if( !section.hasOwnProperty(key) )
   				section[key] = obj;
   		});
   	}

  	/**
   	* Static property
   	* Using copy to prevent modifications to private property
   	*/
   	Section.possibleTypes = angular.copy(possibleTypes);

  	/**
   	* Static method, assigned to class
   	* Instance ('this') is not available in static context
   	*/
   	Section.build = function (data) {
   		if (!checkType(data.type)) {
   			return;
   		}
	   	
	   	var section = new Section(
	   		data.type,
	   		data.order,
	   		data.content || isuSectionProvider.getContentOf(data.type)
	   	);

	   	setPrivateProperties(section, data);

	   	return section;
   	};

  	/**
   	* Return the constructor function
   	*/
   	return Section;
});



