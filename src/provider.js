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
	                		if (typeof e === 'number' || ( e === 'string' && e.charAt(0) !== '$'))
	                			transformObjectToFormData(fd, i, t);


	                	} else if(!angular.isUndefined(i) && ( e.charAt(0) !== '$'))
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

