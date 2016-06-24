angular.module('isu-form-sections', ['isu.provider', 'isu.form-init', 
	'isu.create-section', 'isu.sections', 'isu.templates', 'isu.sectionable']);

/**
 * @description
 * @name isuSectionProvider
 */

angular.module('isu.provider', [])
.provider('isuSectionProvider', function() {
	'use strict';

	this.defaults = {
		serverFramework: 'laravel',
		useDefaultTemplate: true,
		method: 'POST',
		target: '/',
		autopost: true,
		fileEndpoint: '/justTheFile/', // fileEndpoint for get && post
		templateDefaults: null,
		types: null,
		possibleTypes: [{
            type: 'Text',
            html: '<text-section></text-section>',
            url: '/section/tpl/textSection.tpl.html', // these URLs aren't working yet
            schemaIsArray: false,
            schema: { text: null }	// for when Section is built and content is null.
        },
        {
            type: 'InlineImage',
            html: '<inline-image-section></inline-image-section>',
            url: '/section/tpl/inlinePhotoSection.tpl.html',
            schemaIsArray: true,
            schema: { image: { file: null, description: null, user_id: null }, 
            		  file_id: null, url: null }
	    },
        {
            type: 'Profile',
            html: '<profile-section></profile-section>',
            url: '/section/tpl/ProfileSection.tpl.html',
            schemaIsArray: false,
            schema: { text: 'Describe this person ...' }
	    }]
	};
	
	this.$get = function($http, $q) {
		return {

			/** Default configuration */
			defaults: this.defaults,

			/**
			*	Grabs the possible types in defaults.
			*/
			possibleTypes: function() {
				return this.defaults.types || this.defaults.possibleTypes.map(function(o) { return o.type; });
			},

			/**
			*	Returns the schema of the section type for front end.
			*	Primarily important for creating content arrays.
			*/
			getContentOf: function(type) {
				var schema = undefined;

				this.defaults.possibleTypes.forEach(function(o){
					if(o.type === type) {
						schema = o.schemaIsArray ? [o.schema] : o.schema;
					}
				});
				return schema;
			},

			/**
			*	Transforms object array into FormData type to post to API.
			*/
			transformToFormData: function(data) {  //consider exporting this into a service library for personal usage;
				var _fd = new FormData();
                angular.forEach(data, function (val, key) {
                	if(val === null || val === '' || angular.isUndefined(val)) return;

                	if(typeof val === 'object' && Object.keys(val).length !== 0)
	                    transformObjectToFormData(_fd, val, key);
	                else if(key.charAt(0) !== '$' && typeof val === 'string' || typeof val === 'number')
	                	_fd.append(key, val);
                });

                function transformObjectToFormData(fd, obj, key) {
                	angular.forEach(obj, function(i, e){
                		if(typeof i === 'object'){
                			var t = key+'['+e+']';
	                		if(i instanceof File)
	                			fd.append(t, i)
	                		// checks for primitive number and string that does not begin with $
	                		if (typeof e === 'number' || ( e.charAt(0) !== '$'))
	                			transformObjectToFormData(fd, i, t);


	                	} else if(!angular.isUndefined(i))
	                		fd.append(key+'['+e+']', i);
                	});
                }
                return _fd;
			},

			/**
			*	Function to post to API given method and endpoint.
			*   
			*/  
			callMethodToApi: function(data) {
				var deferred = $q.defer();
				var fd = this.transformToFormData(data);

				// laravel hack as the patch method is really a post method.
				if(this.defaults.serverFramework === "laravel" && this.defaults.method === 'PATCH'){ 
					fd.append('_method', 'PATCH');
					this.defaults.method = 'POST';
				}
 
				$http({
					method: this.defaults.method,
					url: this.defaults.target,
					data: fd || {},
					transformRequest: angular.identity,
					headers: {
						'Content-Type': undefined
					}
				}).success(function(r) {
					deferred.resolve(r);
				}).error(function(e) {
					console.log(e);
					deferred.reject(e);
				});

				return deferred.promise;
			}
		}
	};

});


/**
 * @description
 * @name isuCreateSection
 */
