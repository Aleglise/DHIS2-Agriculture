/* global dhis2, angular, selection, i18n_ajax_login_failed, _ */

dhis2.util.namespace('dhis2.rf');

// whether current user has any organisation units
dhis2.rf.emptyOrganisationUnits = false;

var i18n_no_orgunits = 'No organisation unit attached to current user, no data entry possible';
var i18n_offline_notification = 'You are offline';
var i18n_online_notification = 'You are online';
var i18n_ajax_login_failed = 'Login failed, check your username and password and try again';

var optionSetsInPromise = [];
var attributesInPromise = [];
var batchSize = 50;

dhis2.rf.store = null;
dhis2.rf.metaDataCached = dhis2.rf.metaDataCached || false;
dhis2.rf.memoryOnly = $('html').hasClass('ie7') || $('html').hasClass('ie8');
var adapters = [];    
if( dhis2.rf.memoryOnly ) {
    adapters = [ dhis2.storage.InMemoryAdapter ];
} else {
    adapters = [ dhis2.storage.IndexedDBAdapter, dhis2.storage.DomLocalStorageAdapter, dhis2.storage.InMemoryAdapter ];
}

dhis2.rf.store = new dhis2.storage.Store({
    name: 'dhis2rf',
    adapters: [dhis2.storage.IndexedDBAdapter, dhis2.storage.DomSessionStorageAdapter, dhis2.storage.InMemoryAdapter],
    objectStores: ['dataSets', 'optionSets', 'dataElementGroups', 'dataElementGroupSets', 'indicatorGroups', 'indicatorGroupSets', 'categoryCombos', 'constants', 'attributes']
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
    
    
    downloadMetaData();
});

