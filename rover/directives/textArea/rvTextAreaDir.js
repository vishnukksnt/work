'use strict';

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

sntRover.directive('rvTextarea', function ($timeout) {
           var _scope;

           return {
                      restrict: 'E',
                      replace: 'true',
                      scope: (_scope = {
                                 value: '=value',
                                 name: '@name',
                                 label: '@label',
                                 placeholder: '@placeholder',
                                 required: '@required',
                                 id: '@id',
                                 divClass: '@divClass',
                                 textAreaClass: '@textAreaClass',
                                 rows: '@rows'
                      }, _defineProperty(_scope, 'required', '=required'), _defineProperty(_scope, 'maxlength', '@maxlength'), _scope),
                      templateUrl: '/assets/directives/textArea/rvTextArea.html'

           };
});