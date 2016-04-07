package org.hisp.dhis.sms.outbound;

/*
 * Copyright (c) 2004-2016, University of Oslo
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 * Redistributions of source code must retain the above copyright notice, this
 * list of conditions and the following disclaimer.
 *
 * Redistributions in binary form must reproduce the above copyright notice,
 * this list of conditions and the following disclaimer in the documentation
 * and/or other materials provided with the distribution.
 * Neither the name of the HISP project nor the names of its contributors may
 * be used to endorse or promote products derived from this software without
 * specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
 * ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */ 


import java.util.List;
import java.util.Set;

import org.apache.commons.lang.StringUtils;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;

import org.hisp.dhis.sms.config.BulkSmsGatewayConfig;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

/**
 * Zubair <rajazubair.asghar@gmail.com>
 */

public class BulkSmsGateway
{
    private static final Log log = LogFactory.getLog( BulkSmsGateway.class );

    // -------------------------------------------------------------------------
    // Dependencies
    // -------------------------------------------------------------------------

    @Autowired
    private RestTemplate restTemplate;

    public GatewayResponse send( OutboundSms sms, BulkSmsGatewayConfig bulkSmsConfiguration )
    {
        UriComponentsBuilder uriBuilder = buildBaseUrl( bulkSmsConfiguration, SubmissionType.SINGLE );
        uriBuilder.queryParam( "msisdn", getRecipients( sms.getRecipients() ) );
        uriBuilder.queryParam( "message", sms.getMessage() );

        return send( uriBuilder );
    }

    public GatewayResponse send( List<OutboundSms> smsBatch, BulkSmsGatewayConfig bulkSmsConfiguration )
    {
        UriComponentsBuilder uriBuilder = buildBaseUrl( bulkSmsConfiguration, SubmissionType.BATCH );
        uriBuilder.queryParam( "batch_data", builCsvUrl( smsBatch ) );

        return send( uriBuilder );
    }

    private GatewayResponse send( UriComponentsBuilder uriBuilder )
    {
        ResponseEntity<String> responseEntity = null;
        
        HttpStatus statusCode = null;

        try
        {
            responseEntity = restTemplate.exchange( uriBuilder.build().encode( "ISO-8859-1" ).toUri(), HttpMethod.POST,
                null, String.class );
        }
        catch ( HttpClientErrorException ex )
        {
            log.error( "Error: " + ex.getMessage() );

            statusCode = ex.getStatusCode();
        }
        catch ( HttpServerErrorException ex )
        {
            log.error( "Error: " + ex.getMessage() );

            statusCode = ex.getStatusCode();
        }
        catch ( Exception ex )
        {
            log.error( "Error: " + ex.getMessage() );
        }

        log.info( "Response status code: " + statusCode );
        
        return parseGatewayResponse( responseEntity.getBody() );
    }

    private String builCsvUrl( List<OutboundSms> smsBatch )
    {
        String csvData = "msisdn,message,";

        for ( OutboundSms sms : smsBatch )
        {
            csvData += getRecipients( sms.getRecipients() );
            csvData += "," + sms.getMessage();
        }
        return csvData;
    }

    private UriComponentsBuilder buildBaseUrl( BulkSmsGatewayConfig bulkSmsConfiguration, SubmissionType type )
    {
        UriComponentsBuilder uriBuilder = null;

        if ( type.equals( SubmissionType.SINGLE ) )
        {
            uriBuilder = UriComponentsBuilder.fromHttpUrl( bulkSmsConfiguration.getUrlTemplate() );
        }
        else if ( type.equals( SubmissionType.BATCH ) )
        {
            uriBuilder = UriComponentsBuilder
                .fromHttpUrl( bulkSmsConfiguration.getUrlTemplateForBatchSms() );
        }

        uriBuilder.queryParam( "username", bulkSmsConfiguration.getUsername() ).queryParam( "password",
            bulkSmsConfiguration.getPassword() );

        return uriBuilder;
    }

    private GatewayResponse parseGatewayResponse( String response )
    {
        String[] responseCode = StringUtils.split( response, "|" );

        switch ( responseCode[0] )
        {
        case "0":
            return GatewayResponse.RESULT_CODE_0;
        case "1":
            return GatewayResponse.RESULT_CODE_1;
        case "22":
            return GatewayResponse.RESULT_CODE_22;
        case "23":
            return GatewayResponse.RESULT_CODE_23;
        case "24":
            return GatewayResponse.RESULT_CODE_24;
        case "25":
            return GatewayResponse.RESULT_CODE_25;
        case "26":
            return GatewayResponse.RESULT_CODE_26;
        case "27":
            return GatewayResponse.RESULT_CODE_27;
        case "40":
            return GatewayResponse.RESULT_CODE_40;
        default:
            return GatewayResponse.RESULT_CODE_22;
        }
    }

    private String getRecipients( Set<String> recipients )
    {
        return StringUtils.join( recipients, "," );
    }
}
