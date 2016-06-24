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
				  		var content = getContent();
				  		return scope.sectionId ? update(content) : make(content);
				  	}

					newDebounce.Invoke(function(){ scope.$apply(applyMethod); }, 1000, false);
				});

			  	scope.$on('destroySectionFromView', function(ev, data) {
			  		ev.preventDefault();
					var contentType = data.contentType.toLowerCase();
			  		var target = url.concat(contentType+'section/'+scope.sectionId);

					angular.extend(isuSectionProvider.defaults, { target: target, method: 'DELETE'});
					isuSectionProvider.callMethodToApi().then(function(success){
					}, function(error){
						throw new Error("Unable to delete this " + contentType + ' section');
					});
				})

			  	scope.$on('saveAllSections', function(ev, data) {
			  		ev.preventDefault();

			  		var sections = getSections();

			  		for(var i in sections) {
						var contentType = sections[i].type.toLowerCase();
						var target = url.concat(contentType+'section/'+( sections[i].id ||'' ));
						var method = sections[i].id ? 'PATCH' : 'POST';

						angular.extend(isuSectionProvider.defaults, { target: target, method: method});		
						isuSectionProvider.callMethodToApi(sections[i]).then(function(success){

							setSaveMessage(success.updated_at);

						}, function(error){
							throw new Error("Unable to update this " + contentType + ' section');
						});
			  		}
			  	});

				function getContent() {
					for(var i in scope.$parent.$parent.sections) {
						var item = scope.$parent.$parent.sections[i];
						if(item.order == scope.$parent.$sIndex) {
							return item;
						}
					}
				}

				function getSections() {
					return scope.$parent.$parent.sections;
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