'use strict';

// File reader directive - in HTML <input type="file" ng-model="image" accept="image/*" app-filereader />
sntRover.directive('appFilereader', function ($q) {
    var slice = Array.prototype.slice;

    return {
        restrict: 'A',
        require: '?ngModel',
        link: function link(scope, element, attrs, ngModel) {
            if (!ngModel) {
                return;
            }
            ngModel.$render = function () {};

            element.bind('change', function (e) {
                var element = e.target;

                $q.all(slice.call(element.files, 0).map(readFile)).then(function (values) {
                    if (element.multiple) {
                        ngModel.$setViewValue(values);
                    } else {
                        ngModel.$setViewValue(values.length ? values[0] : null);
                    }
                });

                function readFile(file) {

                    var deferred = $q.defer();

                    var reader = new FileReader();

                    reader.onload = function (e) {
                        if (file) {
                            file.base64 = e.target.result;
                            scope.$emit('FILE_UPLOADED', file);
                        }

                        deferred.resolve(e.target.result);
                    };
                    reader.onerror = function (e) {
                        deferred.reject(e);
                    };
                    reader.readAsDataURL(file);
                    scope.fileName = file.name;

                    return deferred.promise;
                }
            }); // change
        } // link

    }; // return
}) // appFilereader
;