angular
.module('isu.create-section', ['isu.sections', 'isu.provider'])
.directive('isuCreateSection',  ['$rootScope', '$compile', '$interpolate', '$timeout', 'Section', 'isuSectionProvider',

function ($rootScope, $compile, $interpolate, $timeout, Section, isuSectionProvider) {
	
	'use strict';

	return {
		restrict: 'AE',
		transclude: true,
		scope: {
			sections: '=isuBindSection'
		},
		template: ['<div ng-transclude></div>',
				   '<md-select ng-model="create.type" placeholder="Add new section">',
				   '<md-option ng-value="null">Add new Section</md-option>',
				   '<md-option ng-value="type" ng-repeat="type in typeArray">' + $interpolate.startSymbol(),
				   ' type ' + $interpolate.endSymbol() + ' Section</md-option>',
				   '</md-select>'].join(''),
		controllerAs: 'create',
		controller: ['$scope', isuCreateSectionController],
		link: isuCreateSectionLink
	};

	function isuCreateSectionController($scope) {

		$scope.typeArray = isuSectionProvider.possibleTypes();
		$scope.sections = [];
		$scope.files = [];

		/**
		*	Chains javascript array and maps a new value.
		*	@params: increment: @boolean, when true swap element up.
		*	@returns new array with swapped values of order.
		*/
		this.move = move;
		function move(order, increment){	  
			/** guard against last and first */
			if( (order <= 0 && !increment) || ( (order+1) === nextOrderance() && increment) )
				return false;

		    var i = increment ? 1 : -1;
		  
		    return $scope.sections.map(function(o){
		        if (o.order == order) 
		        	o.order = (order + i);
		        else if (o.order == order+i) 
		        	o.order = order;
		        return o;
		    });
		}

		/**
		*	Chains javascript array map and filter to return the next value for order.
		*	@returns +1 of highest orderance in sections array.
		*/
		this.nextOrderance = nextOrderance;
		function nextOrderance() {
            if($scope.sections.length === 0) return 0;
          
			return Math.max.apply(Math, $scope.sections.map(function(i) {
			    return i.order + 1;
			}));
		}

		/**
		*	
		*
		*/
		this.remove = removeByOrder; 
		function removeByOrder(order) {
			if(angular.isUndefined(order))
				return false;

			$scope.sections = $scope.sections.map(function(o){
				if(o.order === order) {
					$scope.$emit('removeByOrder', {section: o});
					if (o.id) o['_method'] = 'DELETE';
					else return;
				}
				return o;
			}).filter(function(o){ return !angular.isUndefined(o); });

			flattenOrder($scope.sections);
		}

		/**
		*	Flatten the order of the sections array
		*	so it would be like [1, 4, 5, 9, 11] = [ 1, 2, 3, 4, 5]
		*/
		this.flattenOrder = flattenOrder;
		function flattenOrder(collection) {
			var t = collection.sort(function(a, b){ return a.order > b.order; });
			for(var i = 0, n = 0; i < t.length; i++) {
			    if(t[i].hasOwnProperty('_method') && t[i]._method === 'DELETE')
			    	t[i].order = 999 + i;
			    else
			    	t[i].order = n++;
			}
			return collection = t;
		}

		/**
		*	
		*
		*/
		this.updateScopeIndex = updateScopeIndex;
		function updateScopeIndex(collection) {
			var t = collection;
			for(var i = 0; i < collection.length; i++) {
				if(collection[i].$getChildScope())
					collection[i].$getChildScope().$sIndex = i;
			}
			return collection;
		}

		/**
		*	
		*
		*/
		this.persistExisting = persistExisting;
		function persistExisting(collection) {
			angular.forEach(collection, function(o, k){
				if(o.hasOwnProperty('images') && o.images !== null) 
					o.content = o.content.map(function(m){
						for(var i = 0; i < o.images.length; i++) {
							if(o.images[i].file_id == m.file_id){
								m['image'] = [];
								m['image']['filename'] = o.images[i].file.filename;
								m['image']['description'] = o.images[i].file.description;
							}
						}
						return m;
					});

				$timeout(function(){   // wait until listener is created
					$scope.$emit('compileSectionToView', 
						{section: Section.build(o)});
				}, 80);
			});
		}

	}


	function isuCreateSectionLink(scope, el, attrs, ctrl) {
		// maybe to do in the future gobble up all these watchers and event listenrs below it.
		// not going to work because of the _method delete array maintains array lenght.
		// therefore I am not too sure if this even is necessary. 
		/**
		*	
		*
		*/
		scope.$watchCollection(function(){ return scope.sections; }, 
			function(collection){
				var index, collectionKeys = [];

				// mimics ngRepeat directive
				if ( angular.isArray(collection) )
					collectionKeys = collection;
				else {
					for (var itemKey in collection) {
		            	if (hasOwnProperty.call(collection, itemKey) && itemKey.charAt(0) !== '$') 
			                collectionKeys.push(itemKey);
		          	};
				};

				ctrl.flattenOrder(collectionKeys);
				ctrl.updateScopeIndex(collectionKeys);			
		});

		/**
		*	
		*
		*/
		scope.$watch('create.type', function(type){
        	if(type && !angular.isUndefined(type)){
    	        ctrl.type = null; // resets to default
            	$rootScope.$emit('compileSectionToView', 
            		{section: new Section(type, ctrl.nextOrderance()) });
           }
		}, true);

		/**
		*	
		*
		*/
        scope.$on('removeByOrder', function(ev, data) {
          	ev.preventDefault();

			data.section.$getChildScope().$destroy();
      		angular
      			.element(document.getElementById('object-'+data.section.order))
                .remove();

			ctrl.updateScopeIndex(scope.sections);
		});

        /**
        *	
        *  TODO: needs more error handling
        */
		$rootScope.$on('compileSectionToView', function(ev, data) {
			ev.preventDefault();

			if(!data.hasOwnProperty('section'))
				throw new Error('No section data was provided to compile into DOM.');

			var section, template, compiledDirective, directiveElement; 

			section  = data.section;
			template = section.$getTemplate();

          	section.$setChildScope( scope.$new() );	
            
            scope.sections.push(section);

            compiledDirective = $compile(template);
            directiveElement  = compiledDirective( section.$getChildScope() );
         
	        el.append(directiveElement);
		});
	}
	
}]);
/**
 * @description
 *
 * @name isuEditSection
 */
