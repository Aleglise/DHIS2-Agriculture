
/* global dhis2, angular, i18n_ajax_login_failed, _, selection, selection */

dhis2.util.namespace('dhis2.ec');

// whether current user has any organisation units
dhis2.ec.emptyOrganisationUnits = false;

var i18n_no_orgunits = 'No organisation unit attached to current user, no data entry possible';
var i18n_offline_notification = 'You are offline, data will be stored locally';
var i18n_online_notification = 'You are online';
var i18n_need_to_sync_notification = 'There is data stored locally, please upload to server';
var i18n_sync_now = 'Upload';
var i18n_sync_success = 'Upload to server was successful';
var i18n_sync_failed = 'Upload to server failed, please try again later';
var i18n_uploading_data_notification = 'Uploading locally stored data to the server';

var PROGRAMS_METADATA = 'EVENT_PROGRAMS';

var EVENT_VALUES = 'EVENT_VALUES';
var optionSetsInPromise = [];

dhis2.ec.isOffline = false;
dhis2.ec.store = null;
dhis2.ec.memoryOnly = $('html').hasClass('ie7') || $('html').hasClass('ie8');
var adapters = [];    
if( dhis2.ec.memoryOnly ) {
    adapters = [ dhis2.storage.InMemoryAdapter ];
} else {
    adapters = [ dhis2.storage.IndexedDBAdapter, dhis2.storage.DomLocalStorageAdapter, dhis2.storage.InMemoryAdapter ];
}

