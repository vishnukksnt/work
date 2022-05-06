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
		'use strict';

		angular.module('sntIDCollection').service('sntIDCollectionUtilsSrv', function ($filter) {
			// We will not be using $http as it will be using common headers upadted from the application (X-CSRF-Token,X-Requested-With, Authorization etc)
			// This will fail the Acuant Webservices. So we will use zhr

			var that = this;

			this.base64ArrayBuffer = function (buffer) {
				var arr = new Uint8Array(buffer);
				var raw = '';
				var subArray,
				    chunk = 5000;

				for (var i = 0, j = arr.length; i < j; i += chunk) {
					subArray = arr.subarray(i, i + chunk);
					raw += String.fromCharCode.apply(null, subArray);
				}
				return 'data:image/jpeg;base64,' + btoa(raw);
			};

			this.processDate = function (date) {
				date = date.replace('Date', '');
				date = date.replace(')', '');
				date = date.replace('(', '');
				date = date.split('/').join('');
				date = date.split('+')[0];
				return parseInt(date);
			};

			this.dataURLtoBlob = function (dataURL) {
				// Decode the dataURL    
				var binary = atob(dataURL.split(',')[1]);
				// Create 8-bit unsigned array
				var array = [];

				for (var i = 0; i < binary.length; i++) {
					array.push(binary.charCodeAt(i));
				}
				// Return our Blob object
				return new Blob([new Uint8Array(array)], {
					type: 'image/jpg'
				});
			};

			this.formatData = function (fields, type) {
				var formatedData = {};
				var dateFormater = function dateFormater(val) {
					return val ? moment(that.processDate(val)).utc().format('DD-MM-YYYY') : '';
				};
				var customFormatters = {
					'Birth Date': dateFormater,
					'Expiration Date': dateFormater,
					'Issue Date': dateFormater
				};

				angular.forEach(fields, function (field) {
					var Key = type === 'DataFields' ? field.Name : field.Key,
					    Value = field.Value;

					formatedData[Key.toLowerCase().split(' ').join('_')] = customFormatters[Key] ? customFormatters[Key](Value) : Value;
				});

				return formatedData;
			};

			this.resizeImage = function (img, file, width, height) {
				var canvas = document.createElement('canvas');
				var ctx = canvas.getContext('2d');

				ctx.drawImage(img, 0, 0);

				var MAX_WIDTH = 3032;
				var MAX_HEIGHT = 2008;

				width = width ? width : img.width;
				height = height ? height : img.height;

				if (width > height) {
					if (width > MAX_WIDTH) {
						height *= MAX_WIDTH / width;
						width = MAX_WIDTH;
					}
				} else {
					if (height > MAX_HEIGHT) {
						width *= MAX_HEIGHT / height;
						height = MAX_HEIGHT;
					}
				}

				canvas.width = width;
				canvas.height = height;
				ctx = canvas.getContext('2d');
				// To retain the pixels sharpness.
				ctx.mozImageSmoothingEnabled = false;
				ctx.webkitImageSmoothingEnabled = false;
				ctx.msImageSmoothingEnabled = false;
				ctx.imageSmoothingEnabled = false;
				ctx.drawImage(img, 0, 0, width, height);

				var fileType = file && file.files[0] ? file.files[0].type : 'image/jpeg';
				var dataurl = canvas.toDataURL(fileType, 90 * .01);
				var imageData = dataurl ? that.dataURLtoBlob(dataurl) : '';

				return imageData;
			};

			this.retrieveAuthenticationStatus = function (idAuthentication) {

				var idAuthentication = null;

				switch (idAuthentication) {
					case 0:
						idAuthentication = 'Unknown';
						break;
					case 1:
						idAuthentication = 'Passed';
						break;
					case 2:
						idAuthentication = 'Failed';
						break;
					case 3:
						idAuthentication = 'Skipped';
						break;
					case 4:
						idAuthentication = 'Caution';
						break;
					case 5:
						idAuthentication = 'Attention';
						break;
					default:
						idAuthentication = 'Unknown';
						break;
				}

				return idAuthentication;
			};

			this.isIDExpired = function (alerts) {
				var expirationAlert = $filter('filter')(alerts, {
					Key: 'Document Expired'
				}, true)[0];
				var isDocumentExpired = expirationAlert ? expirationAlert.Result === 4 || expirationAlert.Result === 5 : false;

				return isDocumentExpired;
			};

			this.dclone = function (object, unwanted_keys) {
				if (typeof unwanted_keys === "undefined") {
					unwanted_keys = [];
				}
				var newObject = JSON.parse(JSON.stringify(object));

				for (var i = 0; i < unwanted_keys.length; i++) {
					delete newObject[unwanted_keys[i]];
				}
				return newObject;
			};

			this.formatResults = function (idDetails) {
				var formatedResults = {};

				formatedResults.document_type = idDetails.document_class_name ? idDetails.document_class_name : '';
				formatedResults.document_number = idDetails.document_number ? idDetails.document_number : '';
				formatedResults.first_name = idDetails.first_name ? idDetails.first_name : idDetails.given_name;
				formatedResults.last_name = idDetails.last_name ? idDetails.last_name : idDetails.surname;
				formatedResults.full_name = idDetails.full_name ? idDetails.full_name : '';
				formatedResults.nationality = idDetails.nationality_code ? that.countryMappings[idDetails.nationality_code] : '';
				formatedResults.nationality_name = idDetails.nationality_name ? idDetails.nationality_name : '';
				formatedResults.expiration_date = idDetails.expiration_date && idDetails.expiration_date !== 'Invalid date' ? idDetails.expiration_date : '';
				formatedResults.date_of_birth = idDetails.birth_date && idDetails.birth_date !== 'Invalid date' ? idDetails.birth_date : '';

				var personal_id_no = idDetails.personal_number ? angular.copy(idDetails.personal_number) : '';
				// if no first and last names are retrieved, assign full name as first name
				if (!formatedResults.first_name && !formatedResults.last_name && formatedResults.full_name) {
					formatedResults.first_name = formatedResults.full_name;
				}

				idDetails = this.dclone(idDetails, ['photo', 'signature', 'iDAuthenticationStatus', 'personal_number']);
				formatedResults.id_scan_info = idDetails;
				formatedResults.id_scan_info.personal_id_no = personal_id_no ? personal_id_no : '';

				return formatedResults;
			};

			this.countryMappings = {
				"AFG": "AF",
				"ALA": "AX",
				"ALB": "AL",
				"DZA": "DZ",
				"ASM": "AS",
				"AND": "AD",
				"AGO": "AO",
				"AIA": "AI",
				"ATA": "AQ",
				"ATG": "AG",
				"ARG": "AR",
				"ARM": "AM",
				"ABW": "AW",
				"AUS": "AU",
				"AUT": "AT",
				"AZE": "AZ",
				"BHS": "BS",
				"BHR": "BH",
				"BGD": "BD",
				"BRB": "BB",
				"BLR": "BY",
				"BEL": "BE",
				"BLZ": "BZ",
				"BEN": "BJ",
				"BMU": "BM",
				"BTN": "BT",
				"BOL": "BO",
				"BIH": "BA",
				"BWA": "BW",
				"BVT": "BV",
				"BRA": "BR",
				"VGB": "VG",
				"IOT": "IO",
				"BRN": "BN",
				"BGR": "BG",
				"BFA": "BF",
				"BDI": "BI",
				"KHM": "KH",
				"CMR": "CM",
				"CAN": "CA",
				"CPV": "CV",
				"CYM": "KY",
				"CAF": "CF",
				"TCD": "TD",
				"CHL": "CL",
				"CHN": "CN",
				"HKG": "HK",
				"MAC": "MO",
				"CXR": "CX",
				"CCK": "CC",
				"COL": "CO",
				"COM": "KM",
				"COG": "CG",
				"COD": "CD",
				"COK": "CK",
				"CRI": "CR",
				"CIV": "CI",
				"HRV": "HR",
				"CUB": "CU",
				"CYP": "CY",
				"CZE": "CZ",
				"DNK": "DK",
				"DJI": "DJ",
				"DMA": "DM",
				"DOM": "DO",
				"ECU": "EC",
				"EGY": "EG",
				"SLV": "SV",
				"GNQ": "GQ",
				"ERI": "ER",
				"EST": "EE",
				"ETH": "ET",
				"FLK": "FK",
				"FRO": "FO",
				"FJI": "FJ",
				"FIN": "FI",
				"FRA": "FR",
				"GUF": "GF",
				"PYF": "PF",
				"ATF": "TF",
				"GAB": "GA",
				"GMB": "GM",
				"GEO": "GE",
				"DEU": "DE",
				"GHA": "GH",
				"GIB": "GI",
				"GRC": "GR",
				"GRL": "GL",
				"GRD": "GD",
				"GLP": "GP",
				"GUM": "GU",
				"GTM": "GT",
				"GGY": "GG",
				"GIN": "GN",
				"GNB": "GW",
				"GUY": "GY",
				"HTI": "HT",
				"HMD": "HM",
				"VAT": "VA",
				"HND": "HN",
				"HUN": "HU",
				"ISL": "IS",
				"IND": "IN",
				"IDN": "ID",
				"IRN": "IR",
				"IRQ": "IQ",
				"IRL": "IE",
				"IMN": "IM",
				"ISR": "IL",
				"ITA": "IT",
				"JAM": "JM",
				"JPN": "JP",
				"JEY": "JE",
				"JOR": "JO",
				"KAZ": "KZ",
				"KEN": "KE",
				"KIR": "KI",
				"PRK": "KP",
				"KOR": "KR",
				"KWT": "KW",
				"KGZ": "KG",
				"LAO": "LA",
				"LVA": "LV",
				"LBN": "LB",
				"LSO": "LS",
				"LBR": "LR",
				"LBY": "LY",
				"LIE": "LI",
				"LTU": "LT",
				"LUX": "LU",
				"MKD": "MK",
				"MDG": "MG",
				"MWI": "MW",
				"MYS": "MY",
				"MDV": "MV",
				"MLI": "ML",
				"MLT": "MT",
				"MHL": "MH",
				"MTQ": "MQ",
				"MRT": "MR",
				"MUS": "MU",
				"MYT": "YT",
				"MEX": "MX",
				"FSM": "FM",
				"MDA": "MD",
				"MCO": "MC",
				"MNG": "MN",
				"MNE": "ME",
				"MSR": "MS",
				"MAR": "MA",
				"MOZ": "MZ",
				"MMR": "MM",
				"NAM": "NA",
				"NRU": "NR",
				"NPL": "NP",
				"NLD": "NL",
				"ANT": "AN",
				"NCL": "NC",
				"NZL": "NZ",
				"NIC": "NI",
				"NER": "NE",
				"NGA": "NG",
				"NIU": "NU",
				"NFK": "NF",
				"MNP": "MP",
				"NOR": "NO",
				"OMN": "OM",
				"PAK": "PK",
				"PLW": "PW",
				"PSE": "PS",
				"PAN": "PA",
				"PNG": "PG",
				"PRY": "PY",
				"PER": "PE",
				"PHL": "PH",
				"PCN": "PN",
				"POL": "PL",
				"PRT": "PT",
				"PRI": "PR",
				"QAT": "QA",
				"REU": "RE",
				"ROU": "RO",
				"RUS": "RU",
				"RWA": "RW",
				"BLM": "BL",
				"SHN": "SH",
				"KNA": "KN",
				"LCA": "LC",
				"MAF": "MF",
				"SPM": "PM",
				"VCT": "VC",
				"WSM": "WS",
				"SMR": "SM",
				"STP": "ST",
				"SAU": "SA",
				"SEN": "SN",
				"SRB": "RS",
				"SYC": "SC",
				"SLE": "SL",
				"SGP": "SG",
				"SVK": "SK",
				"SVN": "SI",
				"SLB": "SB",
				"SOM": "SO",
				"ZAF": "ZA",
				"SGS": "GS",
				"SSD": "SS",
				"ESP": "ES",
				"LKA": "LK",
				"SDN": "SD",
				"SUR": "SR",
				"SJM": "SJ",
				"SWZ": "SZ",
				"SWE": "SE",
				"CHE": "CH",
				"SYR": "SY",
				"TWN": "TW",
				"TJK": "TJ",
				"TZA": "TZ",
				"THA": "TH",
				"TLS": "TL",
				"TGO": "TG",
				"TKL": "TK",
				"TON": "TO",
				"TTO": "TT",
				"TUN": "TN",
				"TUR": "TR",
				"TKM": "TM",
				"TCA": "TC",
				"TUV": "TV",
				"UGA": "UG",
				"UKR": "UA",
				"ARE": "AE",
				"GBR": "GB",
				"USA": "US",
				"UMI": "UM",
				"URY": "UY",
				"UZB": "UZ",
				"VUT": "VU",
				"VEN": "VE",
				"VNM": "VN",
				"VIR": "VI",
				"WLF": "WF",
				"ESH": "EH",
				"YEM": "YE",
				"ZMB": "ZM",
				"ZWE": "ZW"
			};

			this.isInMobile = function () {
				return navigator.userAgent.match(/Android/i) || navigator.userAgent.match(/webOS/i) || navigator.userAgent.match(/iPhone/i) || navigator.userAgent.match(/iPad/i) || navigator.userAgent.match(/iPod/i) || navigator.userAgent.match(/BlackBerry/i) || navigator.userAgent.match(/Windows Phone/i);
			};

			this.formatResultsFromThirdParty = function (idDetails) {
				idDetails.first_name = idDetails.first_name || idDetails.given_name;
				idDetails.last_name = idDetails.last_name || idDetails.surname;
				idDetails.full_name = idDetails.full_name || '';
				idDetails.expiration_date = moment(idDetails.expiration_date).isValid() ? idDetails.expiration_date : "";
				idDetails.issue_date = moment(idDetails.issue_date).isValid() ? idDetails.issue_date : "";
				idDetails.date_of_birth = moment(idDetails.birth_date).isValid() ? idDetails.birth_date : "";
				idDetails.document_type = idDetails.document_class_name || 'ID';

				return idDetails;
			};

			this.thirdPartyScannerTimeout = 30;
		});
	}, {}] }, {}, [1]);