$(document).bind('dhis2.online', function(event, loggedIn)
{
    if (loggedIn)
    {
        if (dhis2.rf.emptyOrganisationUnits) {
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
    if (dhis2.rf.emptyOrganisationUnits) {
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

    promise = promise.then( dhis2.rf.store.open );
    promise = promise.then( getUserRoles );
    promise = promise.then( getCalendarSetting );
    
    //fetch met attributes
    promise = promise.then( getMetaAttributes );
    promise = promise.then( filterMissingAttributes );
    promise = promise.then( getAttributes );
    
    //fetch constants
    promise = promise.then( getMetaConstants );
    promise = promise.then( filterMissingConstants );
    promise = promise.then( getConstants );
    
    //fetch category combos
    promise = promise.then( getMetaCategoryCombos );
    promise = promise.then( filterMissingCategoryCombos );
    promise = promise.then( getCategoryCombos );
    
    //fetch data element group sets
    promise = promise.then( getMetaDataElementGroupSets );
    promise = promise.then( filterMissingDataElementGroupSets );
    promise = promise.then( getDataElementGroupSets );
    
    //fetch data element groups
    promise = promise.then( getMetaDataElementGroups );
    promise = promise.then( filterMissingDataElementGroups );
    promise = promise.then( getDataElementGroups );
    
    //fetch indicator group sets
    promise = promise.then( getMetaIndicatorGroupSets );
    promise = promise.then( filterMissingIndicatorGroupSets );
    promise = promise.then( getIndicatorGroupSets );
    
    //fetch indicator groups
    promise = promise.then( getMetaIndicatorGroups );
    promise = promise.then( filterMissingIndicatorGroups );
    promise = promise.then( getIndicatorGroups );     
    
    //fetch data sets
    promise = promise.then( getMetaDataSets );
    promise = promise.then( filterMissingDataSets );
    promise = promise.then( getDataSets );
    
    promise.done(function() {
        dhis2.availability.startAvailabilityCheck();
        console.log( 'Finished loading meta-data' );
        $.event.trigger({type: "metaDataCached", message: true});
    });

    def.resolve();    
}

function getUserRoles(){
    var SessionStorageService = angular.element('body').injector().get('SessionStorageService');    
    if( SessionStorageService.get('USER_ROLES') ){
       return; 
    }    
    return dhis2.metadata.getMetaObject(null, 'USER_ROLES', '../api/me.json', 'fields=id,displayName,userCredentials[userRoles[id,authorities,dataSets]]', 'sessionStorage', dhis2.rf.store);
}

function getCalendarSetting(){   
    if(localStorage['CALENDAR_SETTING']){
       return; 
    }    
    return dhis2.metadata.getMetaObject(null, 'CALENDAR_SETTING', '../api/systemSettings', 'key=keyCalendar&key=keyDateFormat', 'localStorage', dhis2.rf.store);
}

function getMetaAttributes(){
    return dhis2.metadata.getMetaObjectIds('attributes', '../api/attributes.json', 'paging=false&fields=id');
}

function filterMissingAttributes( ids ){
    return dhis2.metadata.filterMissingObjs('attributes', dhis2.rf.store, ids);
}

function getAttributes( ids ){
    return dhis2.metadata.getBatches( ids, batchSize, 'attributes', 'attributes', '../api/attributes.json', 'paging=false&fields=:all,optionSet[id,displayName,options[id,displayName,code]]', 'idb', dhis2.rf.store);
}

function getMetaConstants(){
    return dhis2.metadata.getMetaObjectIds('constants', '../api/constants.json', 'paging=false&fields=id');
}

function filterMissingConstants( ids ){
    return dhis2.metadata.filterMissingObjs('constants', dhis2.rf.store, ids);
}

function getConstants( ids ){
    return dhis2.metadata.getBatches( ids, batchSize, 'constants', 'constants', '../api/constants.json', 'paging=false&fields=id,name,displayName,value', 'idb', dhis2.rf.store);
}

function getMetaCategoryCombos(){
    return dhis2.metadata.getMetaObjectIds('categoryCombos', '../api/categoryCombos.json', 'paging=false&fields=id');
}

function filterMissingCategoryCombos( ids ){
    return dhis2.metadata.filterMissingObjs('categoryCombos', dhis2.rf.store, ids);
}

function getCategoryCombos( ids ){    
    return dhis2.metadata.getBatches( ids, batchSize, 'categoryCombos', 'categoryCombos', '../api/categoryCombos.json', 'paging=false&fields=id,name,code,skipTotal,isDefault,categories[id,name,categoryOptions[id,name,code]]', 'idb', dhis2.rf.store);
}

function getMetaDataElementGroupSets(){
    return dhis2.metadata.getMetaObjectIds('dataElementGroupSets', '../api/dataElementGroupSets.json', 'paging=false&fields=id');
}

function filterMissingDataElementGroupSets( ids ){
    return dhis2.metadata.filterMissingObjs('dataElementGroupSets', dhis2.rf.store, ids);
}

function getDataElementGroupSets( ids ){    
    return dhis2.metadata.getBatches( ids, batchSize, 'dataElementGroupSets', 'dataElementGroupSets', '../api/dataElementGroupSets.json', 'paging=false&fields=id,name,code', 'idb', dhis2.rf.store);
}

function getMetaDataElementGroups(){
    return dhis2.metadata.getMetaObjectIds('dataElementGroups', '../api/dataElementGroups.json', 'paging=false&fields=id');
}

function filterMissingDataElementGroups( ids ){
    return dhis2.metadata.filterMissingObjs('dataElementGroups', dhis2.rf.store, ids);
}

function getDataElementGroups( ids ){    
    return dhis2.metadata.getBatches( ids, batchSize, 'dataElementGroups', 'dataElementGroups', '../api/dataElementGroups.json', 'paging=false&fields=id,name,code', 'idb', dhis2.rf.store);
}

function getMetaIndicatorGroupSets(){
    return dhis2.metadata.getMetaObjectIds('indicatorGroupSets', '../api/indicatorGroupSets.json', 'paging=false&fields=id');
}

function filterMissingIndicatorGroupSets( ids ){
    return dhis2.metadata.filterMissingObjs('indicatorGroupSets', dhis2.rf.store, ids);
}

function getIndicatorGroupSets( ids ){    
    return dhis2.metadata.getBatches( ids, batchSize, 'indicatorGroupSets', 'indicatorGroupSets', '../api/dataElementGroupSets.json', 'paging=false&fields=id,name,indicatorGroups[id,name,code,indicators[id,name,code]]', 'idb', dhis2.rf.store);
}

function getMetaIndicatorGroups(){
    return dhis2.metadata.getMetaObjectIds('indicatorGroups', '../api/indicatorGroups.json', 'paging=false&fields=id');
}

function filterMissingIndicatorGroups( ids ){
    return dhis2.metadata.filterMissingObjs('indicatorGroups', dhis2.rf.store, ids);
}

function getIndicatorGroups( ids ){    
    return dhis2.metadata.getBatches( ids, batchSize, 'indicatorGroups', 'indicatorGroups', '../api/indicatorGroups.json', 'paging=false&fields=id,name,description,version,attributeValues[value,attribute[id,name,code]', 'idb', dhis2.rf.store);
}

function getMetaDataSets(){
    return dhis2.metadata.getMetaObjectIds('dataSets', '../api/dataSets.json', 'paging=false&fields=id');
}

function filterMissingDataSets( ids ){
    return dhis2.metadata.filterMissingObjs('dataSets', dhis2.rf.store, ids);
}

function getDataSets( ids ){    
    return dhis2.metadata.getBatches( ids, batchSize, 'dataSets', 'dataSets', '../api/dataSets.json', 'paging=false&fields=id,periodType,name,displayName,version,attributeValues[value,attribute[id,name,code],indicators[id,indicatorGrop[id]],organisationUnits[id,name],dataElements[id,code,name,description,formName,valueType,optionSetValue,optionSet[id],dataElementGroups[id,dataElementGroupSet[id]],categoryCombo[id,isDefault]]', 'idb', dhis2.rf.store);
}