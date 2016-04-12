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

