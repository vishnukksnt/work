angular.module('sntRover').service('rvMenuSrv',
	['rvPermissionSrv', 'RVDashboardSrv', 'RVHotelDetailsSrv', '$rootScope',
	function(rvPermissionSrv, RVDashboardSrv, RVHotelDetailsSrv, $rootScope ) {


	// we have to keep reference
	var self = this;

	/**
	* method to return default dashboard state for rover
	* will find the dashboard from current user object
	* @return {string}, corresponding state
	*/
	var getDefaultDashboardState = function() {
		var dashboard = RVHotelDetailsSrv.hotelDetails.current_user.default_dashboard;
		var statesForDashbaord = {
			'HOUSEKEEPING': 'rover.dashboard.housekeeping',
			'FRONT_DESK': 'rover.dashboard.frontoffice',
			'MANAGER': 'rover.dashboard.manager'
		};

		return statesForDashbaord[dashboard];
    };

    /**
    * utility function to decide whether dashboard is front desk
    * @param {string}, dashboard
	* @return {boolean}
    */
    var isFrontDeskDashboard = function (dashboard) {
    	return dashboard === 'FRONT_DESK';
    };

    /**
    * utility function to decide whether the hourly rate is on or not
    * will use the hotel details API response
    * @return {Boolean}
    */
    var isHourlyRateOn = function() {
    	return RVHotelDetailsSrv.hotelDetails.is_hourly_rate_on;
    };

    /**
    * utility function to decide whether the it is connected
    * will use the hotel details API response
    * @return {Boolean}
    */
    var isConnected = function() {
    	return (RVHotelDetailsSrv.hotelDetails.pms_type !== null);
    };
    /**
     * Decide whether the task management submenu is to be shown in housekeeping menu
     * will use the hotel details API response
     * @return {Boolean}
     */
    var shouldShowTaskManagementInHKMenu = function() {
    	return RVHotelDetailsSrv.hotelDetails.is_show_task_management_in_hk_menu;
    };
    /**
     * Decide whether sell limits show in menuj
     * will use the hotel details API response
     * @return {Boolean}
     */
	var shouldShowSellLimits = function() {
		return RVHotelDetailsSrv.hotelDetails.is_sell_limit_enabled;
	};
    /**
     * Decide whether the task management submenu is to be shown in housekeeping menu
     * will use the hotel details API response
     * @return {Boolean}
     */
    var shouldShowCurrencyExchangeInFinancialsMenu = function() {
        return RVHotelDetailsSrv.hotelDetails.is_multi_currency_enabled && RVHotelDetailsSrv.hotelDetails.currency_list_for_exchange.length > 0;
    };
    /**
     * Decide whether the Auto Charge submenu is to be shown in Fianancials menu
     * will use the hotel details API response
     * @return {Boolean}
     */
    var shouldShowAutochargeInFinancialsMenu = function() {
        return rvPermissionSrv.getPermissionValue('AUTO_CHARGE');
    };
    /**
     * Decide whether the task Invoice search submenu is to be shown in Fianancials menu
     * will use the hotel details API response
     * @return {Boolean}
     */
    var shouldShowInvoiceSearchInFinancialsMenu = function() {
        return rvPermissionSrv.getPermissionValue('INVOICE_SEARCH');
    };
    /**
     * Decide whether the QuickText submenu is to be shown
     * will use the hotel details API response
     * @return {Boolean}
     */
    var shouldShowQucikTextMenu = function() {
    	return RVHotelDetailsSrv.hotelDetails.is_quicktextenabled;
    };

	/**
	* utility the user role is 'Floor & Maintanance staff'
    * @param {string}, user role
	* @return {boolean}
	*/
    var isFloorMaintananceStaff = function() {
    	var userDetails = RVDashboardSrv.getUserDetails();

    	return (userDetails.user_role === "Floor & Maintenance Staff");
    };

    /**
     * Decide whether the neighbours submenu is to be shown in Front desk menu
     * will use the hotel details API response
     * @return {Boolean}
     */
    var isNeighboursEnabled = function() {
    	return RVHotelDetailsSrv.hotelDetails.social_lobby_settings.is_neighbours_enabled;
    };

    /**
    * utility function to process menu list
    * will check permission, check role permission, visibility permission
    * @param {array of Objects}
    * @return {array of Objects}
    */
    var processMenuList = function (menuList) {
    	// deep copying the obeject before proceeding
    	menuList = JSON.parse(JSON.stringify(menuList));

    	var menuToReturn = [],
    		subMenuCount,
    		subMenuVisibleCount,
    		hasSubMenu = false;

    	// we are processing on the menu list we have
		_.each (menuList, function(menuItem) {
			// if the menu is hi
			var isMenuItemVisible = self.shouldShowMenuItem(menuItem.menuIndex);
			
			if (isMenuItemVisible) {
				subMenuCount = menuItem.submenu ? menuItem.submenu.length : 0;
				hasSubMenu = (subMenuCount > 0) ? true : false;
				subMenuVisibleCount = 0;

				// looping through submenus
				menuItem.submenu = _.filter (menuItem.submenu, function (subMenuItem) {
					isMenuItemVisible = self.shouldShowMenuItem(subMenuItem.menuIndex);

					if (isMenuItemVisible) {
						subMenuVisibleCount++;
					}
					return isMenuItemVisible;
				});

				// if it has submenu & none of them are visible we will not show that menu
				if (hasSubMenu && subMenuVisibleCount !== 0) {
					menuToReturn.push (menuItem);
				}

				// if it has no submenu, we will just push them
				if (!hasSubMenu) {
					menuToReturn.push (menuItem);
				}
			}
		});

		return menuToReturn;
    };

	/**
	* method to get menu for rover
	* @return {array} - List of Menu
	*/
	this.getMainMenuForStandAloneRover = function() {
		var defaultDashboardState 	= getDefaultDashboardState (),
			menuFrontDeskIndex 		= -1,
			isMenuItemVisible		= true,
            menuList = []; // storing the menu list, will process on this and return

		menuList = [{
		        title: "MENU_DASHBOARD",
		        action: defaultDashboardState,
		        menuIndex: "dashboard",
		        submenu: [],
		        iconClass: "icon-dashboard"
		    }, {
		        title: "MENU_FRONT_DESK",
		        // hidden: true,
		        action: "",
		        iconClass: "icon-frontdesk",
		        menuIndex: "front_desk",
		        submenu: [{
		            title: "MENU_SEARCH_RESERVATIONS",
		            action: "rover.search",
		            menuIndex: "reservationSearch"
		        }, {
		            title: "MENU_CREATE_RESERVATION",
		            action: "rover.reservation.search",
					menuIndex: "createReservation",
					hideOnMobile: true
		        }, {
		            title: "MENU_ROOM_DIARY",
		            action: 'rover.diary',
		            // hidden: !isHourlyRateOn,
					menuIndex: 'diaryReservation',
					hideOnMobile: true
		        }, {
		            title: "MENU_ROOM_DIARY",
		            action: 'rover.nightlyDiary',
		            // hidden: !isHourlyRateOn,
					menuIndex: 'nightlyDiaryReservation'
		        },  {
		            title: "MENU_POST_CHARGES",
		            action: "",
		            actionPopup: true,
		            menuIndex: "postcharges"
		        }, {
		            title: "MENU_CASHIER",
		            action: "rover.financials.journal({ id: 'CASHIER' })",
					menuIndex: "cashier",
					hideOnMobile: true
		        }, {
		            title: "MENU_GUESTS",
		            action: "rover.guest.search",
					menuIndex: "guests"
		        }, {
		            title: "MENU_ACCOUNTS",
		            action: "rover.accounts.search",
					menuIndex: "accounts",
					hideOnMobile: true
		        }, {
	                title: "MENU_END_OF_DAY",
	                action: "rover.endOfDay.starteod",
	                actionPopup: false,
					menuIndex: "endOfDay",
					hideOnMobile: true
            	}, {
	                title: "MENU_SOCIAL_LOBBY",
	                action: "rover.socialLobby",
	                hidden: !isNeighboursEnabled(),
					menuIndex: "sociallobby",
					hideOnMobile: true
            	}]
		    }, {
		        title: "MENU_GROUPS",
		        // hidden: true,
		        action: "",
		        iconClass: "icon-groups",
				menuIndex: "menuGroups",
				hideOnMobile: true,
		        submenu: [{
		            title: "MENU_CREATE_GROUP",
		            action: "rover.groups.config({id:'NEW_GROUP'})",
		            menuIndex: "menuCreateGroup"
		        }, {
		            title: "MENU_MANAGE_GROUP",
		            action: "rover.groups.search",
		            menuIndex: "menuManageGroup"
        		}, {
		            title: "MENU_CREATE_ALLOTMENT",
		            action: "rover.allotments.config({id:'NEW_ALLOTMENT'})",
		            menuIndex: "menuCreateAllotment"
		        }, {
		            title: "MENU_MANAGE_ALLOTMENT",
		            action: "rover.allotments.search",
		            menuIndex: "menuManageAllotment"
		        }]
		    }, {
		        title: "MENU_CONVERSATIONS",
		        // hidden: true,
		        action: "",
		        iconClass: "icon-conversations",
				menuIndex: "conversations",
		        submenu: [{
		            title: "MENU_SOCIAL_LOBBY",
		            action: ""
		        }, {
		            title: "MENU_MESSAGES",
		            action: ""
		        }, {
		            title: "MENU_REVIEWS",
		            action: ""
		        }]
		    }, {
		        title: "MENU_REV_MAN",
		        action: "",
		        iconClass: "icon-revenue",
		        menuIndex: "revenue-manager",
		        submenu: [{
 		            title: "MENU_RATE_MANAGER",
		            action: "rover.rateManager",
		            menuIndex: "rateManager"
		        }, {
		            title: "MENU_TA_CARDS",
		            action: "rover.companycardsearch",
		            menuIndex: "cards"
		        }, {
					title: "MENU_SELL_LIMITS",
					action: "rover.overbooking",
					menuIndex: "overbooking",
					hidden: !shouldShowSellLimits()
		        }, {
					title: "MENU_EVENTS",
					action: "rover.houseEvents",
					menuIndex: "events",
					hidden: this.hideMenuOnPermission('EVENTS'),
					hideOnMobile: true
		        }]
		    }, {
		        title: "MENU_HOUSEKEEPING",
		        // hidden: true,
		        action: "",
		        iconClass: "icon-housekeeping",
		        menuIndex: "housekeeping",
		        submenu: [{
		            title: "MENU_ROOM_STATUS",
		            action: "rover.housekeeping.roomStatus",
		            menuIndex: "roomStatus"
		        }, {
		            title: "MENU_TASK_MANAGEMENT",
		            action: "rover.workManagement.start",
		            menuIndex: "workManagement",
					hidden: !shouldShowTaskManagementInHKMenu(),
					hideOnMobile: true

		        }, {
		            title: "MENU_MAINTAENANCE",
		            action: "",
		            menuIndex: "maintanance",
					hidden: true
		        }]
		    },
		    {
		        title: "MENU_FINANCIALS",
		        // hidden: true,
		        action: "",
		        iconClass: "icon-financials",
		        menuIndex: "financials",
		        submenu: [{
		            title: "MENU_JOURNAL",
		            action: "rover.financials.journal({ id : 'REVENUE'})",
		            menuIndex: "journals"
		        }, {
		            title: "MENU_CC_TRANSACTIONS",
		            action: "rover.financials.ccTransactions",
					menuIndex: "ccTransactions",
					actionParams: {
						isRefresh: true
					},
					hideOnMobile: true
		        }, {
		            title: "MENU_ACCOUNTS_RECEIVABLES",
		            action: "rover.financials.accountsReceivables",
		            menuIndex: "accountsReceivables"
		        }, {
		            title: "MENU_COMMISIONS",
		            action: "rover.financials.commisions",
		            menuIndex: "commisions"
		        }, {
		            title: "MENU_INVOICE_SEARCH",
		            action: "rover.financials.invoiceSearch",
		            menuIndex: "invoiceSearch",
					hidden: !shouldShowInvoiceSearchInFinancialsMenu(),
					hideOnMobile: true
		        },
                {
                    title: "AUTO_CHARGE",
                    action: "rover.financials.autoCharge",
                    menuIndex: "autoCharge",
					hidden: !shouldShowAutochargeInFinancialsMenu(),
					hideOnMobile: true
                },
				{
					title: "MENU_CURRENY_EXCHANGE",
					action: "",
					actionPopup: true,
					menuIndex: "currencyExchange",
					hidden: !shouldShowCurrencyExchangeInFinancialsMenu(),
					hideOnMobile: true
				},
				{
					title: "BUDGETS",
					action: "rover.financials.budgets",
					actionPopup: true,
					menuIndex: "budgets",
					hidden: !shouldShowBudgetsMenu(),
					hideOnMobile: true
				}

                ]
            }, {
                title: "MENU_ACTIONS",
                action: "",
                iconClass: "icon-actions",
                menuIndex: "actions",
                submenu: [{
		            title: "MENU_ACTIONS_MANAGER",
		            action: "rover.actionsManager",
		            menuIndex: "actionManager",
		            iconClass: "icon-actions"
		        },
		        {
		            title: "QUICKTEXT",
		            action: "rover.quicktext",
		            menuIndex: "QuickText",
					hidden: !shouldShowQucikTextMenu(),
					hideOnMobile: true
		        }]
            },
            {
		        title: "MENU_REPORTS",		        
		        action: "",
		        iconClass: "icon-reports",
				menuIndex: "reports",
				hideOnMobile: true,
		        submenu: [{
		            title: "MENU_NEW_REPORT",
		            action: "rover.reports.dashboard",
		            menuIndex: "new_report"
		        }, {
		            title: "MENU_REPORTS_INBOX",
		            action: "rover.reports.inbox",
		            menuIndex: "reports-inbox",
		            hidden: !$rootScope.isBackgroundReportsEnabled
		        }, {
		            title: "MENU_SCHEDULE_REPORT_OR_EXPORT",
		            action: "rover.reports.scheduleReportsAndExports",
		            menuIndex: "schedule_report_export"
		        }]
            }            
		];

		return processMenuList (menuList);
	};

	/**
	* method to 3rd party connected PMS - for now OPERA
	* @return {array} - List of Menu
	*/
	this.getMainMenuForConnectedRover = function() {
		var defaultDashboardState 	= getDefaultDashboardState ();

		var menu = [
			{
				title: "MENU_DASHBOARD",
				action: defaultDashboardState,
				menuIndex: "dashboard",
				submenu: [],
				iconClass: "icon-dashboard"
			},
			{
				title: "MENU_HOUSEKEEPING",
				action: "",
				iconClass: "icon-housekeeping",
				submenu: [
					{
						title: "MENU_ROOM_STATUS",
						action: "rover.housekeeping.roomStatus",
						menuIndex: "roomStatus"
					}
				]
			},
			{
		        title: "MENU_REPORTS",		        
		        action: "",
		        iconClass: "icon-reports",
		        menuIndex: "reports",
		        submenu: [{
		            title: "MENU_NEW_REPORT",
		            action: "rover.reports.dashboard",
		            menuIndex: "new_report"
		        }, {
		            title: "MENU_REPORTS_INBOX",
		            action: "rover.reports.inbox",
		            menuIndex: "reports-inbox",
		            hidden: !$rootScope.isBackgroundReportsEnabled
		        }, {
		            title: "MENU_SCHEDULE_REPORT_OR_EXPORT",
		            action: "rover.reports.scheduleReportsAndExports",
		            menuIndex: "schedule_report_export"
		        }]
            }
		];

		return processMenuList (menu);
	};

	/**
	* method to get mobile menu for standalone
	* @return {array} - List of Menu
	*/
	this.getMobileMenuForStandAloneRover = function() {
		var defaultDashboardState 	= getDefaultDashboardState ();

	    // menu for mobile views
	    var menu = [
			{
				title: "MENU_DASHBOARD",
				action: defaultDashboardState,
				menuIndex: "dashboard",
				iconClass: "icon-dashboard"
			},
			{
				title: "MENU_ROOM_STATUS",
				action: "rover.housekeeping.roomStatus",
				menuIndex: "roomStatus",
				iconClass: "icon-housekeeping"
			}
		];

		return processMenuList (menu);
	};

	/**
	* method to get mobile menu for connected
	* @return {array} - List of Menu
	*/
	this.getMobileMenuForConnectedRover = function() {
		var defaultDashboardState 	= getDefaultDashboardState ();

	    // menu for mobile views
	    var menu = [
			{
				title: "MENU_DASHBOARD",
				action: defaultDashboardState,
				menuIndex: "dashboard",
				iconClass: "icon-dashboard"
			},
			{
				title: "MENU_ROOM_STATUS",
				action: "rover.housekeeping.roomStatus",
				menuIndex: "roomStatus",
				iconClass: "icon-housekeeping"
			}
		];

		return processMenuList (menu);
	};


    /**
	* method to get settings menu
	* @return {array} - List of Menu
	*/
	this.getSettingsSubmenu = function() {
		var defaultDashboardState 	= getDefaultDashboardState ();

		var menu = [
			{
				title: "SETTINGS",
				menuIndex: "settings",
				action: "",
				submenu: [
					{
						title: "CAHNGE_PASSWORD",
						action: "",
						menuIndex: "changePassword",
						actionPopup: true
					},
					{
						title: "SETTINGS",
						action: "",
						menuIndex: "adminSettings",
						actionPopup: true
					}
				]
			}];

        // if the device is iPad, add extra menu Item to see details
        if ((sntapp.browser === 'rv_native' && sntapp.cordovaLoaded) ||
                // CICO-45053 Device Status menu to be made available also when active WS connection is available
            sntapp.desktopCardReader.canGetDeviceStatus) {

            menu[0].submenu.splice(1, 0, {
                title: 'DEVICE_STATUS',
                action: '',
                menuIndex: 'deviceStatus',
                actionPopup: true,
                hideItem: !sntapp.desktopCardReader.canGetDeviceStatus &&
                            (_.isNull($rootScope.iosAppVersion) || _.isUndefined($rootScope.iosAppVersion))
            });
        }

		return processMenuList (menu);
	};


	/**
	* function to check permissions against a menu
	* @param {string}, menu index
	* @return {boolean}
	*/
	this.hasMenuPermission = function(menuIndex) {

		// NOTE:- {key: menuIndex, value: [PERMISSIONS]}
		var menuPermissions = {
			'search': ['SEARCH_RESERVATIONS'],
			'createReservation': ['CREATE_EDIT_RESERVATIONS'],
			'postcharges': ['ACCESS_POST_CHARGES'],

			'cashier': ['ACCESS_CASHIERING'],
			'endOfDay': ['ACCESS_RUN_END_OF_DAY'],
			'rateManager': ['ACCESS_RATE_MANAGER'],

			'cards': ['ACCESS_COMPANY_TA_CARDS'],
			'distribution_manager': ['ACCESS_DISTRIBUTION_MENU'],
			'roomStatus': ['HOUSEKEEPING_ROOM_STATUS_ACCESS'],

			'workManagement': ['ACCESS_TASK_MANAGEMENT'],
			'maintanance': ['ACCESS_TASK_MAINTENANCE'],
			'journals': ['ACCESS_JOURNAL'],
			'ccTransactions': ['VIEW_CC_TRANSACTIONS'],

			'accountsReceivables': ['ACCESS_ACCOUNTING_INTERFACE'],
			'accounting': ['ACCESS_ACCOUNTING_INTERFACE'],
			'commisions': ['ACCESS_COMMISSIONS'],
			'diaryReservation': ['CREATE_EDIT_RESERVATIONS'],
			'nightlyDiaryReservation': ['ACCESS_ROOM_DIARY'],

			'menuGroups': [],
			'menuCreateGroup': ['GROUP_CREATE'],
			'menuManageGroup': ['GROUP_MANAGE'],

			'menuCreateAllotment': ['ALLOTMENTS_CREATE'],
			'menuManageAllotment': ['ALLOTMENTS_MANAGE'],

			'accounts': ['ACCESS_ACCOUNTS'],

			'changePassword': ['SETTINGS_CHANGE_PASSWORD_MENU'],
			'adminSettings': ['SETTINGS_ACCESS_TO_HOTEL_ADMIN'],
			'overbooking': ['OVERBOOKING_MENU']


		};

		var permissions = null, collectivePermissionValue = true;

		if (menuIndex in menuPermissions) {
			permissions = menuPermissions[menuIndex];

			_.each(permissions, function(item) {
				collectivePermissionValue = collectivePermissionValue * rvPermissionSrv.getPermissionValue(item);
			});
			return collectivePermissionValue;
		}
		return true;
	};

	/**
	* function to check whether a menu has some role based association
	* @param {string}, menu index
	* @return {boolean}
	*/
	this.hasRolePermission = function(menuIndex) {
		var user = RVDashboardSrv.getUserDetails(),
			role = user.user_role,
			isHotelAdmin = (role === "Hotel Admin" || role === "Chain Admin"),
			isHotelStaff = user.is_staff,
			returnValue = false;

		// currently every menu is available for Hotel Admin & Hotel Staff
		returnValue = (isHotelAdmin || isHotelStaff);


		return returnValue;
	};

	/*
	 *	Utility method to check whether we need to show DIARY menu
	 *	Based on settings values inside Reservation settings.
	 */
	var showHourlyDiaryMenu = function() {
		
		/**
		 *	A = settings.day_use_enabled (true / false)
		 *	B = settings.hourly_rates_for_day_use_enabled (true / false)
		 *	C = settings.hourly_availability_calculation ('FULL' / 'LIMITED')
		 *
		 *	A == false => 1. Default with nightly Diary. No navigation to Hourly ( we can hide the toggle from UI ).
		 *	A == true && B == false => 3. Default with nightly Diary. Able to view Hourly ( we can show the toggle from UI ).
		 *	A == true && B == true && C == 'FULL' => 4. Default with Hourly Diary. Able to view Nightly ( we can show the toggle from UI ).
		 *	A == true && B == true && C == 'LIMITED' => 3. Default with nightly Diary. Able to view Hourly ( we can show the toggle from UI ).
		 */

		var diaryConfig = $rootScope.hotelDiaryConfig,
			showHourlyDiaryMenu = false;

		// A == true && B == true && C == 'FULL' => 4. Default with Hourly Diary. Able to view Nightly ( we can show the toggle from UI ).
		if ( diaryConfig.dayUseEnabled && diaryConfig.hourlyRatesForDayUseEnabled && diaryConfig.mode === 'FULL' ) {
			showHourlyDiaryMenu = true;
		}

		return showHourlyDiaryMenu;
	};

	/**
	* function to check whether a menu has some role based association
	* @param {string}, menu index
	* @return {boolean}
	*/
	this.hasSettingsPermission = function(menuIndex) {

		var returnValue = true;

		switch (menuIndex) {
			case 'diaryReservation':
				returnValue = isHourlyRateOn() || showHourlyDiaryMenu();
				break;

			case 'nightlyDiaryReservation':
				var isRoomDiaryEnabled = ($rootScope.isPmsProductionEnv) ? $rootScope.isRoomDiaryEnabled : true;

				returnValue = ( !isHourlyRateOn() && !showHourlyDiaryMenu() ) && isRoomDiaryEnabled;
				break;

			// dont wanted to show on hourly enabled hotels
			case 'menuGroups':
				returnValue = !isHourlyRateOn() && !showHourlyDiaryMenu();
				break;

			// if auto change business is not enabled, we have to show EOD menu
			// hote admin -> Hotel & Staff -> Settings & Parameter -> AUTO CHANGE BUSINESS DATE
			case 'endOfDay':
				returnValue = true;
				break;

			// we are hiding conversations for now
			case 'conversations':
				returnValue = false;
				break;

			case 'reports':
				// we are hiding the reports menu if it is a floor & maintanance staff	in connected/standalon

				break;
			case 'workManagement':
				returnValue = !isHourlyRateOn();
				break;

			case 'sociallobby':
				returnValue = isNeighboursEnabled();
				break;
				// we display social lobby to only

			// dont wanted to show on hourly enabled hotels
			case 'overbooking':
				var isSellLimitEnabled = ($rootScope.isPmsProductionEnv) ? $rootScope.isSellLimitEnabled : true;

				returnValue = !isHourlyRateOn() && !isConnected() && isSellLimitEnabled;
				break;

			default:
        		break;
		}

		return returnValue;
	};

	/*
	* function to check permissions against a menu
	* @param {string}, menu index
	* @return {boolean}
	*/
	this.shouldShowMenuItem = function(menuIndex) {
		if (!self.hasMenuPermission (menuIndex)) {
			return false;
		}
		if (!self.hasRolePermission (menuIndex)) {
			return false;
		}
		if (!self.hasSettingsPermission (menuIndex)) {
			return false;
		}
		return true;
	};

	/**
	 * Hide events menu based on permission
	 */
	this.hideMenuOnPermission = function(permissionKey) {
		return !rvPermissionSrv.getPermissionValue(permissionKey);
	};

	var shouldShowBudgetsMenu = function() {
		return RVHotelDetailsSrv.hotelDetails.enable_budgets &&
			rvPermissionSrv.getPermissionValue('FINANCIALS');
    };

}] );
