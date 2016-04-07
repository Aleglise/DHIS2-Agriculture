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


import java.util.ArrayList;
import java.util.List;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.hisp.dhis.sms.config.ClickatellGatewayConfig;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestTemplate;

/**
 * Zubair <rajazubair.asghar@gmail.com>
 */

public class ClickatellGateway
{

    private static final Log log = LogFactory.getLog( ClickatellGateway.class );

    private static final String CONTENT_TYPE = "Content-Type";

    private static final String ACCEPT = "Accept";

    private static final String AUTHORIZATION = "Authorization";

    private static final String PROTOCOL_VERSION = "X-Version";

    // -------------------------------------------------------------------------
    // Dependencies
    // -------------------------------------------------------------------------

    @Autowired
    private RestTemplate restTemplate;

    public GatewayResponse send( OutboundSms sms, ClickatellGatewayConfig clickatellConfiguration )
    {
        HttpEntity<ClickatellRequestEntity> request = new HttpEntity<ClickatellRequestEntity>( getRequestBody( sms ),
            getRequestHeaderParameters( clickatellConfiguration ) );

        ResponseEntity<ClickatellResponseEntity> response = null;
        HttpStatus statusCode = null;

        try
        {
            response = restTemplate.exchange( clickatellConfiguration.getUrlTemplate(), HttpMethod.POST, request,
                ClickatellResponseEntity.class );

            statusCode = response.getStatusCode();
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

        return parseResponse( statusCode );
    }

    public GatewayResponse send( List<OutboundSms> smsBatch, ClickatellGatewayConfig clickatellConfiguration )
    {
        return null;
    }

    // -------------------------------------------------------------------------
    // Supportive methods
    // -------------------------------------------------------------------------

    private GatewayResponse parseResponse( HttpStatus status )
    {
        if ( HttpStatus.OK == status )
        {
            return GatewayResponse.RESULT_CODE_200;
        }
        else if ( HttpStatus.ACCEPTED == status )
        {
            return GatewayResponse.RESULT_CODE_202;
        }
        else if ( HttpStatus.MULTI_STATUS == status )
        {
            return GatewayResponse.RESULT_CODE_207;
        }
        else if ( HttpStatus.BAD_REQUEST == status )
        {
            return GatewayResponse.RESULT_CODE_400;
        }
        else if ( HttpStatus.UNAUTHORIZED == status )
        {
            return GatewayResponse.RESULT_CODE_401;
        }
        else if ( HttpStatus.PAYMENT_REQUIRED == status )
        {
            return GatewayResponse.RESULT_CODE_402;
        }
        else if ( HttpStatus.NOT_FOUND == status )
        {
            return GatewayResponse.RESULT_CODE_404;
        }
        else if ( HttpStatus.METHOD_NOT_ALLOWED == status )
        {
            return GatewayResponse.RESULT_CODE_405;
        }
        else
        {
            return GatewayResponse.RESULT_CODE_503;
        }
    }

    private ClickatellRequestEntity getRequestBody( OutboundSms sms )
    {
        List<String> listOfRecipients = new ArrayList<>();
        listOfRecipients.addAll( sms.getRecipients() );

        ClickatellRequestEntity requestBody = new ClickatellRequestEntity();
        requestBody.setText( sms.getMessage() );
        requestBody.setTo( listOfRecipients );

        return requestBody;
    }

    private HttpHeaders getRequestHeaderParameters( ClickatellGatewayConfig clickatellConfiguration )
    {
        HttpHeaders headers = new HttpHeaders();
        headers.set( CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE );
        headers.set( ACCEPT, MediaType.APPLICATION_JSON_VALUE );
        headers.set( PROTOCOL_VERSION, "1" );
        headers.set( AUTHORIZATION, clickatellConfiguration.getAuthToken() );

        return headers;
    }
}
