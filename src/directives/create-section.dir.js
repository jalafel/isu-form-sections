/**
 * @description
 * @name isuCreateSection
 */
angular
.module('isu.create-section', ['isu.sections', 'isu.provider'])
.directive('isuCreateSection',  ['$rootScope', '$compile', '$interpolate', '$timeout', 'Section', 'isuSectionProvider',

function ($compile, $interpolate, $timeout, Section, isuSectionProvider) {
	
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
				if(o.hasOwnProperty('images')) 
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
