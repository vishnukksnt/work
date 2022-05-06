angular.module('sntRover').controller('rvActivityCtrl', [
	'$scope',
	'$rootScope',
	'$filter',
	'$stateParams',
	'$timeout',
	function($scope, $rootScope, $filter, $stateParams, $timeout) {
		BaseCtrl.call(this, $scope);
		var ACCOUNT_ACTIVITY_LOG_PER_PAGE = 50;

		/**
		 * initialisation and basic configuration
		 *
		 */
		$scope.init = function() {
			$scope.page = 1;
	        $scope.perPage = ACCOUNT_ACTIVITY_LOG_PER_PAGE;
	        $scope.errorMessage = '';
	        // Defined pagination for activity log - accounts
			$scope.accountActivityLogPagination = {
				id: 'ACCOUNT_ACTIVITY_LOG',
				api: $scope.updateReport,
				perPage: ACCOUNT_ACTIVITY_LOG_PER_PAGE
			};
	        $scope.setScroller('report_content');
	        

		};
		$scope.$on('PopulateLogData', function(e, data) {
			$scope.count = data.total_count;
			$scope.activityLogData = data.results;
	        $scope.$emit('hideLoader');
	        $scope.refreshScroller('report_content');
	        $timeout(function() {
	        	$scope.$broadcast('updatePagination', 'ACCOUNT_ACTIVITY_LOG');	
	        }, 800);
	        	
		});

		/**
		 * checking Whether oldvalue of detail have any value
		 *@return - Boolean
		 */
		$scope.isOldValue = function(value) {
	        if (value === "" || typeof value === "undefined" || value === null) {
	            return false;
	        	} else {
	            return true;
	        	}
    	};


		/*
		*@param {none}
	    *setting all sort flags false
	    *@return {none}
	    */
	    $scope.initSort = function() {
	        $scope.sortOrderOfUserASC = false;
	        $scope.sortOrderOfDateASC = false;
	        $scope.sortOrderOfActionASC = false;
	        $scope.sortOrderOfUserDSC = false;
	        $scope.sortOrderOfDateDSC = false;
	        $scope.sortOrderOfActionDSC = false;
	    };

	    /**	@param {none}
		 * selecting sorting order for user field
		 * @return {none}
		 */
	    $scope.sortByUserName = function() {
        	$scope.sort_field = "USERNAME";
	        if ($scope.sortOrderOfUserASC) {
	            $scope.initSort();
	            $scope.sortOrderOfUserDSC = true;
	            $scope.sort_order = "desc";
	        }
	        else {
	            $scope.initSort();
	            $scope.sortOrderOfUserASC = true;
	            $scope.sort_order = "asc";
	        }
        	$scope.updateReport();
    	};

    	/**	@param {none}
		 * selecting sorting order for date
		 * @return {none}
		 */
    	$scope.sortByDate = function() {
	        $scope.sort_field = "DATE";
	        if ($scope.sortOrderOfDateASC) {
	            $scope.initSort();
	            $scope.sortOrderOfDateDSC = true;
	            $scope.sort_order = "desc";
	        }
	        else {
	            $scope.initSort();
	            $scope.sortOrderOfDateASC = true;
	            $scope.sort_order = "asc";
	        }
	        $scope.updateReport();
    	};

    	/**	@param {none}
		 * selecting sorting order for Action
		 * @return {none}
		 */
	    $scope.sortByAction = function() {
	        $scope.sort_field = "ACTION";
	        if ($scope.sortOrderOfActionASC) {
	            $scope.initSort();
	            $scope.sortOrderOfActionDSC = true;
	            $scope.sort_order = "desc";
	        }
	        else {
	            $scope.initSort();
	            $scope.sortOrderOfActionASC = true;
	            $scope.sort_order = "asc";
	        }
	        $scope.updateReport();
	    };
		$scope.updateReport = function(page) {
	        var params = {
	            page: page || 1,
	            per_page: $scope.perPage
	        };

	        params['sort_order'] = $scope.sort_order;
	        params['sort_field'] = $scope.sort_field;
	        $scope.$emit("updateLogdata", params);
    	};

		/**
         * add the print orientation before printing
         * @return - None
         */
        var addPrintOrientation = function() {
            $('head').append("<style id='print-orientation'>@page { size: landscape; }</style>");
        };

        /**
         * remove the print orientation before printing
         * @return - None
         */
        var removePrintOrientation = function() {
            $('#print-orientation').remove();
        };

        /**
         * CICO-27954: missing print functionality for activity logs
         */
    	$scope.print = function() {

    		$("header h1").addClass('text-hide');
    		$(".cards-header").css({marginBottom: '2%'});

    		// changing the orientation to landscape
            addPrintOrientation();

            // as part of https://stayntouch.atlassian.net/browse/CICO-14384?focusedCommentId=48871&page=com.atlassian.jira.plugin.system.issuetabpanels:comment-tabpanel#comment-48871
            // We dont know the icon background-image loaded or not. We need to start print preview
            // only when it is loaded, this is wrong practice (accessing DOM elements from controller), but there is no option
            var $container = $('#print-orientation'),
                bg = $container.css('background-image'),
                src = bg.replace(/(^url\()|(\)$|[\"\'])/g, ''),
                $img = $('<img>').attr('src', src).on('load', function() {
                    // unbinding the events & removing the elements inorder to prevent memory leaks
                    $(this).off('load');
                    $(this).remove();

					var onPrintCompletion = function() {
						$timeout(function() {
							$("header h1").removeClass('text-hide');
							$(".cards-header").css({marginBottom: '0'});
							removePrintOrientation();
						}, 1200);
					};

                    // if we are in the app
                    $timeout(function() {
                        if (sntapp.cordovaLoaded) {
                            cordova.exec(
                                onPrintCompletion,
                                function() {
									onPrintCompletion();
								},
                                'RVCardPlugin',
                                'printWebView', ['', '0', '', 'L']
                            );
                        } else {
							window.print();
							onPrintCompletion();
						}
                    }, 300);

                });
    	};

    	$scope.init();
	}
]);