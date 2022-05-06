'use strict';

module.exports = {
												getList: function getList() {
																								var sharedRoot = 'shared/',
																								    jsLibRoot = sharedRoot + 'lib/js/',
																								    roverRoot = 'rover/',
																								    paymenRootPath = 'payment/',
																								    controllerRoot = roverRoot + 'controllers/',
																								    serviceRoot = roverRoot + 'services/',
																								    directiveRoot = roverRoot + 'directives/',
																								    constantsRoot = roverRoot + 'constants/',
																								    paymentRoot = paymenRootPath + 'constants/',
																								    roverJsAssets = {
																																				minifiedFiles: [jsLibRoot + 'jquery.min.js', jsLibRoot + 'jquery-ui.min.js', jsLibRoot + 'jquery.ui.touch-punch.min.js', jsLibRoot + 'angular.1.7.7.min.js', jsLibRoot + 'angular-route.1.7.7.min.js', jsLibRoot + 'angular-ui-router.1.0.15.min.js', jsLibRoot + 'angular-animate.1.7.7.min.js', jsLibRoot + 'angular-dragdrop.min.js', jsLibRoot + 'oclazyload/ocLazyLoad.min.js', jsLibRoot + 'angular-sanitize.1.7.7.min.js', jsLibRoot + 'angular-translate.2.18.1.min.js', jsLibRoot + 'angular-translate-loader-static-files.2.18.1.min.js', jsLibRoot + 'ui-utils.min.js', jsLibRoot + 'underscore.min.js', jsLibRoot + 'ngDialog.min.js', jsLibRoot + 'fastclick/fastclick.min.js', jsLibRoot + 'moment.min.js', jsLibRoot + 'toastr/toastr.min.js', jsLibRoot + 'd3/d3.v5.min.js', jsLibRoot + 'd3/d3-scale.v3.min.js', jsLibRoot + 'idle-timer.min.js', jsLibRoot + 'jsZip/jszip.min.js', jsLibRoot + 'fileSaver/filesaver.min.js',
																																				// Eliminate all spec files
																																				'!**/*.spec.js'],
																																				nonMinifiedFiles: [jsLibRoot + 'iscroll.js', jsLibRoot + 'ng-iscroll.js', jsLibRoot + 'Utils.js', jsLibRoot + 'date.js', jsLibRoot + 'fastclick/snt-fastclick-override.js', jsLibRoot + 'sortable.js', sharedRoot + 'interceptors/**/*.js', sharedRoot + 'directives/**/*.js', sharedRoot + 'baseCtrl.js', sharedRoot + 'cardReaderCtrl.js',
																																				// sharedRoot + 'cordova.js',
																																				sharedRoot + 'sntTransitionManager/**/*.js', sharedRoot + 'sntCurrency/sntCurrencyFilter.js', sharedRoot + 'sntCanvasUtil/**/*.js', sharedRoot + 'sntUtils/app.js', sharedRoot + 'sntUtils/**/*.js', roverRoot + 'rvRouters/**/*.js', roverRoot + 'rvApp.js', roverRoot + 'rvRouter.js', roverRoot + 'rvCardOperations.js', roverRoot + 'rvMockCardOperations.js', roverRoot + 'rvMLIOperations.js', roverRoot + 'rvUUIDService.js', roverRoot + 'rvDesktopUUIDService.js', roverRoot + 'rvSwipeOperations.js', roverRoot + 'rvCacheVaultModule.js', roverRoot + 'rvDesktopCardOperations.js', roverRoot + 'rvSntApp.js', roverRoot + 'filters/roundFilter.js', roverRoot + 'filters/highlightWordsFilter.js', roverRoot + 'filters/rvTrustAsResourceUrl.js', controllerRoot + 'rvTopCtrl.js', controllerRoot + 'rvRoverController.js', controllerRoot + 'sharedMethodsCtrl.js', controllerRoot + 'bill/rvValidateEmailOnPaymentCtrl.js', controllerRoot + 'dashboard/**/*.js', controllerRoot + 'availability/rvAvailabilityButtonCtrl.js', controllerRoot + 'search/**/*.js', controllerRoot + 'errorPopup/rvTimeoutErrorCtrl.js', controllerRoot + 'workstation/rvWorkstationCtrl.js', controllerRoot + 'rvOWSErrorCtrl.js', controllerRoot + 'deviceStatus/rvDeviceStatusCtrl.js', controllerRoot + 'rvHouseEventsListPopupCtrl.js', serviceRoot + 'baseWebSrvV2.js', serviceRoot + 'rvBaseWebSrv.js', serviceRoot + 'rvBaseWebSrvV2.js', serviceRoot + 'rvDashboardSrv.js', serviceRoot + 'menu/rvMenuSrv.js', serviceRoot + 'rvOWSTestSrv.js', serviceRoot + 'jsMappings/jsMappingsSrv.js', serviceRoot + 'permissions/rvPermissionSrv.js', serviceRoot + 'rvSearchSrv.js', serviceRoot + 'rvHotelDetailsSrv.js', serviceRoot + 'housekeeping/rvHkRoomStatusSrv.js', serviceRoot + 'util/rvUtilSrv.js', serviceRoot + 'availability/rvAvailabilitySrv.js', serviceRoot + 'workstation/workstationSrv.js', serviceRoot + 'housekeeping/rvHkRoomStatusSrv.js', serviceRoot + 'deviceStatus/rvDeviceStatusSrv.js', serviceRoot + 'rvAutomaticEmailSrv.js', serviceRoot + 'analytics/**/*.js', serviceRoot + 'rvHouseEventsListSrv.js', directiveRoot + 'Outside Click handler/outsideClickDirective.js', directiveRoot + 'pagination/*.js', directiveRoot + 'fullscreen/*.js', paymentRoot + 'payConfig.js',

																																				// Eliminate all spec files
																																				'!**/*.spec.js',
																																				// Workers will be loaded separately
																																				'!**/workers/**/*.js']
																								};

																								return roverJsAssets;
												}
};