dhis2.ec.store = new dhis2.storage.Store({
    name: 'dhis2ec',
    adapters: [dhis2.storage.IndexedDBAdapter, dhis2.storage.DomSessionStorageAdapter, dhis2.storage.InMemoryAdapter],
    objectStores: ['programs', 'optionSets', 'events', 'programValidations', 'programRules', 'programRuleVariables', 'programIndicators', 'ouLevels', 'constants']
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
 * 1. Load ouwt 2. Load meta-data (and notify ouwt) 3. Check and potentially
 * download updated forms from server
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
        dhis2.ec.isOffline = false;
        
        var OfflineECStorageService = angular.element('body').injector().get('OfflineECStorageService');

        OfflineECStorageService.hasLocalData().then(function(localData){
            if(localData){
                var message = i18n_need_to_sync_notification
                    + ' <button id="sync_button" type="button">' + i18n_sync_now + '</button>';

                setHeaderMessage(message);

                $('#sync_button').bind('click', uploadLocalData);
            }
            else{
                if (dhis2.ec.emptyOrganisationUnits) {
                    setHeaderMessage(i18n_no_orgunits);
                }
                else {
                    setHeaderDelayMessage(i18n_online_notification);
                }
            }
        });
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
    if (dhis2.ec.emptyOrganisationUnits) {
        setHeaderMessage(i18n_no_orgunits);
    }
    else {
        dhis2.ec.isOffline = true;
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

function downloadMetaData(){    
    
    console.log('Loading required meta-data');
    var def = $.Deferred();
    var promise = def.promise();
    
    promise = promise.then( dhis2.ec.store.open );    
    promise = promise.then( getUserRoles );
    promise = promise.then( getCalendarSetting );
    promise = promise.then( getConstants );
    promise = promise.then( getOrgUnitLevels );    
    promise = promise.then( getMetaPrograms );     
    promise = promise.then( getPrograms );     
    promise = promise.then( getMetaProgramValidations );
    promise = promise.then( getProgramValidations );
    promise = promise.then( getMetaProgramIndicators );
    promise = promise.then( getProgramIndicators );
    promise = promise.then( getMetaProgramRules );
    promise = promise.then( getProgramRules );
    promise = promise.then( getMetaProgramRuleVariables );
    promise = promise.then( getProgramRuleVariables );
    promise = promise.then( getOptionSets );    
    promise.done( function() {    
        //Enable ou selection after meta-data has downloaded
        $( "#orgUnitTree" ).removeClass( "disable-clicks" );
        
        console.log( 'Finished loading meta-data' ); 
        dhis2.availability.startAvailabilityCheck();
        console.log( 'Started availability check' );
        selection.responseReceived();
    });         

    def.resolve();
}

function getUserRoles()
{
    var SessionStorageService = angular.element('body').injector().get('SessionStorageService');    
    if( SessionStorageService.get('USER_ROLES') ){
       return; 
    }
    
    var def = $.Deferred();
    var promise = def.promise();
    promise = promise.then( dhis2.tracker.getTrackerObject(null, 'USER_ROLES', '../api/me.json', 'fields=id,name,userCredentials[userRoles[id,authorities]]', 'sessionStorage', dhis2.ec.store) );
    promise = promise.done(function(){});    
    def.resolve();
}

function getCalendarSetting()
{   
    var def = $.Deferred();
    var promise = def.promise();
    promise = promise.then( dhis2.tracker.getTrackerObject(null, 'CALENDAR_SETTING', '../api/systemSettings', 'key=keyCalendar&key=keyDateFormat', 'localStorage', dhis2.ec.store) );
    promise = promise.done(function(){});    
    def.resolve();    
}

function getConstants()
{
    dhis2.ec.store.getKeys( 'constants').done(function(res){        
        if(res.length > 0){
            return;
        }        
        return dhis2.tracker.getTrackerObjects('constants', 'constants', '../api/constants.json', 'paging=false&fields=id,name,displayName,value', 'idb', dhis2.ec.store);        
    });    
}

function getOrgUnitLevels()
{
    dhis2.ec.store.getKeys( 'ouLevels').done(function(res){        
        if(res.length > 0){
            return;
        }        
        return dhis2.tracker.getTrackerObjects('ouLevels', 'organisationUnitLevels', '../api/organisationUnitLevels.json', 'filter=level:gt:1&fields=id,name,level&paging=false', 'idb', dhis2.ec.store);
    }); 
}

function getMetaPrograms()
{    
    return dhis2.tracker.getTrackerObjects('programs', 'programs', '../api/programs.json', 'filter=programType:eq:WITHOUT_REGISTRATION&paging=false&fields=id,version,categoryCombo[id,isDefault,categories[id]],programStages[id,version,programStageSections[id],programStageDataElements[dataElement[id,optionSet[id,version]]]]', 'temp', dhis2.ec.store);    
}

function getPrograms( programs )
{
    if( !programs ){
        return;
    }
    
    var mainDef = $.Deferred();
    var mainPromise = mainDef.promise();

    var def = $.Deferred();
    var promise = def.promise();

    var builder = $.Deferred();
    var build = builder.promise();

    var ids = [];
    _.each( _.values( programs ), function ( program ) {
        
        if(program.programStages && program.programStages[0].programStageDataElements){
            build = build.then(function() {
                var d = $.Deferred();
                var p = d.promise();
                dhis2.ec.store.get('programs', program.id).done(function(obj) {
                    if(!obj || obj.version !== program.version) {
                        ids.push( program.id );
                    }

                    d.resolve();
                });

                return p;
            });
        }        
    });

    build.done(function() {
        promise = promise.done( function () {
            var _ids = null;
            if( ids && ids.length > 0 ){
                _ids = ids.toString();
                _ids = '[' + _ids + ']';
                promise = promise.then( getAllPrograms( _ids ) );
            }            
            mainDef.resolve( programs, ids );
        } );
        def.resolve();
        
    }).fail(function(){
        mainDef.resolve( null, null );
    });

    builder.resolve();

    return mainPromise;
}

function getAllPrograms( ids )
{    
    return function() {
        return $.ajax( {
            url: '../api/programs.json',
            type: 'GET',
            data: 'fields=id,displayName,programType,version,dataEntryMethod,enrollmentDateLabel,incidentDateLabel,displayIncidentDate,ignoreOverdueEvents,categoryCombo[id,displayName,isDefault,categories[id,displayName,categoryOptions[id,displayName]]],organisationUnits[id,displayName],programStages[id,displayName,version,description,excecutionDateLabel,captureCoordinates,dataEntryForm[id,displayName,style,htmlCode,format],minDaysFromStart,repeatable,preGenerateUID,programStageSections[id,displayName,programStageDataElements[dataElement[id]]],programStageDataElements[displayInReports,sortOrder,allowProvidedElsewhere,allowFutureDate,compulsory,dataElement[id,displayName,url,description,valueType,optionSetValue,formName,optionSet[id]]]],userRoles[id,displayName]&paging=false&filter=id:in:' + ids
        }).done( function( response ){
            
            if(response.programs){
                _.each(_.values( response.programs), function(program){
                    var ou = {};
                    _.each(_.values( program.organisationUnits), function(o){
                        ou[o.id] = o.displayName;
                    });
                    program.organisationUnits = ou;

                    var ur = {};
                    _.each(_.values( program.userRoles), function(u){
                        ur[u.id] = u.displayName;
                    });
                    program.userRoles = ur;

                    dhis2.ec.store.set( 'programs', program );
                });
            }
        });
    };
}

function getOptionSets( programs )
{    
    if( !programs ){
        return;
    }
    
    delete programs.programIds;
    
    var mainDef = $.Deferred();
    var mainPromise = mainDef.promise();

    var def = $.Deferred();
    var promise = def.promise();

    var builder = $.Deferred();
    var build = builder.promise();    

    _.each( _.values( programs ), function ( program ) {
        
        if(program.programStages && program.programStages[0].programStageDataElements){
            _.each(_.values( program.programStages[0].programStageDataElements), function(prStDe){
                if( prStDe.dataElement && prStDe.dataElement.optionSet && prStDe.dataElement.optionSet.id ){
                    build = build.then(function() {
                        var d = $.Deferred();
                        var p = d.promise();
                        dhis2.ec.store.get('optionSets', prStDe.dataElement.optionSet.id).done(function(obj) {
                            if( (!obj || obj.version !== prStDe.dataElement.optionSet.version) && optionSetsInPromise.indexOf(prStDe.dataElement.optionSet.id) === -1) {
                                optionSetsInPromise.push( prStDe.dataElement.optionSet.id );
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
                promise = promise.then( dhis2.tracker.getTrackerObjects( 'optionSets', 'optionSets', url, filter, 'idb', dhis2.ec.store ) );
            }
            
            mainDef.resolve( programs );
        } );
    }).fail(function(){
        mainDef.resolve( null );
    });

    builder.resolve();

    return mainPromise;    
}

function getMetaProgramValidations( programs, programIds )
{
    programs.programIds = programIds;
    return dhis2.tracker.getTrackerMetaObjects(programs, 'programValidations', '../api/programValidations.json', 'paging=false&fields=id&filter=program.id:in:');
}

function getProgramValidations( programValidations )
{  
    return dhis2.tracker.checkAndGetTrackerObjects( programValidations, 'programValidations', '../api/programValidations', 'fields=id,displayName,operator,rightSide[expression,description],leftSide[expression,description],program[id]', dhis2.ec.store);
}

function getMetaProgramIndicators( programs )
{   
    return dhis2.tracker.getTrackerMetaObjects(programs, 'programIndicators', '../api/programIndicators.json', 'paging=false&fields=id&filter=program.id:in:');
}

function getProgramIndicators( programIndicators )
{
    return dhis2.tracker.checkAndGetTrackerObjects( programIndicators, 'programIndicators', '../api/programIndicators', 'fields=id,displayName,code,shortName,displayInForm,expression,displayDescription,rootDate,description,valueType,filter,program[id]', dhis2.ec.store);
}

function getMetaProgramRules( programs )
{
    return dhis2.tracker.getTrackerMetaObjects(programs, 'programRules', '../api/programRules.json', 'paging=false&fields=id&filter=program.id:in:');
}

function getProgramRules( programRules )
{
    return dhis2.tracker.checkAndGetTrackerObjects( programRules, 'programRules', '../api/programRules', 'fields=id,displayName,condition,description,program[id],programStage[id],priority,programRuleActions[id,content,location,data,programRuleActionType,programStageSection[id],dataElement[id],trackedEntityAttribute[id],programIndicator[id],programStage[id]]', dhis2.ec.store);
}

function getMetaProgramRuleVariables( programs )
{    
    return dhis2.tracker.getTrackerMetaObjects(programs, 'programRuleVariables', '../api/programRuleVariables.json', 'paging=false&fields=id&filter=program.id:in:');
}

function getProgramRuleVariables( programRuleVariables )
{
    return dhis2.tracker.checkAndGetTrackerObjects( programRuleVariables, 'programRuleVariables', '../api/programRuleVariables', 'fields=id,displayName,programRuleVariableSourceType,program[id],programStage[id],dataElement[id]', dhis2.ec.store);
}

function uploadLocalData()
{
    var OfflineECStorageService = angular.element('body').injector().get('OfflineECStorageService');
    setHeaderWaitMessage(i18n_uploading_data_notification);
     
    OfflineECStorageService.uploadLocalData().then(function(){
        dhis2.ec.store.removeAll( 'events' );
        log( 'Successfully uploaded local events' );      
        setHeaderDelayMessage( i18n_sync_success );
        selection.responseReceived(); //notify angular
    });
}