angular
.module('isu.create-section')
.directive('isuEditSection', function() {

	return {
		restrict: 'A',
		require: '^isuCreateSection',
		link: function(scope, el, attrs, ctrl) {
			var object = angular.extend({}, scope.$eval(attrs.isuEditSection));
			var sections = JSON.parse( angular.toJson(object) );
			ctrl.persistExisting( sections );
		}
	}
});


/**
 * @description: directive filter providers for template partials
 * 
 * Section Types:
 * ========================
 * @name textSection
 * @name inlineImageSection
 * @name profileSection
 */
angular
.module('isu-form-sections')
.directive('formatHttp', formatHttp);


function formatHttp() {
    return {
        restrict: 'A',
        require: 'ngModel',
        link: function(scope, element, attrs, controller) {
            function ensureHttpPrefix(value) {
                // Need to add prefix if we don't have http:// prefix already AND we don't have part of it
                if(value && !/^(https?):\/\//i.test(value)
                   && 'http://'.indexOf(value) === -1) {
                    controller.$setViewValue('http://' + value);
                    controller.$render();
                    return 'http://' + value;
                }
                else
                    return value;
            }
            controller.$formatters.push(ensureHttpPrefix);
            controller.$parsers.splice(0, 0, ensureHttpPrefix);
        }
    };
}

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

					if(opts.hasOwnProperty('autopost') && !opts.autopost)
						return false;

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
 /**
 * @description: Directive that exists on the form outer node to parse out sections
 * 				 to meet the new api. First integration of live editing.
 *
 */
