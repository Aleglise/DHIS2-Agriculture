/* global moment */

'use strict';

/* Filters */

var resultsFrameworkFilters = angular.module('resultsFrameworkFilters', [])

.filter('d2LastUpdated', function(){    
    
    return function(d){

        if(!d ){
            return moment().fromNow();
        }

        return moment(d).fromNow();
    }; 
});