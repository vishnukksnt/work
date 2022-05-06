angular.module('reportsModule', [])
    .config(function ($stateProvider, $urlRouterProvider, $translateProvider) {

        $stateProvider.state('rover.reports', {
            url: '/reports',
            abstract: true,
            templateUrl: '/assets/partials/reports/rvReports.html',
            controller: 'RVReportsMainCtrl',
            resolve: {
                payload: function (RVreportsSrv) {
                    return RVreportsSrv.reportApiPayload();
                }
            },
            lazyLoad: function ($transition$) {
                return $transition$.injector().get('jsMappings').
                    fetchAssets(['react.files', 'rover.reports', 'directives'], ['react']);
            }
        });

        $stateProvider.state('rover.reports.dashboard', {
            url: '/list',
            templateUrl: '/assets/partials/reports/rvReportsDashboard.html',
            controller: 'RVReportsDashboardCtrl',
            params: {
                refresh: true
            }
        });

        $stateProvider.state('rover.reports.show', {
            url: '/view',
            templateUrl: '/assets/partials/reports/rvReportsDetailedView.html',
            controller: 'RVReportDetailsCtrl',
            params: {
                report: null,
                action: {
                    value: '',
                    dynamic: true // INFO https://ui-router.github.io/guide/ng1/migrate-to-1_0#dynamic-parameters
                },
                page: {
                    value: 1,
                    dynamic: true
                }
            }
        });        

        $stateProvider.state('rover.reports.inbox', {
            url: '/inbox',
            templateUrl: '/assets/partials/reports/backgroundReports/rvReportsInbox.html',
            controller: 'RVReportsInboxCtrl',
            resolve: {
                generatedReportsList: function (RVReportsInboxSrv, $filter, $rootScope, $state) {
                    var params = {
                        generated_date: $state.transition.params().date,
                        per_page: RVReportsInboxSrv.PER_PAGE,
                        user_id: $rootScope.userId,
                        page: $state.transition.from('name').name === 'rover.reports.dashboard' ? 1 : $state.transition.params().page
                    };

                    return RVReportsInboxSrv.fetchReportInbox(params);
                }
            },
            params: {
                page: 1,
                date: ''
            }            
        });

        $stateProvider.state('rover.reports.scheduleReportsAndExports', {
            url: '/scheduleReportsAndExports',
            templateUrl: '/assets/partials/reports/backgroundReports/rvScheduleReportsAndExports.html',
            controller: 'RVScheduleReportsAndExportsCtrl',
            params: {
                showScheduledReports: false,
                showScheduledExports: false,
                showCustomExports: false
            }
        });
        
    });
