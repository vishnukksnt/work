"use strict";

sntRover.directive("rvDropFile", function () {
    return {
        restrict: "A",
        scope: {
            dragInProgress: '='
        },
        link: function link(scope, elem) {
            var dragTime = 0;

            elem.bind('dragover', function (e) {
                e.stopPropagation();
                e.preventDefault();
            });
            elem.bind('dragenter', function (e) {
                e.stopPropagation();
                e.preventDefault();
                dragTime = new Date().getTime();
                scope.$apply(function () {
                    scope.dragInProgress = true;
                });
            });
            elem.bind('dragleave', function (e) {
                e.stopPropagation();
                e.preventDefault();
                if (new Date().getTime() - dragTime > 5) {
                    scope.$apply(function () {
                        scope.dragInProgress = false;
                    });
                }
            });
            elem.bind('drop', function (evt) {
                evt.stopPropagation();
                evt.preventDefault();
                var files = evt.originalEvent && evt.originalEvent.dataTransfer ? evt.originalEvent.dataTransfer.files : [];
                var filesRead = 0;

                for (var i = 0, f; f = files[i]; i++) {
                    var reader = new FileReader();

                    reader.onload = function (theFile) {
                        return function (e) {
                            var newFile = {
                                name: theFile.name,
                                type: theFile.type,
                                size: theFile.size,
                                lastModifiedDate: theFile.lastModifiedDate,
                                base64: e.target.result
                            };

                            scope.$emit('FILE_UPLOADED', newFile);
                            filesRead++;
                            if (filesRead === files.length) {
                                scope.$apply(function () {
                                    scope.$emit('FILE_UPLOADED_DONE');
                                });
                            }
                        };
                    }(f);
                    reader.onerror = function () {
                        scope.$apply(function () {
                            scope.dragInProgress = false;
                        });
                    };

                    reader.readAsDataURL(f);
                }
            });
        }
    };
});