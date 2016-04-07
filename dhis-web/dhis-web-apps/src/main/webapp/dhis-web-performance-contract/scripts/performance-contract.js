/* global dhis2, angular, selection, i18n_ajax_login_failed, _ */

dhis2.util.namespace('dhis2.pc');

// whether current user has any organisation units
dhis2.pc.emptyOrganisationUnits = false;

var i18n_no_orgunits = 'No organisation unit attached to current user, no data entry possible';
var i18n_offline_notification = 'You are offline';
var i18n_online_notification = 'You are online';
var i18n_ajax_login_failed = 'Login failed, check your username and password and try again';

var optionSetsInPromise = [];
var attributesInPromise = [];

dhis2.pc.store = null;
dhis2.pc.metaDataCached = dhis2.pc.metaDataCached || false;
dhis2.pc.memoryOnly = $('html').hasClass('ie7') || $('html').hasClass('ie8');
var adapters = [];    
if( dhis2.pc.memoryOnly ) {
    adapters = [ dhis2.storage.InMemoryAdapter ];
} else {
    adapters = [ dhis2.storage.IndexedDBAdapter, dhis2.storage.DomLocalStorageAdapter, dhis2.storage.InMemoryAdapter ];
}

dhis2.pc.store = new dhis2.storage.Store({
    name: 'dhis2pc',
    adapters: [dhis2.storage.IndexedDBAdapter, dhis2.storage.DomSessionStorageAdapter, dhis2.storage.InMemoryAdapter],
    objectStores: ['dataSets', 'optionSets', 'dataElementGroups', 'dataElementGroupSets', 'indicatorGroups', 'indicatorGroupSets', 'categoryCombos', 'constants']
});

(function($) {
    $.safeEach = function(arr, fn)
    {
        if (arr)
        {
            $.each(arr, fn);
        }
    };
})(jQuery);

/**
 * Page init. The order of events is:
 *
 * 1. Load ouwt 
 * 2. Load meta-data (and notify ouwt) 
 * 
 */
$(document).ready(function()
{
    $.ajaxSetup({
        type: 'POST',
        cache: false
    });

    $('#loaderSpan').show();
});

$(document).bind('dhis2.online', function(event, loggedIn)
{
    if (loggedIn)
    {
        if (dhis2.pc.emptyOrganisationUnits) {
            setHeaderMessage(i18n_no_orgunits);
        }
        else {
            setHeaderDelayMessage(i18n_online_notification);
        }
    }
    else
    {
        var form = [
            '<form style="display:inline;">',
            '<label for="username">Username</label>',
            '<input name="username" id="username" type="text" style="width: 70px; margin-left: 10px; margin-right: 10px" size="10"/>',
            '<label for="password">Password</label>',
            '<input name="password" id="password" type="password" style="width: 70px; margin-left: 10px; margin-right: 10px" size="10"/>',
            '<button id="login_button" type="button">Login</button>',
            '</form>'
        ].join('');

        setHeaderMessage(form);
        ajax_login();
    }
});

$(document).bind('dhis2.offline', function()
{
    if (dhis2.pc.emptyOrganisationUnits) {
        setHeaderMessage(i18n_no_orgunits);
    }
    else {
        setHeaderMessage(i18n_offline_notification);
    }
});

function ajax_login()
{
    $('#login_button').bind('click', function()
    {
        var username = $('#username').val();
        var password = $('#password').val();

        $.post('../dhis-web-commons-security/login.action', {
            'j_username': username,
            'j_password': password
        }).success(function()
        {
            var ret = dhis2.availability.syncCheckAvailability();

            if (!ret)
            {
                alert(i18n_ajax_login_failed);
            }
        });
    });
}

// -----------------------------------------------------------------------------
// Metadata downloading
// -----------------------------------------------------------------------------

function downloadMetaData()
{
    console.log('Loading required meta-data');
    var def = $.Deferred();
    var promise = def.promise();

    promise = promise.then( dhis2.pc.store.open );
    promise = promise.then( getUserRoles );
    promise = promise.then( getCalendarSetting );
    promise = promise.then( getConstants );
    promise = promise.then( getDataElementGroupSets );
    promise = promise.then( getDataElementGroups );
    promise = promise.then( getMetaIndicatorGroups );
    promise = promise.then( getIndicatorGroups );
    promise = promise.then( getCategoryCombos );
    promise = promise.then( getMetaDataSets );     
    promise = promise.then( getDataSets );
    promise = promise.then( getOptionSetsForDataElements );
    promise.done(function() {        
        //Enable ou selection after meta-data has downloaded
        $( "#orgUnitTree" ).removeClass( "disable-clicks" );
        dhis2.pc.metaDataCached = true;
        dhis2.availability.startAvailabilityCheck();
        console.log( 'Finished loading meta-data' );        
        selection.responseReceived(); 
    });

    def.resolve();    
}

