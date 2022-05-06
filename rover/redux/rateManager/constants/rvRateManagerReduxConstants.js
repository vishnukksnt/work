'use strict';

var RM_RX_CONST = {
	GRID_VIEW: 'RM_Grid_View',
	GRAPH_VIEW: 'RM_Graph_View',
	RATE_VIEW_WITH_ADDRESS: "Rate_View_With_Address",

	RATE_VIEW_CHANGED: 'RM_Rate_View_Changed',
	ROOM_TYPE_VIEW_CHANGED: 'RM_Room_Type_View_Changed',
	RATE_TYPE_VIEW_CHANGED: 'RM_Rate_Type_View_Changed',
	SINGLE_RATE_EXPANDABLE_VIEW_CHANGED: 'RM_Single_Rate_Expandable_View_Changed',
	SHOW_NO_RESULTS: 'RM_Show_No_Results',

	NO_RESULTS_FOUND_MODE: 'RM_No_Results_Found_Mode',
	NOT_CONFIGURED_MODE: 'RM_Not_Configured_Mode',
	RATE_VIEW_MODE: 'RM_Rate_View', // pls change VIEW_MODE_TEXT_MAPPINGS: when changing this one
	ROOM_TYPE_VIEW_MODE: 'RM_Room_Type_View', // pls change VIEW_MODE_TEXT_MAPPINGS: when changing this one
	RATE_TYPE_VIEW_MODE: 'RM_Rate_Type_View', // pls change VIEW_MODE_TEXT_MAPPINGS: when changing this one
	SINGLE_RATE_EXPANDABLE_VIEW_MODE: 'RM_Single_Rate_Expandable_View', // pls change VIEW_MODE_TEXT_MAPPINGS: when changing this one

	REFRESH_SCROLLERS: 'RM_Refresh_Scrollers',
	SCROLLER_REFRESHED: 'RM_Refresh_Scroller_done',
	REFRESH_SCROLLERS_ACTION: 'RM_ACT_Refresh_Scrollers',

	OPEN_ALL: 'RM_Open_All_Button_Clicked',
	CLOSE_ALL: 'RM_Close_All_Button_Clicked',

	TOGGLE_EXPAND_COLLAPSE_ROW: 'RM_Toggle_Expand_collapse_row',
	HIERARCHY_FROZEN_PANEL_TOGGLED: 'RM_Toggle_Hierarchy_Frozen_Panel',

	ACT_SHOW_ACTIVITY_INDICATOR: 'RM_Act_Show_Activity_Indicator',
	ACTIVATE_LOADER: 'RM_Show_Loader',
	ACT_HIDE_ACTIVITY_INDICATOR: 'RM_Act_Hide_Activity_Indicator',
	HIDE_LOADER: 'RM_Hide_Loader',

	MAX_RESTRICTION_IN_COLUMN: 3,
	CLOSED_RESTRICTION_VALUE: 'CLOSED',

	VIEW_MODE_TEXT_MAPPINGS: {
		RM_Rate_View: 'All Rates',
		RM_Room_Type_View: 'All Room Types',
		RM_Rate_Type_View: 'All Rate Types',
		RM_Single_Rate_Expandable_View: 'All Room Types'
	},
	SHOW_AVAILABILITY: 'RM_Show_Availability'
};