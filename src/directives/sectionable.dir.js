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
.directive('sectionable', ['isuSectionProvider', 'debouncer', '$filter',
	function(isuSectionProvider, debouncer, $filter) {
		return {
			restrict: 'A',
			scope: {
				'sectionId': '=',
				'saveMessage': '='
				},
			link: function(scope, el, attrs) {

				var url = window.location.pathname;
					url = url.substr(0, url.length - 4);

			    var newDebounce = new debouncer.Debounce();

			    scope.saveMessage = '';

				el.bind('keyup', function(ev) {

					ev.preventDefault();
				  	
				  	var update = function() {
						var content = getContent();
						var contentType = content.type.toLowerCase();
				  		var target = url.concat(contentType+'section/'+scope.sectionId);

						angular.extend(isuSectionProvider.defaults, { target: target, method: 'PATCH'});		
						isuSectionProvider.callMethodToApi(content).then(function(success){

							setSaveMessage(success.updated_at);

						}, function(error){
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
							throw new Error("Unable to create a " + contentType + ' section');
						});
				  	}

				  	var applyMethod = function() {
				  		scope.saveMessage = 'Saving ...';
				  		return scope.sectionId ? update() : make();
				  	}

					newDebounce.Invoke(function(){ scope.$apply(applyMethod); }, 1000, false);
				});

				function getContent() {
					for(var i in scope.$parent.$parent.sections) {
						var item = scope.$parent.$parent.sections[i];
						if(item.order == scope.$parent.$sIndex) {
							return item;
						}
					}
				}

				function setSaveMessage(updated_at) {
					scope.saveMessage = 'Saved ' + $filter('date')(new Date(updated_at), 'h:mm:ss a');
				}
			}
		}
	}
]);