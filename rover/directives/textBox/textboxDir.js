'use strict';

sntRover.directive('rvTextbox', function ($timeout) {

           return {
                      restrict: 'AE',
                      replace: 'true',
                      scope: {
                                 value: '=value',
                                 name: '@name',
                                 label: '@label',
                                 placeholder: '@placeholder',
                                 required: '@required',
                                 id: '@id',
                                 styleclass: '@styleclass',
                                 inputtype: '@inputtype',
                                 readonly: '@readonly',
                                 maxlength: '@maxlength',
                                 disabled: '=disabled'

                      },
                      templateUrl: "/assets/directives/textBox/textboxDirective.html"

           };
});