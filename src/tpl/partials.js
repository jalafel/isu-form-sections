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
  		template: ['<section style="order:'+s+'sections[$sIndex].order'+e+'" id="object-'+s+'sections[$sIndex].order'+e+'"',
					'sectionable section-id="sections[$sIndex].id || null" save-message="saveMessage">',
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
					'<md-input-container>',
					'<label>Heading</label>',
					'<input type="text" ng-model="sections[$sIndex].content.heading"/>',
					'</md-input-container>',
					
					'<md-input-container>',
					'<label>Subheading</label>',
					'<input type="text" ng-model="sections[$sIndex].content.subheading"/>',
					'</md-input-container>',

					'<text-angular ng-model="sections[$sIndex].content.text"></text-angular>',

					'</span>',

					'<input type="hidden" ng-model="sections[$sIndex].content.image.description"/>',
					'</fieldset>',
					'</section>'].join('')
	}

};

