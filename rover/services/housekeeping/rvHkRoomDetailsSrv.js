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
		angular.module('sntRover').service('RVHkRoomDetailsSrv', ['$http', '$q', 'rvBaseWebSrvV2', 'RVBaseWebSrv', '$window', '$filter', '$vault', function ($http, $q, rvBaseWebSrvV2, RVBaseWebSrv, $window, $filter, $vault) {
			var service = this;

			var HTTP_STATUS_SUCCESS = 200;

			var setRoomServiceInVault = function setRoomServiceInVault(options) {
				var getValue = function getValue(id) {
					if (2 === id) {
						return 'OUT_OF_SERVICE';
					} else if (3 === id) {
						return 'OUT_OF_ORDER';
					} else {
						return 'IN_SERVICE';
					}
				};

				$vault.setOnce('LAST_ROOM_SERVICE', JSON.stringify({
					rooms: [].concat(options.room_id),
					status: {
						to_date: options.to_date,
						end_time: options.end_time,
						id: options.room_service_status_id,
						value: getValue(options.room_service_status_id)
					}
				}));
			};

			service.roomDetails = {};

			service.fetch = function (id, businessDate) {
				var deferred = $q.defer();
				var url = '/house/room/' + id + '.json';

				$http.get(url).then(function (res) {
					var response = res.data;

					if (response.status === "success") {
						service.roomDetails = response.data.room_details;
						deferred.resolve(service.roomDetails);
					} else {
						deferred.reject(response);
					}
				}, function (res) {
					var response = res.data,
					    status = res.status;

					if (status === 401) {
						// 401- Unauthorized
						// so lets redirect to login page
						$window.location.href = '/house/logout';
					} else {
						deferred.reject(response);
					}
				});
				return deferred.promise;
			};

			service.updateHKStatus = function (data) {
				var deferred = $q.defer();
				var url = '/house/change_house_keeping_status.json';

				$http({
					url: url,
					method: "POST",
					data: data
				}).then(function (res) {
					var response = res.data;

					if (response.status === "success" || res.status === HTTP_STATUS_SUCCESS) {
						deferred.resolve(response.data);
					} else {
						deferred.reject(response);
					}
				}, function (res) {
					var response = res.data,
					    status = res.status;

					if (status === 401) {
						// 401- Unauthorized
						// so lets redirect to login page
						$window.location.href = '/house/logout';
					} else {
						deferred.reject(response);
					}
				});

				return deferred.promise;
			};

			/* NOTE: using the new API structure */

			// room service status list (will be cached)
			var allServiceStatus = [];

			service.fetchAllServiceStatus = function () {
				var deferred = $q.defer(),
				    url = 'api/room_services/status_list';

				if (allServiceStatus.length) {
					deferred.resolve(allServiceStatus);
				} else {
					rvBaseWebSrvV2.getJSON(url).then(function (data) {
						allServiceStatus = data.results;
						deferred.resolve(allServiceStatus);
					}, function (data) {
						deferred.reject(data);
					});
				}

				return deferred.promise;
			};

			// maintenance reasons (will be cached)
			var maintenanceReasons = [];

			service.fetchMaintenanceReasons = function () {
				var deferred = $q.defer(),
				    url = 'api/maintenance_reasons';

				if (maintenanceReasons.length) {
					deferred.resolve(maintenanceReasons);
				} else {
					rvBaseWebSrvV2.getJSON(url).then(function (data) {
						maintenanceReasons = data.maintenance_reasons;
						deferred.resolve(maintenanceReasons);
					}, function (data) {
						deferred.reject(data);
					});
				}

				return deferred.promise;
			};

			service.getRoomLog = function (params) {
				var deferred = $q.defer(),
				    url = '/api/room_actions/' + params.id + '/?page=' + params.page + '&per_page=' + params.per_page;

				rvBaseWebSrvV2.getJSON(url).then(function (data) {
					deferred.resolve(data);
				}, function (data) {
					deferred.reject(data);
				});

				return deferred.promise;
			};

			// fetch oo/os details from server
			service.getRoomServiceStatus = function (params) {
				var deferred = $q.defer(),
				    url = '/api/room_services/service_info.json?',
				    from = tzIndependentDate(params.from_date),
				    year = from.getFullYear(),
				    month = from.getMonth(),
				    to = tzIndependentDate(new Date(year, month + 2, 1));

				params.to_date = $filter('date')(to, 'yyyy-MM-dd');

				rvBaseWebSrvV2.getJSON(url, params).then(function (data) {
					deferred.resolve(data);
				}, function (data) {
					deferred.reject(data);
				});

				return deferred.promise;
			};

			// POST: save from IN_SERVICE to OO/OS
			service.postRoomServiceStatus = function (params) {
				var deferred = $q.defer(),
				    url = 'api/room_services';

				rvBaseWebSrvV2.postJSON(url, params).then(function (data) {
					setRoomServiceInVault(params);

					deferred.resolve(data);
				}, function (data) {
					deferred.reject(data);
				});

				return deferred.promise;
			};

			service.checkWhetherRoomStatusChangePossible = function (params) {
				var deferred = $q.defer(),
				    url = '/api/room_services/check_room_locked_or_assigned';

				rvBaseWebSrvV2.postJSON(url, params).then(function (data) {
					deferred.resolve(data);
				}, function (data) {
					deferred.reject(data);
				});

				return deferred.promise;
			};

			// POST: save from IN_SERVICE to OO/OS
			service.postCheckOutReservation = function (params) {
				var deferred = $q.defer(),
				    url = 'api/reservations/' + params.id + '/checkout_from_house_keeping';

				rvBaseWebSrvV2.postJSON(url, params).then(function (data) {
					deferred.resolve(data);
				}, function (data) {
					deferred.reject(data);
				});

				return deferred.promise;
			};
			// PUT: update OO/OS to OO/OS
			service.putRoomServiceStatus = function (params) {
				var deferred = $q.defer(),
				    url = 'api/room_services/' + params.room_id;

				rvBaseWebSrvV2.putJSON(url, params).then(function (data) {
					deferred.resolve(data);
				}, function (data) {
					deferred.reject(data);
				});

				return deferred.promise;
			};

			// save the room back to in sevice
			service.putRoomInService = function (params) {
				var deferred = $q.defer(),
				    url = 'api/room_services/' + params.room_id,
				    options = {
					"room_service_status_id": params.inServiceID,
					"from_date": params.from_date,
					"to_date": params.to_date
				};

				rvBaseWebSrvV2.putJSON(url, options).then(function (data) {
					deferred.resolve(data);
				}, function (data) {
					deferred.reject(data);
				});

				return deferred.promise;
			};

			// get all all WorkTypes
			var workTypesList = [];

			service.getWorkTypes = function () {
				var deferred = $q.defer(),
				    url = 'api/work_types';

				if (workTypesList.length) {
					deferred.resolve(workTypesList);
				} else {
					rvBaseWebSrvV2.getJSON(url).then(function (data) {
						workTypesList = data.results;
						deferred.resolve(workTypesList);
					}, function (data) {
						deferred.reject(data);
					});
				}

				return deferred.promise;
			};

			// room work time fetch record api
			service.postRecordTime = function (params) {
				var deferred = $q.defer(),
				    url = '/api/work_assignments/record_time';

				rvBaseWebSrvV2.postJSON(url, params).then(function (data) {
					deferred.resolve(data);
				}, function (data) {
					deferred.reject(data);
				});

				return deferred.promise;
			};

			// CICO-12520 Room service status
			service.fetchRoomStatus = function (params) {
				var queryString = {
					from_date: $filter('date')(tzIndependentDate(new Date(params.year, params.month - 1, 1)), 'yyyy-MM-dd'),
					to_date: $filter('date')(tzIndependentDate(new Date(params.year, params.month + 1, 1)), 'yyyy-MM-dd'),
					room_id: params.room_id
				};
				var deferred = $q.defer(),
				    url = '/api/room_services/service_info.json?';

				rvBaseWebSrvV2.getJSON(url, queryString).then(function (data) {
					deferred.resolve({
						service_status: data.service_status
					});
				}, function (data) {
					deferred.reject(data);
				});
				return deferred.promise;
			};

			service.changeHouseKeepingStatus = function (params) {
				var deferred = $q.defer(),
				    url = 'house/change_fo_status.json';

				rvBaseWebSrvV2.postJSON(url, params).then(function (data) {
					deferred.resolve(data);
				}, function (data) {
					deferred.reject(data);
				});

				return deferred.promise;
			};
		}]);
	}, {}] }, {}, [1]);