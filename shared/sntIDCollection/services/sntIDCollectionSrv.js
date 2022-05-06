"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

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
		angular.module('sntIDCollection').service('sntIDCollectionSrv', function ($q, $filter, acuantCredentials, sntIDCollectionUtilsSrv) {
			// We will not be using $http as it will be using common headers upadted from the application (X-CSRF-Token,X-Requested-With, Authorization etc)
			// This will fail the Acuant Webservices. So we will use xhr

			var that = this;

			var errorMessage = ['Error: The subscription ID provided does not match any active subscription.'];
			var operationTimedOutMsg = ['Operation timed out !'];
			var acuantCredentials = {};
			var acuantAuthString = '';
			var windowLocation = window.location;

			this.isInDevEnv = true;

			if (windowLocation.hostname && _typeof(windowLocation.hostname) === _typeof('str') && windowLocation.hostname.indexOf('pms.stayntouch.com') !== -1) {
				that.isInDevEnv = false;
			}

			this.setAcuantCredentials = function (credentials) {
				acuantCredentials = credentials;
				if (acuantCredentials && acuantCredentials.licenseKey) {
					acuantCredentials.LicenseKey = btoa(acuantCredentials.licenseKey);
				}
				if (acuantCredentials && acuantCredentials.subscriptionID && acuantCredentials.username && acuantCredentials.password) {
					acuantAuthString = acuantCredentials.subscriptionID + ";" + acuantCredentials.username + ":" + acuantCredentials.password;
				}
			};
			/**
    * [createCORSRequest description]
    * @param  {[string]} method [http method]
    * @param  {[string]} url    [API URL]
    * @return {[object]}        [description]
    */
			function createCORSRequest(method, url) {
				var xhr = new XMLHttpRequest();

				if ("withCredentials" in xhr) {
					xhr.open(method, url, true);
				} else if (typeof XDomainRequest !== "undefined") {
					xhr = new XDomainRequest();
					xhr.open(method, url);
				} else {
					xhr = null;
				}

				if (xhr) {
					xhr.timeout = 60000;
				}
				return xhr;
			}

			// This method is common for all GET requests
			// POST and delete method have different other headers based on the API type
			var createRequestObject = function createRequestObject(requestType, url) {
				var requestGetDocument = createCORSRequest(requestType, url);

				requestGetDocument.setRequestHeader("Authorization", "Basic " + btoa(acuantAuthString));
				requestGetDocument.setRequestHeader("Accept", "application/json");
				return requestGetDocument;
			};

			this.isValidSubsription = false;
			this.instanceID;

			this.validateCredentials = function () {

				var deferred = $q.defer();

				if (acuantCredentials.username && acuantCredentials.password && acuantCredentials.assureIDConnectEndpoint && acuantCredentials.subscriptionID) // All the variables should be non empty
					{
						var validateSubscription = function validateSubscription(subscriptions) {
							if (subscriptions.length > 0) {
								var chk = false;
								var appSubscription = $filter('filter')(subscriptions, {
									'Id': acuantCredentials.subscriptionID
								})[0];

								chk = appSubscription ? appSubscription.IsActive : false;
								if (!chk) {
									deferred.reject(errorMessage);
								} else {
									that.isValidSubsription = true;
									deferred.resolve({});
								}
							} else {
								deferred.reject(errorMessage);
							}
						};
						var url = acuantCredentials.assureIDConnectEndpoint + '/AssureIDService/Subscriptions';
						var requestGetDocument = createRequestObject('GET', url);

						requestGetDocument.send();
						requestGetDocument.onload = function () {
							if (requestGetDocument.status === 200) {
								var documentObj = JSON.parse(requestGetDocument.responseText);

								validateSubscription(documentObj);
							} else {
								deferred.reject(errorMessage);
							}
						};
						requestGetDocument.onerror = function () {
							deferred.reject(errorMessage);
						};
						requestGetDocument.ontimeout = function () {
							deferred.reject(operationTimedOutMsg);
						};
					} else {
					deferred.reject(errorMessage);
				}
				return deferred.promise;
			};

			this.getDocInstance = function () {
				var deferred = $q.defer();
				var url = acuantCredentials.assureIDConnectEndpoint + "/AssureIDService/Document/Instance";
				var requestDocInstance = createCORSRequest("POST", url);

				requestDocInstance.setRequestHeader("Authorization", "Basic " + btoa(acuantAuthString));
				requestDocInstance.setRequestHeader('Content-Type', 'application/json');
				requestDocInstance.setRequestHeader("Accept", "application/json");

				requestDocInstance.send(JSON.stringify({
					'AuthenticationSensitivity': 0,
					'ClassificationMode': 0,
					'Device': {
						'HasContactlessChipReader': false,
						'HasMagneticStripeReader': false,
						'SerialNumber': 'xxx',
						'Type': {
							'Manufacturer': 'xxx',
							'Model': 'xxx',
							'SensorType': 3
						}
					},
					'ImageCroppingExpectedSize': 0,
					'ImageCroppingMode': 1,
					'ManualDocumentType': null,
					'ProcessMode': 0,
					'SubscriptionId': acuantCredentials.subscriptionID
				}));

				requestDocInstance.onload = function () {
					if (requestDocInstance.status === 201) {
						var instanceID = JSON.parse(requestDocInstance.responseText);

						that.instanceID = instanceID;
						deferred.resolve(instanceID);
					} else {
						deferred.reject(['Document instance failed']);
					}
				};
				requestDocInstance.onerror = function () {
					deferred.reject(['Document instance failed']);
				};
				requestDocInstance.ontimeout = function () {
					deferred.reject(operationTimedOutMsg);
				};
				return deferred.promise;
			};

			this.postFrontImage = function (unmodifiedFrontImage) {

				var deferred = $q.defer();
				var url = acuantCredentials.assureIDConnectEndpoint + 'AssureIDService/Document/' + that.instanceID + '/Image?side=0&light=0&metrics=true';
				var requestDocInstance = createCORSRequest("POST", url);

				requestDocInstance.setRequestHeader("Authorization", "Basic " + btoa(acuantAuthString));
				requestDocInstance.setRequestHeader('Content-Type', 'image/*');
				requestDocInstance.setRequestHeader("Accept", "application/json");
				requestDocInstance.send(unmodifiedFrontImage);
				requestDocInstance.onload = function (response) {
					if (requestDocInstance.status === 201) {
						deferred.resolve({});
					} else {
						deferred.reject(['Document front image posting failed (Response status: ' + requestDocInstance.status + ')']);
					}
				};
				requestDocInstance.onerror = function () {
					deferred.reject(['Document front image posting failed']);
				};
				requestDocInstance.ontimeout = function () {
					deferred.reject(operationTimedOutMsg);
				};
				return deferred.promise;
			};

			this.postBackImage = function (imageData) {

				var deferred = $q.defer();
				var url = acuantCredentials.assureIDConnectEndpoint + '/AssureIDService/Document/' + that.instanceID + '/Image?side=1&light=0';
				var requestDocInstance = createCORSRequest("POST", url);

				requestDocInstance.setRequestHeader("Authorization", "Basic " + btoa(acuantAuthString));
				requestDocInstance.setRequestHeader('Content-Type', 'image/*');
				requestDocInstance.setRequestHeader("Accept", "application/json");
				requestDocInstance.send(imageData);
				requestDocInstance.onload = function () {
					if (requestDocInstance.status === 201) {
						deferred.resolve({});
					} else {
						deferred.reject(['Document back side image posting failed (Response status: ' + requestDocInstance.status + ')']);
					}
				};
				requestDocInstance.onerror = function () {
					deferred.reject(['Document back side image posting failed']);
				};
				requestDocInstance.ontimeout = function () {
					deferred.reject(operationTimedOutMsg);
				};
				return deferred.promise;
			};

			this.getImage = function (side) {
				var deferred = $q.defer();
				var url = acuantCredentials.assureIDConnectEndpoint + 'AssureIDService/Document/' + that.instanceID + '/Image?side=' + side + '&light=0';
				var requestGetDocument = createRequestObject('GET', url);

				requestGetDocument.responseType = 'arraybuffer';
				requestGetDocument.send();
				requestGetDocument.onload = function () {
					if (requestGetDocument.status === 200) {
						var base64String = sntIDCollectionUtilsSrv.base64ArrayBuffer(requestGetDocument.response);

						deferred.resolve(requestGetDocument.response);
					} else {
						deferred.reject(['Document getImage failed']);
					}
				};
				requestGetDocument.onerror = function () {
					deferred.reject(['Document getImage failed']);
				};
				requestGetDocument.ontimeout = function () {
					deferred.reject(operationTimedOutMsg);
				};

				return deferred.promise;
			};

			this.getImageQualityMetric = function (side) {

				var deferred = $q.defer();
				var url = acuantCredentials.assureIDConnectEndpoint + 'AssureIDService/Document/' + that.instanceID + '/Image/Metrics?side=' + side + '&light=0';
				var requestGetDocument = createRequestObject('GET', url);

				requestGetDocument.send();
				requestGetDocument.onload = function () {
					if (requestGetDocument.status === 200) {
						var documentObj = JSON.parse(requestGetDocument.responseText);

						deferred.resolve(documentObj);
					} else {
						deferred.reject(['Document getImageQualityMetric failed']);
					}
				};
				requestGetDocument.onerror = function () {
					deferred.reject(['Document getImageQualityMetric failed']);
				};
				requestGetDocument.ontimeout = function () {
					deferred.reject(operationTimedOutMsg);
				};

				return deferred.promise;
			};

			this.getClassification = function () {

				var deferred = $q.defer();
				var url = acuantCredentials.assureIDConnectEndpoint + 'AssureIDService/Document/' + that.instanceID + '/Classification';
				var requestGetDocument = createRequestObject('GET', url);

				requestGetDocument.send();
				requestGetDocument.onload = function () {
					if (requestGetDocument.status === 200) {
						var documentObj = JSON.parse(requestGetDocument.responseText);

						deferred.resolve(documentObj);
					} else {
						deferred.reject(['Document getClassification failed']);
					}
				};
				requestGetDocument.onerror = function () {
					deferred.reject(['Document getClassification failed']);
				};
				requestGetDocument.ontimeout = function () {
					deferred.reject(operationTimedOutMsg);
				};

				return deferred.promise;
			};

			this.getImageDetails = function (side) {
				var deferred = $q.defer(),
				    responses = {},
				    promises = [];

				var onSuccessFetchImage = function onSuccessFetchImage(response) {
					responses['image'] = response;
				};

				var onSuccessFetchImageQualityMetrics = function onSuccessFetchImageQualityMetrics(response) {
					responses['quality_metrics'] = response;
				};

				var onSuccessFetchImageClassification = function onSuccessFetchImageClassification(response) {
					responses['image_classification'] = response;
				};

				var failure = function failure(error) {
					deferred.reject(error);
				};

				promises.push(that.getImage(side).then(onSuccessFetchImage, failure));
				promises.push(that.getImageQualityMetric(side).then(onSuccessFetchImageQualityMetrics, failure));
				promises.push(that.getClassification(side).then(onSuccessFetchImageClassification, failure));

				$q.all(promises).then(function () {
					deferred.resolve(responses);
				});

				return deferred.promise;
			};

			this.getResults = function () {
				var deferred = $q.defer();
				var url = acuantCredentials.assureIDConnectEndpoint + '/AssureIDService/Document/' + that.instanceID;
				var requestGetDocument = createRequestObject('GET', url);

				requestGetDocument.send();
				requestGetDocument.onload = function () {
					if (requestGetDocument.status === 200) {
						var documentObj = JSON.parse(requestGetDocument.responseText);

						documentObj.Fields = documentObj.Fields ? sntIDCollectionUtilsSrv.formatData(documentObj.Fields) : {};
						documentObj.DataFields = documentObj.DataFields ? sntIDCollectionUtilsSrv.formatData(documentObj.DataFields, 'DataFields') : {};
						var dataFields = documentObj.DataFields;

						// The names are mostly correct inside the 'DataFields' rather than in the 'Fields'
						if (documentObj.Fields && dataFields && dataFields.surname && (dataFields.first_name || dataFields.given_name)) {
							documentObj.Fields.first_name = dataFields.first_name ? dataFields.first_name : dataFields.given_name;
							documentObj.Fields.last_name = dataFields.surname ? dataFields.surname : '';
						}
						deferred.resolve(documentObj);
					} else {
						deferred.reject(['Document getResults failed']);
					}
				};
				requestGetDocument.onerror = function () {
					deferred.reject(['Document getResults failed']);
				};
				requestGetDocument.ontimeout = function () {
					deferred.reject(operationTimedOutMsg);
				};

				return deferred.promise;
			};

			this.deleteDocInstance = function () {
				var deferred = $q.defer();
				var url = acuantCredentials.assureIDConnectEndpoint + '/AssureIDService/Document/' + that.instanceID;
				var requestGetDocument = createCORSRequest("DELETE", url);

				requestGetDocument.setRequestHeader("Authorization", "Basic " + btoa(acuantAuthString));
				requestGetDocument.setRequestHeader("Accept", "application/json");
				requestGetDocument.send();
				requestGetDocument.onload = function () {
					deferred.resolve({});
				};
				requestGetDocument.onerror = function () {
					deferred.resolve({});
				};
				requestGetDocument.ontimeout = function () {
					deferred.reject(operationTimedOutMsg);
				};

				return deferred.promise;
			};

			this.verifyFacialMatch = function (idFrontImage, facialImgData) {

				var deferred = $q.defer();
				var url = 'https://cssnwebservices.com/CSSNService/CardProcessor/FacialMatch';
				var requestDocInstance = createCORSRequest("POST", url);

				var facialMatchData = new FormData();

				facialMatchData.append("idFaceImage", idFrontImage);
				facialMatchData.append("selfieImage", facialImgData);

				requestDocInstance.setRequestHeader("Authorization", "LicenseKey " + acuantCredentials.LicenseKey);
				requestDocInstance.setRequestHeader('Content-Type', 'image/*');
				requestDocInstance.setRequestHeader("Accept", "application/json");
				requestDocInstance.send(facialMatchData);
				requestDocInstance.onload = function () {
					if (requestDocInstance.status === 200) {
						var documentObj = JSON.parse(requestDocInstance.responseText);

						deferred.resolve(documentObj);
					} else {
						deferred.reject(['Facial Recognition Failed']);
					}
				};
				requestDocInstance.onerror = function () {
					deferred.reject(['Facial Recognition Failed']);
				};
				requestDocInstance.ontimeout = function () {
					deferred.reject(operationTimedOutMsg);
				};
				return deferred.promise;
			};

			this.getFaceImage = function () {
				var deferred = $q.defer();
				var url = acuantCredentials.assureIDConnectEndpoint + 'AssureIDService/Document/' + that.instanceID + '/Field/Image?key=Photo';
				var requestGetDocument = createRequestObject('GET', url);

				requestGetDocument.responseType = 'arraybuffer';
				requestGetDocument.send();
				requestGetDocument.onload = function () {
					if (requestGetDocument.status === 200) {
						var base64String = sntIDCollectionUtilsSrv.base64ArrayBuffer(requestGetDocument.response);

						deferred.resolve(base64String);
					} else {
						deferred.reject(['Document getFaceImage failed']);
					}
				};
				requestGetDocument.onerror = function () {
					deferred.reject(['Document getFaceImage failed']);
				};
				requestGetDocument.ontimeout = function () {
					deferred.reject(operationTimedOutMsg);
				};

				return deferred.promise;
			};

			this.WebSocketObj;
		});
	}, {}] }, {}, [1]);