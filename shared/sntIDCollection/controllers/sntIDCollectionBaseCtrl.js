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
		angular.module('sntIDCollection').controller('sntIDCollectionBaseCtrl', function ($scope, sntIDCollectionSrv, sntIDCollectionUtilsSrv, screenModes, $timeout, $log) {

			var resetScreenData = function resetScreenData() {
				$scope.screenData = {
					frontSideImage: '',
					backSideImage: '',
					imageSide: 0,
					scanMode: screenModes.validate_subscription,
					idDetails: {},
					needBackSideScan: false,
					extCamForFrontIDActivated: false,
					extCamForBackIDActivated: false
				};
			};
			var domIDMappings;

			var runDigestCycle = function runDigestCycle() {
				if (!$scope.$$phase) {
					$scope.$digest();
				}
			};

			$scope.deviceConfig = {
				useExtCamera: false,
				useiOSAppCamera: false,
				useExtCamForFR: false,
				useAutoDetection: false,
				idCapturePluginName: '',
				idCaptureActionName: '',
				useAilaDevice: false,
				useThirdPartyScan: false,
				thirdPatrtyConnectionUrl: ''
			};

			var stopVideoStream = function stopVideoStream() {
				if (window.localVideoStream && window.localVideoStream.getVideoTracks() && window.localVideoStream.getVideoTracks().length) {
					window.localVideoStream.getVideoTracks()[0].stop();
				}
			};

			$scope.setIDsForImageElements = function (domIDMapping) {
				// Incase the image elements have different IDs in different places
				domIDMappings = {
					front_side_upload: domIDMapping ? domIDMapping.front_side_upload : 'front-image',
					back_side_upload: domIDMapping ? domIDMapping.back_side_upload : 'back-image',
					front_image_preview: domIDMapping ? domIDMapping.front_image_preview : 'front-side-image',
					back_image_preview: domIDMapping ? domIDMapping.back_image_preview : 'back-side-image',
					face_img_upload: domIDMapping ? domIDMapping.face_img_upload : 'face-image-upload',
					face_image: domIDMapping ? domIDMapping.face_image : 'face-image'
				};
			};

			/** ******* THIRD PARTY SCAN ACTIONS STARTS HERE ********************/

			var frontSideResults;
			var thirdPatrtyScanFinalActions = function thirdPatrtyScanFinalActions(data) {
				$timeout(function () {
					// Process response
					var response = sntIDCollectionUtilsSrv.formatResultsFromThirdParty(data.doc);

					$scope.screenData.scanMode = screenModes.final_id_results;
					if ($scope.screenData.imageSide === 0) {
						response.back_side_image = "";
					}
					$scope.$emit('FINAL_RESULTS', response);

					$scope.screenData.idDetails = response;
					$('#' + 'id-front-side').attr('src', response.front_side_image);
					if (response.back_side_image) {
						$('#' + 'id-back-side').attr('src', response.back_side_image);
					}
				}, 2000);
			};

			var scanIdUsingThirdParty = function scanIdUsingThirdParty() {
				if (sntIDCollectionSrv.WebSocketObj && sntIDCollectionSrv.WebSocketObj.readyState === 1) {
					$scope.$emit('IMAGE_ANALYSIS_STARTED');

					var json = {
						'command': 'cmd_scan_with_3rd_party_scanner',
						'timeout': sntIDCollectionUtilsSrv.thirdPartyScannerTimeout,
						'workstation_id': sntIDCollectionUtilsSrv.workstation_id
					};

					sntIDCollectionSrv.WebSocketObj.send(JSON.stringify(json));
				} else {
					if ($scope.screenData.imageSide === 0) {
						$scope.screenData.scanMode = screenModes.upload_front_image_failed;
					} else {
						$scope.screenData.scanMode = screenModes.upload_back_image_failed;
					}
					createWebSocketConnection();
				}
			};

			var WebSocketActions = function WebSocketActions(evt) {
				var response = JSON.parse(evt.data);
				// if ResponseCode is not 0, the scan was failure
				if (response.ResponseCode && response.ResponseCode.toLowerCase() !== 0) {
					$timeout(function () {
						$scope.screenData.scanMode = $scope.screenData.imageSide === 0 ? screenModes.upload_front_image_failed : screenModes.upload_back_image_failed;
					}, 0);
					return;
				}

				if (response.should_scan_more && $scope.screenData.imageSide === 0) {
					$scope.screenData.scanMode = 'UPLOAD_BACK_IMAGE';
					frontSideResults = response.doc;
					$scope.screenData.imageSide = 1;
				} else if ($scope.screenData.imageSide === 1) {
					// join front side and back side details
					response.doc = Object.assign({}, frontSideResults, response.doc);
				}
				thirdPatrtyScanFinalActions(response);
			};

			var createWebSocketConnection = function createWebSocketConnection() {
				if (sntIDCollectionSrv.WebSocketObj && sntIDCollectionSrv.WebSocketObj.readyState === 1) {
					sntIDCollectionSrv.WebSocketObj.close();
				}

				sntIDCollectionSrv.WebSocketObj = new WebSocket($scope.deviceConfig.thirdPatrtyConnectionUrl + '?workstation_id=' + sntIDCollectionUtilsSrv.workstation_id);
				sntIDCollectionSrv.WebSocketObj.onmessage = function (evt) {
					WebSocketActions(evt);
				};
			};
			/** ******* THIRD PARTY SCAN ACTIONS ENDS HERE ********************/

			$scope.setConfigurations = function (config) {
				$scope.deviceConfig = config;
				if (config.useThirdPartyScan) {
					createWebSocketConnection();
				}
			};

			var getImageDetails = function getImageDetails() {
				sntIDCollectionSrv.getImageDetails($scope.screenData.imageSide).then(function (response) {

					$scope.screenData.needBackSideScan = !(response.image_classification && response.image_classification.Type && response.image_classification.Type.Size === 3);

					if (!$scope.screenData.needBackSideScan || $scope.screenData.imageSide === 1) {
						$scope.screenData.scanMode = screenModes.confirm_id_images;
						$scope.$emit('ID_BACK_IMAGE_CAPTURED');
					} else {
						$scope.screenData.scanMode = screenModes.confirm_front_image;
						$scope.$emit('ID_FRONT_IMAGE_CAPTURED');
					}
					if (response.image) {
						var base64String = sntIDCollectionUtilsSrv.base64ArrayBuffer(response.image);

						$scope.$emit('IMAGE_UPDATED', {
							isFrontSide: $scope.screenData.imageSide === 0,
							imageData: base64String
						});
						if ($scope.screenData.imageSide === 0) {
							$('#' + domIDMappings.front_image_preview).attr('src', base64String);
						} else {
							$('#' + domIDMappings.back_image_preview).attr('src', base64String);
						}
					}
					stopVideoStream();
				}, function (response) {
					$log.error(response);
					stopVideoStream();
					$scope.$emit('IMAGE_ANALYSIS_FAILED');
					$scope.screenData.scanMode = $scope.screenData.imageSide === 0 ? screenModes.upload_front_image_failed : screenModes.upload_back_image_failed;
				});
			};

			var postBackImage = function postBackImage() {
				sntIDCollectionSrv.postBackImage($scope.screenData.backSideImage).then(function () {
					getImageDetails();
				}, function (response) {
					$log.error(response);
					$scope.$emit('IMAGE_ANALYSIS_FAILED', response);
					$scope.screenData.scanMode = screenModes.upload_back_image_failed;
					stopVideoStream();
				});
			};

			var postFrontImage = function postFrontImage() {
				sntIDCollectionSrv.postFrontImage($scope.screenData.frontSideImage).then(function () {
					getImageDetails();
				}, function (response) {
					$log.error(response);
					$scope.$emit('IMAGE_ANALYSIS_FAILED', response);
					$scope.screenData.scanMode = screenModes.upload_front_image_failed;
					stopVideoStream();
				});
			};

			var getDocInstance = function getDocInstance() {
				sntIDCollectionSrv.getDocInstance().then(function (response) {
					if (response) {
						postFrontImage();
					} else {
						$scope.screenData.scanMode = screenModes.upload_front_image_failed;
					}
				}, function (response) {
					$log.error(response);
					$scope.$emit('IMAGE_ANALYSIS_FAILED');
					$scope.screenData.scanMode = screenModes.upload_front_image_failed;
				});
			};

			var verifyFaceImageWithId = function verifyFaceImageWithId(frontSideImage, facialImage) {
				var facialRecognitionFailed = function facialRecognitionFailed(response) {
					$scope.$emit('FR_FAILED', response);
					$scope.screenData.scanMode = screenModes.facial_recognition_failed;
					stopVideoStream();
				};

				sntIDCollectionSrv.verifyFacialMatch(frontSideImage, facialImage).then(function (response) {
					// alert(response.FacialMatchConfidenceRating);
					if (response && response.FacialMatch && response.FacialMatchConfidenceRating > 95) {
						$scope.$emit('FR_SUCCESS');
						stopVideoStream();
					} else {
						facialRecognitionFailed(response);
					}
				}, facialRecognitionFailed);
			};

			var unmodifiedFrontImage, unmodifiedFaceImage;
			var processImage = function processImage(evt, frontSideImage, faceImage, previousState) {

				var file = evt.target;
				var reader = new FileReader();

				reader.onload = function (e) {
					if (window.File && window.FileReader && window.FileList && window.Blob) {
						var img = document.createElement('img');

						img.src = e.target.result;
						img.onload = function () {
							var imageData = sntIDCollectionUtilsSrv.resizeImage(img, file);

							if (faceImage) {
								unmodifiedFaceImage = sntIDCollectionUtilsSrv.dataURLtoBlob(reader.result);
								$timeout(function () {
									$scope.screenData.scanMode = screenModes.analysing_id_data;
								}, 0);
								verifyFaceImageWithId(unmodifiedFrontImage, unmodifiedFaceImage);
								$scope.$emit('FR_ANALYSIS_STARTED');
							} else if (frontSideImage) {
								unmodifiedFrontImage = sntIDCollectionUtilsSrv.dataURLtoBlob(reader.result);
								getDocInstance();
								$scope.screenData.frontSideImage = imageData;
							} else {
								$scope.screenData.backSideImage = imageData;
								postBackImage();
							}
							$scope.$emit('IMAGE_ANALYSIS_STARTED');
						};
					} else {
						$log.error('The File APIs are not fully supported in this browser.');
					}
				};
				if (file.files.length > 0) {
					reader.readAsDataURL(file.files[0]);
				} else {
					$timeout(function () {
						$scope.screenData.scanMode = previousState;
					}, 0);
				}
			};

			var retrieveFaceImage = function retrieveFaceImage() {
				sntIDCollectionSrv.getFaceImage().then(function (response) {
					$scope.$emit('FACE_IMAGE_RETRIEVED', response);
					sntIDCollectionSrv.deleteDocInstance().then(function () {}, function () {});
				}, function () {
					sntIDCollectionSrv.deleteDocInstance().then(function () {}, function () {});
				});
			};

			$scope.confirmImages = function () {
				$scope.screenData.scanMode = screenModes.analysing_id_data;
				sntIDCollectionSrv.getResults().then(function (response) {
					$log.info(response);
					$scope.screenData.scanMode = screenModes.final_id_results;
					$scope.screenData.idDetails = response.Fields;
					$scope.screenData.idDetails.iDAuthenticationStatus = sntIDCollectionUtilsSrv.retrieveAuthenticationStatus(response.Result);
					$scope.screenData.idDetails.expirationStatus = sntIDCollectionUtilsSrv.isIDExpired(response.Alerts) ? 'Expired' : 'Unexpired';

					var idDetailsForPms = sntIDCollectionUtilsSrv.formatResults(response.Fields);

					idDetailsForPms.iDAuthenticationStatus = sntIDCollectionUtilsSrv.retrieveAuthenticationStatus(response.Result);
					idDetailsForPms.expirationStatus = sntIDCollectionUtilsSrv.isIDExpired(response.Alerts) ? 'Expired' : 'Unexpired';
					$scope.$emit('FINAL_RESULTS', idDetailsForPms);
					retrieveFaceImage();
				}, function (response) {
					$log.error(response);
					$scope.screenData.scanMode = screenModes.analysing_id_data_failed;
				});
			};

			$scope.confirmFrontImage = function () {
				$scope.screenData.imageSide = 1;
				$scope.screenData.scanMode = $scope.screenData.needBackSideScan ? screenModes.upload_back_image : screenModes.confirm_id_images;
				$scope.$emit('FRONT_IMAGE_CONFIRMED');
			};

			$scope.frontImageChanged = function (evt) {
				$scope.screenData.frontSideImage = '';
				processImage(evt, true, false, angular.copy($scope.screenData.scanMode));
				$scope.screenData.scanMode = screenModes.analysing_front_image;
			};

			$scope.backImageChanged = function (evt) {
				$scope.screenData.backSideImage = '';
				processImage(evt, false, false, angular.copy($scope.screenData.scanMode));
				$scope.screenData.scanMode = screenModes.analysing_back_image;
			};

			$scope.faceImageChanged = function (evt) {
				$scope.screenData.faceImage = '';
				processImage(evt, false, true, angular.copy($scope.screenData.scanMode));
			};

			var processImageFromIos = function processImageFromIos(faceImage, frontSideImage, imageData) {
				var img = document.createElement('img');

				var unmodifiedFaceImage = "data:image/jpeg;base64," + imageData;

				img.src = unmodifiedFaceImage;
				img.onload = function () {
					// var imageData = sntIDCollectionUtilsSrv.resizeImage(img);

					if (faceImage) {
						unmodifiedFaceImage = sntIDCollectionUtilsSrv.dataURLtoBlob(unmodifiedFaceImage);
						verifyFaceImageWithId(unmodifiedFrontImage, unmodifiedFaceImage);
						$scope.screenData.scanMode = 'FACIAL_RECOGNITION_MODE';
						$scope.$emit('FR_ANALYSIS_STARTED');
						$scope.$digest();
					}
					// else if (frontSideImage) {
					// 	unmodifiedFrontImage = sntIDCollectionUtilsSrv.dataURLtoBlob(reader.result);
					// 	getDocInstance();
					// 	$scope.screenData.frontSideImage = imageData;
					// } else {
					// 	$scope.screenData.backSideImage = imageData;
					// 	postBackImage();
					// }
				};

				img.onerror = function () {
					$scope.$emit('FR_FAILED');
				};
			};

			var autoDetectIDAndProcessData = function autoDetectIDAndProcessData() {

				var cameraParams = {
					'CAPTURE_TIMER': 3,
					'PREVIEW_TIMER': $scope.deviceConfig.useAilaDevice ? 0 : 3,
					'CAMERA_TYPE': 'back_camera',
					'CAMERA_MESSAGES': {
						'DETECTING_FACE': 'WAITING FOR AN ID TO SCAN, PLEASE SHOW YOUR ID TO THE IPAD BACK CAMERA',
						'CANCEL': 'CANCEL',
						'TAKING_PHOTO': 'CAPTURING ID',
						'CAPTURE': 'CAPTURE NOW',
						'PROCEEDING_WITH_THE_IMAGE': 'PROCEEDING WITH THIS ID IMAGE',
						'RETAKE_PHOTO': 'RECAPTURE',
						'PROCEED': 'CONTINUE'
					}
				};

				var imageCaptured = function imageCaptured(response) {
					$scope.$emit('IMAGE_ANALYSIS_STARTED');
					var img = document.createElement('img');

					response = response ? response.image_base64 : '';
					var unmodifiedImage = 'data:image/png;base64,' + response;

					img.src = unmodifiedImage;
					unmodifiedImage = sntIDCollectionUtilsSrv.dataURLtoBlob(unmodifiedImage);
					img.onload = function () {

						if ($scope.screenData.imageSide === 0) {
							$scope.screenData.frontSideImage = unmodifiedImage;
							var imageData = sntIDCollectionUtilsSrv.resizeImage(img, undefined, 2560, 1920);

							unmodifiedFrontImage = imageData;
							getDocInstance();
						} else {
							$scope.screenData.backSideImage = unmodifiedImage;
							postBackImage();
						}
						runDigestCycle();
					};
					img.onerror = function () {
						$scope.$emit('IMAGE_ANALYSIS_FAILED');
						$scope.screenData.scanMode = $scope.screenData.imageSide === 0 ? screenModes.upload_front_image_failed : screenModes.upload_back_image_failed;
					};
				};

				// imageCaptured();
				var jsonstring = JSON.stringify(cameraParams);

				var pluginName = $scope.deviceConfig.idCapturePluginName ? $scope.deviceConfig.idCapturePluginName : 'AilaCordovaPlugin';
				var actionName = $scope.deviceConfig.idCaptureActionName ? $scope.deviceConfig.idCaptureActionName : 'captureID';

				cordova.exec(function (response) {
					$scope.$emit('IMAGE_ANALYSIS_STARTED');
					$scope.$emit('RUN_APPLY');
					imageCaptured(response);
				}, function () {
					$scope.$emit('IMAGE_ANALYSIS_FAILED');
					$scope.screenData.scanMode = $scope.screenData.imageSide === 0 ? screenModes.upload_front_image_failed : screenModes.upload_back_image_failed;
					$scope.$emit('RUN_APPLY');
				}, pluginName, actionName, [jsonstring]);
			};

			$scope.captureFrontImage = function () {
				if ($scope.deviceConfig.useThirdPartyScan) {
					scanIdUsingThirdParty();
				} else if (typeof cordova !== "undefined" && $scope.deviceConfig.useAutoDetection) {
					autoDetectIDAndProcessData();
				} else {
					$timeout(function () {
						angular.element(document.querySelector('#' + domIDMappings.front_side_upload)).click();
					}, 0);
				}
			};

			$scope.captureBackImage = function () {
				if ($scope.deviceConfig.useThirdPartyScan) {
					scanIdUsingThirdParty();
				} else if (typeof cordova !== "undefined" && $scope.deviceConfig.useAutoDetection) {
					autoDetectIDAndProcessData();
				} else {
					$timeout(function () {
						angular.element(document.querySelector('#' + domIDMappings.back_side_upload)).click();
					}, 0);
				}
			};

			$scope.startScanning = function () {
				resetScreenData();
				$('#' + domIDMappings.front_image_preview).attr('src', '');
				$('#' + domIDMappings.back_image_preview).attr('src', '');
				$scope.screenData.scanMode = screenModes.upload_front_image;
				$scope.$emit('CLEAR_PREVIOUS_DATA');
				if ($scope.deviceConfig.useExtCamera && !$scope.deviceConfig.useThirdPartyScan) {
					$scope.$emit('FRONT_SIDE_SCANNING_STARTED');
				}
			};

			$scope.validateSubsription = function () {
				sntIDCollectionSrv.validateCredentials().then(function () {
					$scope.screenData.scanMode = screenModes.valid_id_credentials;
					$scope.$emit('CREDENTIALS_VALIDATED');
				}, function (response) {
					$scope.screenData.scanMode = screenModes.invalid_id_credentials;
					$log.error(response);
				});
			};

			$scope.startFacialRecognition = function () {

				var cameraConfig = {
					'CAPTURE_TIMER': 3,
					'PREVIEW_TIMER': 3,
					'CAMERA_TYPE': 'front_camera',
					'CAMERA_MESSAGES': {
						'DETECTING_FACE': 'DETECTING FACE, PLEASE POSITION YOUR FACE STRAIGHT',
						'CANCEL': 'CANCEL',
						'TAKING_PHOTO': 'CAPTURING YOUR HEADSHOT',
						'CAPTURE': 'CAPTURE NOW',
						'PROCEEDING_WITH_THE_IMAGE': 'PROCEEDING WITH CAPTURED IMAGE',
						'RETAKE_PHOTO': 'RECAPTURE',
						'PROCEED': 'CONTINUE'
					}
				};

				if ($scope.deviceConfig.useiOSAppCamera) {
					cordova.exec(function (response) {
						processImageFromIos(true, undefined, response.image_base64);
					}, function (error) {
						$log.error(error);
						$scope.$emit('FR_FAILED');
					}, 'RVCardPlugin', 'captureFacePhoto', [JSON.stringify(cameraConfig)]);
				} else {
					$timeout(function () {
						angular.element(document.querySelector('#' + domIDMappings.face_img_upload)).click();
					}, 0);
				}
			};

			$scope.startExtCameraCapture = function (type) {
				$scope.$emit('EXT_CAMERA_STARTING');
				var video = type === 'front-image' ? document.querySelector('#id-video') : document.querySelector('#id-back-video');

				var cameraId = localStorage.getItem('ID_SCAN_CAMERA_ID');

				navigator.mediaDevices.getUserMedia({
					video: {
						deviceId: cameraId ? {
							exact: cameraId
						} : undefined,
						width: 2560,
						height: 1920
					}
				}).then(function handleSuccess(stream) {
					window.localVideoStream = stream;
					video.srcObject = stream;
					if (type === 'front-image') {
						$scope.screenData.extCamForFrontIDActivated = true;
					} else {
						$scope.screenData.extCamForBackIDActivated = true;
					}
					$scope.$emit('EXT_CAMERA_STARTED');
					$scope.$digest();
				}).catch(function () {
					$scope.$emit('EXT_CAMERA_FAILED');
				});
			};

			$scope.startFacialRecognitionUsingExtCamera = function () {
				$scope.screenData.extCamForSelfieActivated = false;
				$scope.screenData.scanMode = 'FACIAL_RECOGNITION_MODE';
				var video = document.querySelector('#fr-id-video');
				var cameraId = localStorage.getItem('FR_CAMERA_ID');

				$scope.$emit('FR_CAMERA_STARTING');
				navigator.mediaDevices.getUserMedia({
					video: {
						deviceId: cameraId ? {
							exact: cameraId
						} : undefined,
						width: 2560,
						height: 1920
					}
				}).then(function handleSuccess(stream) {
					window.localVideoStream = stream;
					video.srcObject = stream;
					$scope.screenData.extCamForSelfieActivated = true;
					$scope.$emit('EXT_CAMERA_STARTED');
					$scope.$digest();
				}).catch(function () {
					$scope.$emit('EXT_CAMERA_FAILED');
				});
			};

			$scope.captureFaceImageUsingExtCamera = function () {
				var video = document.querySelector('#fr-id-video');
				var imageData = sntIDCollectionUtilsSrv.resizeImage(video, undefined, 2560, 1920);

				verifyFaceImageWithId(imageData, unmodifiedFrontImage);
				$scope.screenData.scanMode = 'FACIAL_RECOGNITION_MODE';
				$scope.$emit('FR_ANALYSIS_STARTED');
			};

			$scope.stopExtCamera = function (type) {
				if (type === 'front-image') {
					$scope.screenData.extCamForFrontIDActivated = false;
				} else {
					$scope.screenData.extCamForBackIDActivated = false;
				}
			};

			$scope.captureFrontImageUsingExtCamera = function () {
				$scope.screenData.imageSide = 0;
				var video = document.querySelector('#id-video');
				var imageData = sntIDCollectionUtilsSrv.resizeImage(video, undefined, 2560, 1920);

				unmodifiedFrontImage = imageData;
				$scope.screenData.frontSideImage = imageData;
				$scope.$emit('IMAGE_ANALYSIS_STARTED');
				getDocInstance();
			};

			$scope.retryFrontImageUsingExtCamera = function () {
				$scope.screenData.scanMode = 'UPLOAD_FRONT_IMAGE';
				$scope.startExtCameraCapture('front-image');
			};

			$scope.captureBackImageUsingExtCamera = function () {
				$scope.screenData.imageSide = 1;
				var video = document.querySelector('#id-back-video');
				var imageData = sntIDCollectionUtilsSrv.resizeImage(video, undefined, 2560, 1920);

				$scope.screenData.backSideImage = imageData;
				$scope.$emit('IMAGE_ANALYSIS_STARTED');
				postBackImage();
			};

			$scope.retryBackImageUsingExtCamera = function () {
				$scope.screenData.scanMode = 'UPLOAD_BACK_IMAGE';
				$scope.startExtCameraCapture('back-image');
			};

			$scope.$on('STOP_EXT_CAM', stopVideoStream);
			$scope.$on('$destroy', stopVideoStream);

			(function () {
				resetScreenData();
				$scope.setIDsForImageElements();
			})();
		});
	}, {}] }, {}, [1]);