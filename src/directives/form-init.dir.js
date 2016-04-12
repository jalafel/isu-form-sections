 /**
 * @description: Directive that exists on the form outer node.
 *	<form isu-section-init="{target: '/apiEndpoint', method: 'POST'"}>
 *		<input/> ...
 *	</form>
 *
 *
 *
 * @name isuSectionInit
 *
 * @params: 
 *   -  isu-section-init: {target: '/apiEndpoint', method: 'POST'"}
 *   -  isu-section-types: ['Text', 'InlinePhoto', 'Profile']
 *   -  isu-section-object: '$scope.formObject'
 *   -  isu-section-success: '$scope.successHandler($success)'
 *   -  isu-section-error: '$scope.errorHandler($error)'
 *
 */

angular
	.module('isu.form-init', ['isu.provider'])
	.directive('isuSectionInit', ['isuSectionProvider',

function(isuSectionProvider) {
	return {
		restrict: 'A',
		controller: function() {

			//exports
			this.setObject = setObject;
			this.matchAttr = matchAttr;

		   /**  Takes a path string that corresponds to the
			*   object variable and assigns it the value.
			*/ 
			function setObject(path, value, object) { 
			    var schema = object;  // a moving reference to internal objects within obj 
			    var pList = stringToArray(path);
			    var len = pList.length;
			    for(var i = 0; i < len-1; i++) {
			        var elem = pList[i];
			        if( !schema[elem] ) schema[elem] = {};
			        schema = schema[elem];
			    }
			    schema[pList[len-1]] = value;
			}

		   /**  Returns true if first array key of the name attribute 
			*   is the same as ngModel. If true, this will persist 
			*   to setObject with the form object name prepended to the
			*   name attr. Else it will just take the ngModel name. 
			*/
	     	function matchAttr(a, b) {
				return stringToArray(a)[0] === stringToArray(b)[0];
	       	}

	       /** Converts a dot string (e.g. 'form.comment[0].text') to an array
	        *  (e.g. ['form', 'comment', '0', 'text']). 
	        */
	       	function stringToArray(s) {
				s = s.replace(/\[(.*?)\]/g, '.$1'); // replaces [] as properties
		        s = s.replace(/^\./, '');
	        	return s.split('.');
	       	}
		},

		link: {
			/** Sets section selection types that are available to local form. */
			pre: function (scope, el, attrs) {
				var types = angular.extend([], scope.$eval(attrs.isuSectionTypes));
				isuSectionProvider.defaults.types = types;
			},
			post: function (scope, el, attrs, ctrl) {

				/** Triggers on form submit. */
				el.on('submit', function(val){

					var opts = angular.extend({}, scope.$eval(attrs.isuSectionInit));
					var object = angular.extend({}, scope.$eval(attrs.isuSectionObject));

					angular.extend(isuSectionProvider.defaults, opts || {});

					isuSectionProvider.callMethodToApi(object).then(function(success){
						scope.$success = success;
						scope.$eval(attrs.isuSectionSuccess);
					}, function(error){
						scope.$error = error;
						scope.$eval(attrs.isuSectionError);
					});
				});

			   /**  Triggers when form is changed. Used to update scope
				*   variables that contain a file type, since AngularJS
				*   does not update ngModel.
				*/
				el.bind('change', function(ev){
					ev.preventDefault();

					if(ev.target.files) {
		                var file = ev.target.files[0];
		                var ngModel = ev.target.getAttribute('ng-model');
		                var name = ev.target.name;

		                ctrl.setObject( 
		                	ctrl.matchAttr(name, ngModel) ? 
		               		(attrs.isuSectionObject+'.'+name) : ngModel,
		                	file, scope);

		                scope.$apply();
					}
				});
			}
		}
	};
}]);