"use strict";

(function () {
    function r(e, n, t) {
        function o(i, f) {
            if (!n[i]) {
                if (!e[i]) {
                    var c = "function" == typeof require && require;if (!f && c) return c(i, !0);if (u) return u(i, !0);var a = new Error("Cannot find module '" + i + "'");throw a.code = "MODULE_NOT_FOUND", a;
                }var p = n[i] = { exports: {} };e[i][0].call(p.exports, function (r) {
                    var n = e[i][1][r];return o(n || r);
                }, p, p.exports, r, e, n, t);
            }return n[i].exports;
        }for (var u = "function" == typeof require && require, i = 0; i < t.length; i++) {
            o(t[i]);
        }return o;
    }return r;
})()({ 1: [function (require, module, exports) {
        sntRover.controller('rvExternalReferencesCtrl', ['$rootScope', '$scope', 'RVExternalReferencesSrv', '$filter', function ($rootScope, $scope, RVExternalReferencesSrv, $filter) {
            BaseCtrl.call(this, $scope);

            var resetScroller = function resetScroller(timer) {
                $scope.$emit("CHILD_CONTENT_MOD", timer || 0);
            },
                save = function save(reference) {
                var onSaveSuccess = function onSaveSuccess(response) {
                    $scope.errorMessage = "";
                    reference.id = response.id;
                },
                    options = {
                    params: {
                        reference: reference,
                        reservationId: $scope.reservationParentData.reservationId
                    },
                    successCallBack: onSaveSuccess
                };

                $scope.callAPI(RVExternalReferencesSrv.save, options);
            },
                update = function update(reference) {
                var onUpdateSuccess = function onUpdateSuccess() {
                    $scope.errorMessage = "";
                },
                    options = {
                    params: {
                        reference: reference,
                        reservationId: $scope.reservationParentData.reservationId
                    },
                    successCallBack: onUpdateSuccess
                };

                $scope.callAPI(RVExternalReferencesSrv.update, options);
            },
                remove = function remove(reference) {
                var onDeleteSuccess = function onDeleteSuccess() {
                    $scope.errorMessage = "";
                    if ($scope.stateExternalRef.references.length === 1) {
                        $scope.stateExternalRef.references.push(RVExternalReferencesSrv.getEmptyRow());
                    }
                    $scope.stateExternalRef.references = _.without($scope.stateExternalRef.references, reference);
                    resetScroller();
                },
                    options = {
                    params: {
                        referenceId: reference.id,
                        reservationId: $scope.reservationParentData.reservationId
                    },
                    successCallBack: onDeleteSuccess
                };

                $scope.callAPI(RVExternalReferencesSrv.remove, options);
            };

            $scope.stateExternalRef = {
                viewDetails: false,
                thirdParties: [],
                references: []
            };

            $scope.toggleDetails = function () {
                var toggleView = function toggleView() {
                    $scope.stateExternalRef.viewDetails = !$scope.stateExternalRef.viewDetails;
                    resetScroller(100);
                },
                    initializeData = function initializeData(response) {
                    $scope.stateExternalRef.thirdParties = response.systems;
                    $scope.stateExternalRef.references = response.references;
                    _.each($scope.stateExternalRef.references, function (reference) {
                        if (reference.is_primary) {
                            reference.external_confirm_no += $filter('translate')('PRIMARY_EXTERNAL_REFERENCE');
                        }
                    });
                    toggleView();
                },
                    options = {
                    params: $scope.reservationParentData.reservationId,
                    successCallBack: initializeData
                };

                if (!$scope.stateExternalRef.viewDetails) {
                    $scope.callAPI(RVExternalReferencesSrv.getExternalData, options);
                } else {
                    toggleView();
                }
            };

            $scope.deleteReference = function (reference) {
                if (reference.id) {
                    remove(reference);
                }
            };

            $scope.addNewRow = function () {
                $scope.stateExternalRef.references.push(RVExternalReferencesSrv.getEmptyRow());
                resetScroller(100);
            };

            $scope.onEditReference = function (reference) {
                if (!reference.id && reference.external_interface_type_id && reference.external_confirm_no) {
                    save(reference);
                } else if (reference.id) {
                    update(reference);
                }
            };

            $scope.getExtRefText = function (reference, description) {
                var externalSys = _.find($scope.stateExternalRef.thirdParties, {
                    id: reference
                });

                return externalSys.name + (description && description !== externalSys.name ? " [" + description + "]" : "");
            };
        }]);
    }, {}] }, {}, [1]);