angular
.module('isu.sectionable', ['isu.provider'])
.service('debouncer', ['$timeout',
    function($timeout) {	       
	    this.Debounce = function () {
	        var timeout;

	        this.Invoke = function (func, wait, immediate) {
	            var context = this, args = arguments;
	            var later = function () {
	                timeout = null;
	                if (!immediate) {
	                    func.apply(context, args);
	                }
	            };
	            var callNow = immediate && !timeout;
	            if (timeout) {
	                $timeout.cancel(timeout);
	            }
	            timeout = $timeout(later, wait);
	            if (callNow) {
	                func.apply(context, args);
	            }
	        };
	        return this;
		}
	}
])
.directive('sectionable', ['isuSectionProvider', 'debouncer', '$timeout',
	function(isuSectionProvider, debouncer, $timeout) {
		return {
			restrict: 'A',
			scope: {
				'sectionId': '=',
				'saveMessage': '='
			},
			controller: ['$scope', function($scope) {
			  	
			    var newDebounce = new debouncer.Debounce();

			  	this.destroy = destroy;
			  	function destroy(type) {
			  		$scope.$emit('destroySectionFromView', {contentType: type});
			  	}
			  	this.move = move;
			  	function move() {
			  		$timeout(function(){
			  			$scope.$emit('saveAllSections', {});
			  		}, 1000);
			  	}
			}],
			link: function(scope, el, attrs, ctrl) {

				var url = window.location.pathname;
					url = url.substr(0, url.length - 4);

			    var newDebounce = new debouncer.Debounce();

			    scope.saveMessage = '';

				el.bind('keydown keyup', function(ev) {

				  	
				  	var update = function() {
						var content = getContent();
						var contentType = content.type.toLowerCase();
				  		var target = url.concat(contentType+'section/'+scope.sectionId);

						angular.extend(isuSectionProvider.defaults, { target: target, method: 'PATCH'});		
						isuSectionProvider.callMethodToApi(content).then(function(success){
							setSaveMessage(success.updated_at);
						}, function(error){
							setErrorMessage();
							throw new Error("Unable to update this " + contentType + ' section');
						});
				  	}

				  	var make = function() {
						var content = getContent();
						var contentType = content.type.toLowerCase();
				  		var target = url.concat(contentType+'section');

						angular.extend(isuSectionProvider.defaults, { target: target, method: 'POST'});		
						isuSectionProvider.callMethodToApi(content).then(function(success){
							content['id'] = success.id;
							setSaveMessage(success.updated_at);
						}, function(error){
							setErrorMessage();
							throw new Error("Unable to create a " + contentType + ' section');
						});
				  	}

				  	var applyMethod = function() {
				  		scope.saveMessage = 'Saving ...';
				  		var content = getContent();
				  		return scope.sectionId ? update(content) : make(content);
				  	}

					newDebounce.Invoke(function(){ scope.$apply(applyMethod); }, 1000, false);
				});

			  	scope.$on('destroySectionFromView', function(ev, data) {
			  		ev.preventDefault();

			  		if(!scope.sectionId)
			  			return;

					var contentType = data.contentType.toLowerCase();
			  		var target = url.concat(contentType+'section/'+scope.sectionId);

					angular.extend(isuSectionProvider.defaults, { target: target, method: 'DELETE'});
					isuSectionProvider.callMethodToApi().then(function(success){
					}, function(error){
						setErrorMessage();
						throw new Error("Unable to delete this " + contentType + ' section');
					});
				})

			  	scope.$on('saveAllSections', function(ev, data) {
			  		ev.preventDefault();

			  		var sections = getSections();

			  		for(var i in sections) {

			  			if(sections[i].hasOwnProperty('_method') && sections[i]._method == 'DELETE')
			  				return;

						var contentType = sections[i].type.toLowerCase();
						var target = url.concat(contentType+'section/'+( sections[i].id ||'' ));
						var method = sections[i].id ? 'PATCH' : 'POST';

						angular.extend(isuSectionProvider.defaults, { target: target, method: method});		
						isuSectionProvider.callMethodToApi(sections[i]).then(function(success){

							setSaveMessage(success.updated_at);

						}, function(error){
							setErrorMessage();
							throw new Error("Unable to update this " + contentType + ' section');
						});
			  		}
			  	});

				function getContent() {
					for(var i in scope.$parent.$parent.sections) {
						var item = scope.$parent.$parent.sections[i];
						if(item.$$childScope.$sIndex == scope.$parent.$sIndex) {
							return item;
						}
					}
				}

				function getSections() {
					return scope.$parent.$parent.sections;
				}

				function setErrorMessage() {
					scope.saveMessage = 'Unable to save';
				}

				function setSaveMessage(updated_at) {
					scope.saveMessage = 'Saved';
				}
			}
		}
	}
])
.directive('deleteSectionable', ['isuSectionProvider', 
	function(isuSectionProvider) {
		return {
			restrict: 'A',
			require: '^sectionable',
			link: function(scope, el, attrs, ctrl) {
				el.bind('click', function(ev) {
					ev.preventDefault();
					ctrl.destroy(attrs.deleteSectionable);
				});
			}
		}
	}
])
.directive('moveSection', ['isuSectionProvider', 
	function(isuSectionProvider) {
		return {
			restrict: 'A',
			require: '^sectionable',
			link: function(scope, el, attrs, ctrl) {
				el.bind('click', function(ev) {
					ev.preventDefault();
					ctrl.move();
				});
			}
		}
	}
]);
/**
 * @description: template provider for Template Factory
 * 	 - uses TextAngular library and Material Design decorators
 * 
 * Section Types:
 * ========================
 * @name textSection
 * @name inlineImageSection
 * @name profileSection
 */
