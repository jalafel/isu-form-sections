describe("Check business logic that is maintained within the create-section directive controller works",
function() {
   /** controller functions
	*
	* @move()
	* @nextOrderance()
	* @removeByOrder
	* @flattenOrder
	* @updateScopeIndex
	* @persistExisting
	*/

   /** link fn
    * 
    * @watchCollection
    * @watch for md-select
    * @eventOn for remove
    * @eventOn for add
    */


	beforeEach(module("isu-form-sections"))

	describe("isuCreateSection", function(){

	    var directive,
	    scope,
	    template,
	    isolateScope,
	    controller, 
	    article = {title: "Article Title"},
	    sections = [];


	    beforeEach(inject(function($rootScope, $compile, $controller) {
	        scope = $rootScope.$new();
	        scope.article = article;

	        directive = angular.element("<div isu-create-section isu-bind-section='article'></isu-create-section>");
	        
	        $compile(directive)(scope);
	        
	        isolateScope = directive.isolateScope();
	        scope.$digest();
	    }));

		it("should instantiate and render random amount of diff sections in the DOM", inject(function() {

			var i, randKey, type, 
			randInt = getRand(10, 1), 
			arr = isolateScope.typeArray;

			console.log('creating '+randInt+' section types');
			for(i = 0; i < randInt; i++) {
				expect(isolateScope.create.nextOrderance()).toBe(i);

				randKey = getRand(arr.length);
				isolateScope.create.type = arr[randKey];
				type = arr[randKey].replace(/([A-Z])/g, ' $1').trim();

				scope.$digest();
				expect(directive[0].innerHTML).toContain('<header>'+type+' Section</header>');
				expect(directive[0].innerHTML).toContain('id="object-'+i+'"');
			}

			expect(isolateScope.sections.length).toBe(randInt);

			it("should not move the first in orderance", inject(function(){
				expect(isolateScope.create.move(0, false)).toBe(false);
			}));

			it("should not move the last in orderance", inject(function(){
				var len = isolateScope.sections.length - 1;
				expect(isolateScope.create.move(len, true)).toBe(false);
			}));		

			it("should move random key and reorder without duplication of orders", inject(function(){
				var e = getRand(randInt, 1), orders = [], movedSection;
				
				movedSection = isolateScope.create.move(e, 
					(e > 1 && e+1 !== isolateScope.sections.length) ? true : false);
				
				for(i = 0; i < movedSection.length; i++){
					orders.push(movedSection[i].order);
				}
				
				expect(checkIfArrayIsUnique(orders)).toBe(true);
			
				orders.push(e);
				expect(checkIfArrayIsUnique(orders)).toBe(false);
			}));

			it("should remove random section and reorder", inject(function(){
				var j = getRand(randInt, 1), 
				orig = isolateScope.sections,
				oLen = isolateScope.sections.length,
				orders = [],
				indices = [];

				isolateScope.create.remove(j);
				expect(isolateScope.sections.length).toBe(oLen - 1);

				for(i = 0; i < isolateScope.sections.length; i++){
					orders.push(isolateScope.sections[i].order);
				}
				
				expect(checkIfArrayIsUnique(orders)).toBe(true);
				expect(directive[0].innerHTML).toContain('id="object-'+(oLen - 1)+'"');

				scope.$digest();

				for(i = 0, n = isolateScope.sections.length; i < n; i++){
					expect(directive[0].innerHTML).toContain('id="object-'+i+'"');
					
					indices.push(isolateScope.sections[i].$getChildScope().$sIndex);
				}

				expect(checkIfArrayIsUnique(indices)).toBe(true);

				setTimeout(function() {
					expect(directive[0].innerHTML).not.toContain('id="object-'+n+'"');
			    }, 100);

			}));

		}));



		/**
		*	Helper functions.
		*
		*/
		function getRand(max, min) {
			min = min || 0;
			return Math.floor(Math.random() * (max - min)) + min;
		}

		function checkIfArrayIsUnique(arr) {
		    var map = {}, i, size;

		    for (i = 0, size = arr.length; i < size; i++){
		        if (map[arr[i]]){
		            return false;
		        }

		        map[arr[i]] = true;
		    }

		    return true;
		}


	})

})