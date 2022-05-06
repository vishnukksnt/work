'use strict';

sntRover.controller('rvFileCloudStorageCtrl', ['$scope', 'rvFileCloudStorageSrv', '$timeout', 'sntActivity', '$filter', 'ngDialog', 'rvPermissionSrv', function ($scope, rvFileCloudStorageSrv, $timeout, sntActivity, $filter, ngDialog, rvPermissionSrv) {

	$scope.cardData.fileList = [];
	$scope.cardData.selectedFileList = [];
	var newFileList = [];
	var fileDetailsPopup;

	var scrollToTop = function scrollToTop() {
		var scroller = $scope.getScroller('card_file_list_scroller');

		$timeout(function () {
			scroller.scrollTo(0, 0, 300);
		}, 0);
	};

	var imageFormats = ['tif', 'tiff', 'bmp', 'jpg', 'jpeg', 'gif', 'png'];
	var sheetFormats = ['csv', 'numbers', 'xsls', 'sheet', 'excel'];
	var presentationFormats = ['keynote', 'ppt', 'powerpoint'];

	var callApiToRecord = function callApiToRecord(actionsType, actionDetails) {
		var params = {
			"id": $scope.cardId,
			"application": 'ROVER',
			"action_type": actionsType,
			"details": [actionDetails],
			"card_type": $scope.cardType
		};

		var options = {
			params: params,
			loader: 'NONE'
		};

		$scope.callAPI(rvFileCloudStorageSrv.recordReservationActions, options);
	};

	var retrieveFileType = function retrieveFileType(content_type) {
		var contentTypeRemovingSlash = content_type.split("/")[1];
		var contentTypeRemovingDot = contentTypeRemovingSlash.split(".")[contentTypeRemovingSlash.split(".").length - 1];
		var finalContentType = contentTypeRemovingDot.split("-")[contentTypeRemovingDot.split("-").length - 1];

		finalContentType = finalContentType === 'powerpoint' ? 'ppt' : finalContentType;

		return finalContentType;
	};

	var fetchFiles = function fetchFiles() {
		$scope.errorMessage = '';
		sntActivity.start('FETCH_FILES');
		rvFileCloudStorageSrv.fetchFiles({
			card_id: $scope.cardId,
			card_type: $scope.cardType
		}).then(function (fileList) {
			sntActivity.stop('FETCH_FILES');
			$scope.cardData.fileTypes = [];
			_.each(fileList, function (file) {
				var indexOffileInSelectedList = _.findIndex($scope.cardData.selectedFileList, function (selectedFile) {
					return selectedFile.id === file.id;
				});

				file.is_selected = indexOffileInSelectedList !== -1;
				file.full_content_type = angular.copy(file.content_type);
				file.content_type = file.content_type ? retrieveFileType(file.content_type) : '';

				$scope.cardData.fileTypes = _.union($scope.cardData.fileTypes, [file.content_type]);
			});
			$scope.cardData.fileList = fileList;
			$scope.refreshScroller('card_file_list_scroller');
			$scope.cardData.firstFileFetch = false;
		}, function () {
			sntActivity.stop('FETCH_FILES');
			$scope.errorMessage = [$filter('translate')('FILE_FETCHING_FAILED')];
			$scope.cardData.firstFileFetch = false;
		});
	};

	var closePopupIfOpened = function closePopupIfOpened() {
		if (fileDetailsPopup) {
			fileDetailsPopup.close();
			fileDetailsPopup = '';
		}
	};

	$scope.$on('FILE_UPLOADED', function (evt, file) {
		if (!$scope.cardData.hasUploadFilePermission) {
			$timeout(function () {
				$scope.errorMessage = [$filter('translate')('NO_FILE_UPLOAD_PERMISSION')];
				$scope.cardData.dragInProgress = false;
				sntActivity.stop('UPLOADING_FILES');
			}, 100);
			return;
		}

		var newFile = {
			"file_name": file.name,
			"content_type": file.type,
			"base64_data": file.base64 ? file.base64.split(";base64,")[1] : '',
			"card_id": $scope.cardId,
			"card_type": $scope.cardType
		};

		$scope.cardData.newFile = file;
		newFileList.push(newFile);
		$timeout(function () {
			$scope.cardData.dragInProgress = false;
		}, 100);
	});

	$scope.fileSelectionChanged = function () {
		$scope.cardData.selectedFileList = _.filter($scope.cardData.fileList, function (file) {
			return file.is_selected;
		});
	};

	$scope.cancelFileSelection = function () {
		_.each($scope.cardData.fileList, function (file) {
			file.is_selected = false;
		});
		$scope.fileSelectionChanged();
	};

	$scope.getFileCount = function (fileType) {
		var filesOfFileType = _.filter($scope.cardData.fileList, function (file) {
			return file.content_type === fileType;
		});

		return filesOfFileType.length;
	};

	$scope.filterChanged = function () {
		$scope.refreshScroller('card_file_list_scroller');
		scrollToTop();
	};

	$scope.fileUploadCompleted = function () {
		// File selection done
		var uploadedFileCount = 0;
		var fileUploadSuccess = function fileUploadSuccess() {
			uploadedFileCount++;
			// when all files are uploaded, load new file list
			if (uploadedFileCount === newFileList.length) {
				sntActivity.stop('UPLOADING_FILES');

				callApiToRecord("FILES_UPLOADED", {
					'key': 'File(s)',
					'new_value': _.map(angular.copy(newFileList), function (file) {
						return file.file_name;
					}).join(', ')
				});

				newFileList = [];
				$scope.cardData.newFile = {};
				fetchFiles();
				closePopupIfOpened();
			}
		};
		if (newFileList.length) {
			sntActivity.start('UPLOADING_FILES');
		}
		$scope.errorMessage = '';
		_.each(newFileList, function (file) {
			file.card_type = $scope.cardType;
			rvFileCloudStorageSrv.uploadFile(file).then(fileUploadSuccess, function () {
				sntActivity.stop('UPLOADING_FILES');
				$scope.errorMessage = [$filter('translate')('FILE_UPLOADING_FAILED')];
			});
		});
	};

	$scope.fileReplaced = function () {
		sntActivity.start('UPLOADING_FILES');
		$scope.errorMessage = '';

		var fileUpdateSuccess = function fileUpdateSuccess() {
			sntActivity.stop('UPLOADING_FILES');
			callApiToRecord("FILE_UPDATED", {
				'key': 'File',
				'new_value': _.map(angular.copy(newFileList), function (file) {
					return file.file_name;
				}).join(', '),
				'old_value': $scope.selectedFile.file_name
			});
			newFileList = [];
			$scope.cardData.newFile = {};
			fetchFiles();
			closePopupIfOpened();
		};

		var params = angular.copy(newFileList[0]);

		params.id = $scope.selectedFile.id;

		rvFileCloudStorageSrv.updateFile(params).then(fileUpdateSuccess, function () {
			sntActivity.stop('UPLOADING_FILES');
			$scope.errorMessage = [$filter('translate')('FILE_UPLOADING_FAILED')];
		});
	};

	$scope.replaceFile = function () {
		$('#replace-file').trigger('click');
	};

	$scope.$on('FILE_UPLOADED_DONE', $scope.fileUploadCompleted);

	$scope.donwloadFiles = function (selectedFile) {
		var fileList = selectedFile ? [selectedFile] : $scope.cardData.selectedFileList;
		var downloadFilesCount = 0;

		sntActivity.start('DOWNLOADING_FILES');
		var zip = new JSZip();
		var recordDownloadActions = function recordDownloadActions() {
			var actionParams = {
				'key': 'File(s)',
				'new_value': _.map(angular.copy(fileList), function (file) {
					return file.file_name;
				}).join(', ')
			};

			callApiToRecord("FILES_DOWNLOADED", actionParams);
		};
		var fileDownloadSuccess = function fileDownloadSuccess(fileData, file) {
			downloadFilesCount++;
			// if there is only one file, download as one, else combine and download as zip file
			if (fileList.length === 1) {
				var a = document.createElement("a");

				a.href = "data:" + file.full_content_type + ";base64," + fileData.base64_data;
				a.download = file.file_name;
				a.click();
				sntActivity.stop('DOWNLOADING_FILES');
				recordDownloadActions();
			} else {
				zip.file(file.file_name, fileData.base64_data, {
					base64: true
				});
			}

			console.log(downloadFilesCount + "---------" + fileList.length);

			var fileNameMapping = {
				'guest_card': 'GUEST',
				'stay_card': 'RESERVATION'
			};

			if (fileList.length !== 1 && downloadFilesCount === fileList.length) {

				zip.generateAsync({
					type: "blob"
				}).then(function (blob) {
					var fileName = (fileNameMapping[$scope.cardType] ? fileNameMapping[$scope.cardType] : $scope.cardType) + "_" + $scope.cardId + ".zip";

					saveAs(blob, fileName);
				});
				sntActivity.stop('DOWNLOADING_FILES');
				recordDownloadActions();
			}
		};

		_.each(fileList, function (file) {
			rvFileCloudStorageSrv.downLoadFile({
				id: file.id
			}).then(function (response) {
				fileDownloadSuccess(response, file);
			}, function () {
				sntActivity.stop('DOWNLOADING_FILES');
			});
		});
	};

	$scope.deleteFiles = function (selectedFile) {
		var fileList = selectedFile ? [selectedFile] : $scope.cardData.selectedFileList;

		sntActivity.start('DELETING_FILES');
		var deletedFilesCount = 0;
		var fileDeletionSuccess = function fileDeletionSuccess() {
			deletedFilesCount++;
			// when all files are uploaded, load new file list
			if (deletedFilesCount === fileList.length) {
				sntActivity.stop('DELETING_FILES');
				callApiToRecord("FILES_DELETED", {
					'key': 'File(s)',
					'old_value': _.map(angular.copy(fileList), function (file) {
						return file.file_name;
					}).join(', ')
				});
				$scope.cardData.selectedFileList = [];
				closePopupIfOpened();
				fetchFiles();
			}
		};

		_.each(fileList, function (file) {
			rvFileCloudStorageSrv.deleteFile({
				id: file.id
			}).then(fileDeletionSuccess, function () {
				sntActivity.stop('DELETING_FILES');
				$scope.errorMessage = [$filter('translate')('FILE_DELETION_FAILED')];
			});
		});
	};

	$scope.$on('FETCH_FILES', function () {
		$scope.cardData.firstFileFetch = true;
		fetchFiles();
	});

	$scope.sortFiles = function (file) {
		var dateString = file.updated_date + ' ' + file.updated_time;
		var date = moment(dateString, 'MM-DD-YYYY hh:mm A');

		return date;
	};

	$scope.openFileDetails = function (file) {
		if (!$scope.cardData.hasViewFilePermission) {
			return;
		}
		$scope.selectedFile = file;
		fileDetailsPopup = ngDialog.open({
			template: '/assets/directives/fileCloudStorage/partials/rvFileDetails.html',
			className: '',
			scope: $scope,
			closeByDocument: false,
			closeByEscape: false
		});
	};

	$scope.closeFileDetailsPopup = function () {
		closePopupIfOpened();
	};

	$scope.isImageAndHasThumbNail = function (file) {
		var indexOfFileType = _.indexOf(imageFormats, file.content_type);

		return indexOfFileType !== -1 && file.preview_url;
	};

	$scope.getIconClass = function (content_type) {

		var iconClass = 'icon-document';

		if (content_type === 'document' || content_type === 'pdf') {
			iconClass = 'icon-document';
		} else if (_.indexOf(sheetFormats, content_type) !== -1) {
			iconClass = 'icon-sheet';
		} else if (_.indexOf(presentationFormats, content_type) !== -1) {
			iconClass = 'icon-presentation';
		}
		return iconClass;
	};

	$scope.getContentTypeClass = function (content_type) {
		var contentTypeClass;

		if (content_type === 'pdf') {
			contentTypeClass = 'pdf';
		} else if (_.indexOf(sheetFormats, content_type) !== -1) {
			contentTypeClass = 'sheet';
		} else if (_.indexOf(presentationFormats, content_type) !== -1) {
			contentTypeClass = 'presentation';
		}

		return contentTypeClass;
	};

	$scope.showAddFile = function () {
		if ($scope.cardType === 'account') {
			return rvFileCloudStorageSrv.activeCardType === 'ACCOUNT_' + $scope.accountType;
		}
		return rvFileCloudStorageSrv.activeCardType === $scope.cardType;
	};

	(function () {
		if ($scope.cardType === 'account') {
			rvFileCloudStorageSrv.activeCardType = 'ACCOUNT_' + $scope.accountType;
		} else {
			rvFileCloudStorageSrv.activeCardType = angular.copy($scope.cardType);
		}

		$scope.cardData.newFile = {
			base64: '',
			name: '',
			size: '',
			type: ''
		};
		$scope.cardData.hasFilePersmissions = true;
		$scope.cardData.sort_files_by = 'NEWLY_ADDED';
		$scope.cardData.group_files_by = 'UNGROUPED';
		$scope.cardData.searchText = '';
		$scope.cardData.dragInProgress = false;
		$scope.selectedFile = '';

		$scope.cardData.hasViewFilePermission = rvPermissionSrv.getPermissionValue('CLOUD_STORAGE_VIEW');
		$scope.cardData.hasUploadFilePermission = rvPermissionSrv.getPermissionValue('CLOUD_STORAGE_UPLOAD');
		$scope.cardData.hasDownloadFilePermission = rvPermissionSrv.getPermissionValue('CLOUD_STORAGE_DOWNLOAD');
		$scope.cardData.hasDeleteFilePermission = rvPermissionSrv.getPermissionValue('CLOUD_STORAGE_DELETE');
	})();
}]);