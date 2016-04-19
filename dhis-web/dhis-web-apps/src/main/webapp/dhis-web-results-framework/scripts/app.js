'use strict';

/* App Module */

var resultsFramework = angular.module('resultsFramework',
        ['ui.bootstrap', 
         'ngRoute', 
         'ngCookies',
         'ngSanitize',
         'ngMessages',
         'resultsFrameworkServices',
         'resultsFrameworkFilters',
         'resultsFrameworkDirectives', 
         'resultsFrameworkControllers',
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
        templateUrl:'components/results-framework/results-framework.html',
        controller: 'ResultsFrameworkController'
    }).when('/program',{
        templateUrl:'components/program/program.html',
        controller: 'ProgramController'
    }).when('/project',{
        templateUrl:'components/project/project.html',
        controller: 'ProjectController'
    }).otherwise({
        redirectTo : '/'
    });  
    
    $translateProvider.preferredLanguage('en');
    $translateProvider.useSanitizeValueStrategy('escaped');
    $translateProvider.useLoader('i18nLoader');    
})

.run(function($rootScope){    
    $rootScope.maxOptionSize = 50;
    $rootScope.yearRange = 25;
});