angular.module('isu-form-sections')
.directive('textSection', textSection)
.directive('inlineImageSection', inlineImageSection)
.directive('profileSection', profileSection);

textSection.$inject = ['$interpolate'];
inlineImageSection.$inject = ['$interpolate'];
profileSection.$inject = ['$interpolate'];

function textSection($interpolate) {
	'use strict';

	var s = $interpolate.startSymbol();
	var e = $interpolate.endSymbol();

	return {
		replace:true,
		template: ['<section style="order:'+s+'sections[$sIndex].order'+e+'" id="object-'+s+'sections[$sIndex].order'+e+'" ',
					'sectionable section-id="sections[$sIndex].id || null" save-message="saveMessage">',
					'<md-toolbar>',
					'<header>Text Section</header>',
					'<i class="display__save-messsage">'+s+'saveMessage'+e+'</i>',
					'<a class="mdi button mdi-chevron-up" ng-click="create.move(sections[$sIndex].order, false)" move-section></a>',
					'<a class="mdi button mdi-chevron-down" ng-click="create.move(sections[$sIndex].order, true)" move-section></a>',
					'<a class="mdi button mdi-close" ng-click="create.remove(sections[$sIndex].order)" delete-sectionable="text"></a>',
					'</md-toolbar>',
					'<fieldset>',
					'<text-angular ng-model="sections[$sIndex].content.text"></text-angular>',
					'</fieldset>',
					'</section>'].join('')
	}
};

function inlineImageSection($interpolate) {
	
	'use strict';

	var s = $interpolate.startSymbol();
	var e = $interpolate.endSymbol();


	return {
		replace:true,
		controller: ['$scope', function($scope) {

			$scope.imageFields = [0];
			
			$scope.addImage = function(id) {
				var i = $scope.imageFields.length + 1;
				$scope.imageFields.push( i ) ;
			}

			$scope.removeImage = function(fileId, index) {
				$scope.$parent.sections[$scope.$sIndex].content = $scope.$parent.sections[$scope.$sIndex].content.map(function(o){
					if(o.file_id === fileId){
						$scope.imageFields.splice(index, 1);
						return;
					}
					return o;
				}).filter(function(o){ return !angular.isUndefined(o); });
			}
	
		}],
		link: function(scope, el, attrs) {
			var len = null;
			var destroyWatch = scope.$watch(function(){
				if (scope.$parent.sections[scope.$sIndex] && 
					scope.$parent.sections[scope.$sIndex].content && 
					len !== scope.$parent.sections[scope.$sIndex].content.length){
					len = scope.$parent.sections[scope.$sIndex].content.length
					for(var i = 1; i < len; i++)
						scope.imageFields.push( i ) ;
					destroyWatch();
				}
			})
		},
  		template: ['<section style="order:'+s+'sections[$sIndex].order'+e+'" id="object-'+s+'sections[$sIndex].order'+e+'">',
					'<md-toolbar>',
					'<header>Inline Image Section</header>',
					'<i class="display__save-messsage">'+s+'saveMessage'+e+'</i>',
					'<a class="mdi button mdi-chevron-up" ng-click="create.move(sections[$sIndex].order, false)" move-section></a>',
					'<a class="mdi button mdi-chevron-down" ng-click="create.move(sections[$sIndex].order, true)" move-section></a>',
					'<a class="mdi button mdi-close" ng-click="create.remove(sections[$sIndex].order)" delete-sectionable="inlineimage"></a>',
					'</md-toolbar>',
					'<fieldset ng-repeat="(rIndex, r) in imageFields">',

					'<span ng-if="sections[$sIndex].content[rIndex].file_id">',
					'<a class="mdi button mdi-close" ng-click="removeImage(sections[$sIndex].content[rIndex].file_id, rIndex)"></a>',
					'<img ng-src="/storage/app/'+s+'sections[$sIndex].content[rIndex].image.filename'+e+'"/>',
					'</span>',

					'<input class="md-button" type="file" name="sections['+s+'$sIndex'+e+'].content['+s+'rIndex'+e+'].image.file" ng-model="sections[$sIndex].content[rIndex].image.file"/>',
					
					'<md-input-container>',
					'<label>Description</label>',
					'<input type="text" ng-model="sections[$sIndex].content[rIndex].image.description"/>',
					'</md-input-container>',
					
					'<md-input-container>',
					'<label>URL</label>',
					'<input type="url" ng-model="sections[$sIndex].content[rIndex].url" format-http/>',
					'</md-input-container>',
					
					'</fieldset>',
					'<a class="mdi button mdi-plus" ng-click="addImage()"></a>',
					'</section>'].join('')		
	}
};