function processMetaDataAttribute( obj )
{
    if(!obj){
        return;
    }
    
    if(obj.attributeValues){
        for(var i=0; i<obj.attributeValues.length; i++){
            if(obj.attributeValues[i].value && obj.attributeValues[i].attribute && obj.attributeValues[i].attribute.code){
                obj[obj.attributeValues[i].attribute.code] = obj.attributeValues[i].value;
            }
        }
    }
    
    delete obj.attributeValues;
   
    return obj;    
}

function getUserRoles()
{
    var SessionStorageService = angular.element('body').injector().get('SessionStorageService');    
    if( SessionStorageService.get('USER_ROLES') ){
       return; 
    }
    
    var def = $.Deferred();
    var promise = def.promise();
    promise = promise.then( dhis2.tracker.getTrackerObject(null, 'USER_ROLES', '../api/me.json', 'fields=id,displayName,userCredentials[userRoles[id,authorities,programs,dataSets]]', 'sessionStorage', dhis2.pc.store) );
    promise = promise.done(function(){});    
    def.resolve();
}

function getCalendarSetting()
{   
    var def = $.Deferred();
    var promise = def.promise();
    promise = promise.then( dhis2.tracker.getTrackerObject(null, 'CALENDAR_SETTING', '../api/systemSettings', 'key=keyCalendar&key=keyDateFormat', 'localStorage', dhis2.pc.store) );
    promise = promise.done(function(){});    
    def.resolve();    
}

function getConstants()
{
    dhis2.pc.store.getKeys( 'constants').done(function(res){        
        if(res.length > 0){
            return;
        }        
        return dhis2.tracker.getTrackerObjects('constants', 'constants', '../api/constants.json', 'paging=false&fields=id,name,displayName,value', 'idb', dhis2.pc.store);        
    });    
}

function getCategoryCombos()
{    
    dhis2.pc.store.getKeys( 'categoryCombos').done(function(res){        
        if(res.length > 0){
            return;
        }
        return dhis2.tracker.getTrackerObjects('categoryCombos', 'categoryCombos', '../api/categoryCombos.json', 'paging=false&fields=id,name,code,skipTotal,isDefault,categories[id,name,categoryOptions[id,name,code]]', 'idb', dhis2.pc.store);
    });    
}

function getDataElementGroupSets()
 {    
    dhis2.pc.store.getKeys( 'dataElementGroupSets').done(function(res){        
        if(res.length > 0){
            return;
        }
        return dhis2.tracker.getTrackerObjects('dataElementGroupSets', 'dataElementGroupSets', '../api/dataElementGroupSets.json', 'paging=false&fields=id,name,code', 'idb', dhis2.pc.store);
    });
}

function getDataElementGroups()
{    
    dhis2.pc.store.getKeys( 'dataElementGroups').done(function(res){        
        if(res.length > 0){
            return;
        }
        return dhis2.tracker.getTrackerObjects('dataElementGroups', 'dataElementGroups', '../api/dataElementGroups.json', 'paging=false&fields=id,name,code', 'idb', dhis2.pc.store);
    });    
}

function getIndicatorGroupSets()
{    
    dhis2.pc.store.getKeys( 'indicatorGroupSets').done(function(res){        
        if(res.length > 0){
            return;
        }
        return dhis2.tracker.getTrackerObjects('indicatorGroupSets', 'indicatorGroupSets', '../api/indicatorGroupSets.json', 'paging=false&fields=id,name,indicatorGroups[id,name,code,indicators[id,name,code]]', 'idb', dhis2.pc.store);
    });    
}

function getMetaIndicatorGroups()
{    
    return dhis2.tracker.getTrackerObjects('indicatorGroups', 'indicatorGroups', '../api/indicatorGroups.json', 'paging=false&fields=id,version', 'temp', dhis2.pc.store);
}

function getIndicatorGroups( indicatorGroups )
{
    if( !indicatorGroups ){
        return;
    }
    
    var mainDef = $.Deferred();
    var mainPromise = mainDef.promise();

    var def = $.Deferred();
    var promise = def.promise();

    var builder = $.Deferred();
    var build = builder.promise();

    var ids = [];
    _.each( _.values( indicatorGroups ), function ( indicatorGroup ) {
        build = build.then(function() {
            var d = $.Deferred();
            var p = d.promise();
            dhis2.pc.store.get('indicatorGroups', indicatorGroup.id).done(function(obj) {
                if(!obj || obj.version !== indicatorGroup.version) {
                    ids.push( indicatorGroup.id );
                }

                d.resolve();
            });

            return p;
        });
    });

    build.done(function() {
        def.resolve();

        promise = promise.done( function () {
            var _ids = null;
            if( ids && ids.length > 0 ){
                _ids = ids.toString();
                _ids = '[' + _ids + ']';
                promise = promise.then( getAllIndicatorGroups( _ids ) );
            } 
            
            mainDef.resolve( indicatorGroups, ids );
        } );
    }).fail(function(){
        mainDef.resolve( null, null );
    });

    builder.resolve();

    return mainPromise;
}

