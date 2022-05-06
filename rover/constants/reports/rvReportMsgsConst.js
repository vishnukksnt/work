'use strict';

angular.module('reportsModule').constant('RVReportMsgsConst', {
	'REPORT_FILTER_CHANGED': 'report.filter.change',
	'REPORT_SUBMITED': 'report.submited',
	'REPORT_UPDATED': 'report.updated',
	'REPORT_PAGE_CHANGED': 'report.page.changed',
	'REPORT_PRE_PRINT_DONE': 'report.pre.print.done',
	'REPORT_PRINTING': 'report.printing',
	'REPORT_API_FAILED': 'report.API.failed',
	'REPORT_LIST_SCROLL_REFRESH': 'report.list.scroll.refresh',
	'REPORT_DETAILS_FILTER_SCROLL_REFRESH': 'report.details.filter.scroll.refresh',
	'REPORT_LOAD_LAST_REPORT': 'report.show.last'
});