function profileSection($interpolate) {

	'use strict';

	var s = $interpolate.startSymbol();
	var e = $interpolate.endSymbol();

	return {
		replace: true,
		link: function(scope, el, attrs) {
			scope.$watch(function(){

				if(typeof scope.$parent.sections[scope.$sIndex] === 'undefined')
					return;

				var s = scope.$parent.sections[scope.$sIndex].content;
				if( s && s.hasOwnProperty('image') && s.hasOwnProperty('heading') )
					s.image.description = s.heading + 
						( s.subheading ? ( ' - ' + s.subheading )  : '' );

			}, true);


		},
		template: ['<section style="order:'+s+'sections[$sIndex].order'+e+'" id="object-'+s+'sections[$sIndex].order'+e+'"',
					'sectionable section-id="sections[$sIndex].id || null" save-message="saveMessage">',
					'<md-toolbar>',
					'<header>Profile Section</header>',
					'<i class="display__save-messsage">'+s+'saveMessage'+e+'</i>',
					'<a class="mdi button mdi-chevron-up" ng-click="create.move(sections[$sIndex].order, false)" move-section></a>',
					'<a class="mdi button mdi-chevron-down" ng-click="create.move(sections[$sIndex].order, true)" move-section></a>',
					'<a class="mdi button mdi-close" ng-click="create.remove(sections[$sIndex].order)" delete-sectionable="profile"></a>',
					'</md-toolbar>',
					'<fieldset>',
					
					'<span ng-if="sections[$sIndex].content.file_id">',
					'<img ng-src="/storage/app/'+s+'sections[$sIndex].image.filename'+e+'"/>',
					'</span>',

					'<input class="md-button" type="file" name="sections['+s+'$sIndex'+e+'].content.image.file" ng-model="sections[$sIndex].content.image.file" file="sections[$sIndex].content.image.file"/>',
						
					'<span ng-if="(sections[$sIndex].content.image || sections[$sIndex].content.file_id)">',
					'<md-input-container ng-if="sections[$sIndex].content.image">',
					'<label>Heading</label>',
					'<input type="text" ng-model="sections[$sIndex].content.heading"/>',
					'</md-input-container>',
					
					'<md-input-container ng-if="sections[$sIndex].content.image">',
					'<label>Subheading</label>',
					'<input type="text" ng-model="sections[$sIndex].content.subheading"/>',
					'</md-input-container>',
					'</span>',

					'<text-angular ng-if="sections[$sIndex].content.image" ng-model="sections[$sIndex].content.text"></text-angular>',

					'<input type="hidden" ng-model="sections[$sIndex].content.image.description"/>',
					'</fieldset>',
					'</section>'].join('')
	}

};


/**
 * @description
 * @name Section
 */
angular
	.module('isu.sections', ['isu.templates', 'isu.provider'])
	.factory('Section', ['TemplateFactory', 'isuSectionProvider',

    function(TemplateFactory, isuSectionProvider) {

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
}]);
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