function getAllIndicatorGroups( ids )
{    
    return function() {
        return $.ajax( {
            url: '../api/indicatorGroups.json',
            type: 'GET',
            data: 'fields=id,name,description,version,attributeValues[value,attribute[id,name,code]&filter=id:in:' + ids
        }).done( function( response ){
            
            if(response.indicatorGroups){
                _.each(_.values( response.indicatorGroups), function(indicatorGroup){                    
                    indicatorGroup = processMetaDataAttribute(indicatorGroup);
                    dhis2.pc.store.set( 'indicatorGroups', indicatorGroup );
                });
            }
        });
    };
}

function getMetaDataSets()
{    
    return dhis2.tracker.getTrackerObjects('dataSets', 'dataSets', '../api/dataSets.json', 'paging=false&fields=id,version,dataElements[[optionSet[id,version]]]', 'temp', dhis2.pc.store);
}

function getDataSets( dataSets )
{
    if( !dataSets ){
        return;
    }
    
    var mainDef = $.Deferred();
    var mainPromise = mainDef.promise();

    var def = $.Deferred();
    var promise = def.promise();

    var builder = $.Deferred();
    var build = builder.promise();

    var ids = [];
    _.each( _.values( dataSets ), function ( dataSet ) {
        build = build.then(function() {
            var d = $.Deferred();
            var p = d.promise();
            dhis2.pc.store.get('dataSets', dataSet.id).done(function(obj) {
                if(!obj || obj.version !== dataSet.version) {
                    ids.push( dataSet.id );
                }

                d.resolve();
            });

            return p;
        });
    });

    build.done(function() {
        def.resolve();

        promise = promise.done( function () {
            var _ids = null;
            if( ids && ids.length > 0 ){
                _ids = ids.toString();
                _ids = '[' + _ids + ']';
                promise = promise.then( getAllDataSets( _ids ) );
            } 
            
            mainDef.resolve( dataSets, ids );
        } );
    }).fail(function(){
        mainDef.resolve( null, null );
    });

    builder.resolve();

    return mainPromise;
}

function getAllDataSets( ids )
{    
    return function() {
        return $.ajax( {
            url: '../api/dataSets.json',
            type: 'GET',
            data: 'fields=id,periodType,displayName,version,attributeValues[value,attribute[id,name,code],indicators[id,indicatorGrop[id]],organisationUnits[id,name],dataElements[id,code,name,description,formName,valueType,optionSetValue,optionSet[id],dataElementGroups[id,dataElementGroupSet[id]],categoryCombo[id,isDefault]]&paging=false&filter=id:in:' + ids
        }).done( function( response ){
            
            if(response.dataSets){
                _.each(_.values( response.dataSets), function(dataSet){
                    var ou = {};
                    _.each(_.values( dataSet.organisationUnits), function(o){
                        ou[o.id] = o.name;
                    });
                    dataSet.organisationUnits = ou;                    
                    dataSet = processMetaDataAttribute(dataSet);

                    dhis2.pc.store.set( 'dataSets', dataSet );
                });
            }
        });
    };
}

function getOptionSetsForDataElements( dataSets, dataSetIds )
{
    if( !dataSets ){
        return;
    }
    var mainDef = $.Deferred();
    var mainPromise = mainDef.promise();

    var def = $.Deferred();
    var promise = def.promise();

    var builder = $.Deferred();
    var build = builder.promise();    

    _.each( _.values( dataSets ), function ( dataSet ) {                
        if(dataSet.dataElements){
            _.each(_.values( dataSet.dataElements ), function(dataElement){            
                if( dataElement.optionSet && dataElement.optionSet.id ){
                    build = build.then(function() {
                        var d = $.Deferred();
                        var p = d.promise();
                        dhis2.pc.store.get('optionSets', dataElement.optionSet.id).done(function(obj) {                                    
                            if( (!obj || obj.version !== dataElement.optionSet.version) && optionSetsInPromise.indexOf(dataElement.optionSet.id) === -1) {                                
                                optionSetsInPromise.push( dataElement.optionSet.id );
                            }
                            d.resolve();
                        });
                        return p;
                    });
                }            
            });
        }
    });

    build.done(function() {
        def.resolve();

        promise = promise.done( function () {
            
            if( optionSetsInPromise && optionSetsInPromise.length > 0 ){
                var _optionSetsInPromise = optionSetsInPromise.toString();
                _optionSetsInPromise = '[' + _optionSetsInPromise + ']';
                
                var filter = 'fields=id,displayName,version,options[id,displayName,code]';                
                filter = filter + '&filter=id:in:' + _optionSetsInPromise + '&paging=false';
                
                var url = '../api/optionSets';
                promise = promise.then( dhis2.tracker.getTrackerObjects( 'optionSets', 'optionSets', url, filter, 'idb', dhis2.pc.store ) );
            }
            
            mainDef.resolve( dataSets, dataSetIds );
        } );
    }).fail(function(){
        mainDef.resolve( null, null);
    });

    builder.resolve();

    return mainPromise;   
}