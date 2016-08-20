/**
*	@description: file-upload service that handles fileUploading
*	
*/
angular
.module('isu.file-upload', ['isu.provider'])
.factory('isuFileUploadService', ['isuSectionProvider',
	function(isuSectionProvider) {

		/* =================================================
		*
		*				PUBLIC FUNCTIONS
		*
		* ================================================ */

		/*
		*
		* @params: data: {file, title, target, parent_id, type}
		*/ 
		function uploadFile(data) {
			return callHttp(data, 'POST');
		}

		/*
		*
		* @params: data: {file, title}
		*/ 
		function updateFile(data) {
			return callHttp(data, 'PATCH');
		}

		/*
		*
		* @params: id
		*/
		function getFile(type, parent_id, id) {
			return $http.get(type+'/'+parent_id+'/file/'+id).then(function(results){
				return results;
			}, function(error){
				return error;
			});
		}


		/* =================================================
		*
		*				STATIC FUNCTIONS
		*
		* ================================================ */

		function callHttp(data, method) {

			var targetRoute = makeRoute(data);
			var title = makeTitle(data);

			angular.extend(isuSectionProvider.defaults, 
				{target: targetRoute, method: method});	

			var _data = {
				file: data.file,
				title: title
			}
			
			return isuSectionProvider.callMethodToApi(_data).then(function(results){
				return results;
			}, function(error){
				return error;
			});
		}

		function makeRoute(data) {
			return data.target+'/'+data.parent_id+'/'+(data.type || 'file')+'/'+(data.slug || null);
		}

		function makeTitle(data) {
			return data.type+' for '+data.target+'_id: '+data.parent_id;
		}

		/* exports */
		return {
			uploadFile: uploadFile,
			updateFile: updateFile,
			getFile: getFile
		}
	}
])
/**
*	This should be able to work as directive, or directly reference
*	the service to be able to upload the file from a controller.
*	This directive exists as a link method to automate the process.
*/
.directive('isuFileUploader', ['isuSectionProvider',
	function(isuFileUploadService) {

		function linkMethod(scope, el, attrs, isuFileCtrl) {
			el.bind('change', function(ev) {
				
				ev.preventDefault();
				// give function datatype and then the id
				var data = angular.extend({}, scope.$eval(attrs.isuFileUploader));
			});
		}

		return {
			restrict: 'AE',
			scope: {

			},
			link: linkMethod
		}
	}
]);