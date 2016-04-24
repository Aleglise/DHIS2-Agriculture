'use strict';

/* App Module */

var performanceContract = angular.module('performanceContract',
        ['ui.bootstrap', 
         'ngRoute', 
         'ngCookies',
         'ngSanitize',
         'ngMessages',
         'performanceContractServices',
         'performanceContractFilters',
         'performanceContractDirectives', 
         'performanceContractControllers',
         'd2Directives',
         'd2Filters',
         'd2Services',
         'd2Controllers',
         'angularLocalStorage',
         'ui.select',
         'ui.select2',
         'd2HeaderBar',
         'pascalprecht.translate'])
              
.value('DHIS2URL', '..')

.config(function($httpProvider, $routeProvider, $translateProvider) {    
            
    $httpProvider.defaults.useXDomain = true;
    delete $httpProvider.defaults.headers.common['X-Requested-With'];
    
    $routeProvider.when('/', {
        templateUrl:'components/performance-contract/performance-contract.html',
        controller: 'PerformanceContractController'
    }).otherwise({
        redirectTo : '/'
    });  
    
    $translateProvider.preferredLanguage('en');
    $translateProvider.useSanitizeValueStrategy('escaped');
    $translateProvider.useLoader('i18nLoader');    
})

.run(function($rootScope){    
    $rootScope.maxOptionSize = 50;
});
