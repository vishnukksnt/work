angular
.module("ngClassWithoutAnimation", [])
.directive('ngClassWithoutAnimation', function() {

    return {
      restrict: 'AC',
      link: function(scope, element, attr) {
        var oldVal, name = 'ngClassWithoutAnimation', selector = true;

        scope.$watch(attr[name], ngClassWatchAction, true);

        attr.$observe('class', function(value) {
          ngClassWatchAction(scope.$eval(attr[name]));
        });

        function addClasses(classes) {
          var newClasses = digestClassCounts(classes, 1);

          attr.$addClass(newClasses);
        }

        function removeClasses(classes) {
          var newClasses = digestClassCounts(classes, -1);

          attr.$removeClass(newClasses);
        }

        function digestClassCounts (classes, count) {
          var classCounts = element.data('$classCounts') || {};
          var classesToUpdate = [];

          _.each(classes, function (className) {
            if (count > 0 || classCounts[className]) {
              classCounts[className] = (classCounts[className] || 0) + count;
              if (classCounts[className] === +(count > 0)) {
                classesToUpdate.push(className);
              }
            }
          });
          element.data('$classCounts', classCounts);
          return classesToUpdate.join(' ');
        }

        function updateClasses (oldClasses, newClasses) {
          var toAdd = arrayDifference(newClasses, oldClasses);
          var toRemove = arrayDifference(oldClasses, newClasses);

          toRemove = digestClassCounts(toRemove, -1);
          toAdd = digestClassCounts(toAdd, 1);

          if (toAdd.length === 0) {
            $(element).removeClass(toRemove);
          } else if (toRemove.length === 0) {
            $(element).addClass(toAdd);
          } else {
            $(element).attr("class", toAdd, toRemove);
          }
        }

        function ngClassWatchAction(newVal) {
          if (selector === true || scope.$index % 2 === selector) {
            var newClasses = arrayClasses(newVal || []);

            if (!oldVal) {
              addClasses(newClasses);
            } else if (!_.isEqual(newVal, oldVal)) {
              var oldClasses = arrayClasses(oldVal);

              updateClasses(oldClasses, newClasses);
            }
          }
          oldVal = _.clone(newVal);
        }


	    function arrayDifference(tokens1, tokens2) {
	      var values = [];

	      outer:
	      for (var i = 0; i < tokens1.length; i++) {
	        var token = tokens1[i];

	        for (var j = 0; j < tokens2.length; j++) {
	          if (token === tokens2[j]) {
              continue outer;
            }
	        }
	        values.push(token);
	      }
	      return values;
	    }

	    function arrayClasses (classVal) {
	      if (_.isArray(classVal)) {
	        return classVal;
	      } else if (_.isString(classVal)) {
	        return classVal.split(' ');
	      } else if (_.isObject(classVal)) {
	        var classes = [], i = 0;

	        _.each(classVal, function(v, k) {
	          if (v) {
	            classes = classes.concat(k.split(' '));
	          }
	        });
	        return classes;
	      }
	      return classVal;
	    }
    }
	};
});