package org.hisp.dhis.dxf2.metadata2;

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

import com.google.common.base.Enums;
import org.hisp.dhis.common.MergeMode;
import org.hisp.dhis.dxf2.metadata2.feedback.ImportReport;
import org.hisp.dhis.dxf2.metadata2.objectbundle.ObjectBundle;
import org.hisp.dhis.dxf2.metadata2.objectbundle.ObjectBundleMode;
import org.hisp.dhis.dxf2.metadata2.objectbundle.ObjectBundleParams;
import org.hisp.dhis.dxf2.metadata2.objectbundle.ObjectBundleService;
import org.hisp.dhis.dxf2.metadata2.objectbundle.ObjectBundleValidation;
import org.hisp.dhis.feedback.TypeReport;
import org.hisp.dhis.importexport.ImportStrategy;
import org.hisp.dhis.preheat.PreheatIdentifier;
import org.hisp.dhis.preheat.PreheatMode;
import org.hisp.dhis.user.CurrentUserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

/**
 * @author Morten Olav Hansen <mortenoh@gmail.com>
 */
@Component
@Transactional
public class DefaultMetadataImportService implements MetadataImportService
{
    @Autowired
    private CurrentUserService currentUserService;

    @Autowired
    private ObjectBundleService objectBundleService;

    @Override
    public ImportReport importMetadata( MetadataImportParams params )
    {
        ImportReport report = new ImportReport();

        if ( params.getUser() == null )
        {
            params.setUser( currentUserService.getCurrentUser() );
        }

        ObjectBundleParams bundleParams = params.toObjectBundleParams();
        ObjectBundle bundle = objectBundleService.create( bundleParams );

        ObjectBundleValidation validation = objectBundleService.validate( bundle );
        report.addTypeReports( validation.getTypeReportMap() );

        if ( !(bundleParams.getImportMode().isAtomic() && !validation.getTypeReportMap().isEmpty()) )
        {
            Map<Class<?>, TypeReport> typeReports = objectBundleService.commit( bundle );
            report.addTypeReports( typeReports );
        }

        return report;
    }

    @Override
    public MetadataImportParams getParamsFromMap( Map<String, List<String>> parameters )
    {
        MetadataImportParams params = new MetadataImportParams();
        params.setObjectBundleMode( getEnumWithDefault( ObjectBundleMode.class, parameters, "objectBundleMode", ObjectBundleMode.COMMIT ) );
        params.setPreheatMode( getEnumWithDefault( PreheatMode.class, parameters, "preheatMode", PreheatMode.REFERENCE ) );
        params.setPreheatIdentifier( getEnumWithDefault( PreheatIdentifier.class, parameters, "preheatIdentifier", PreheatIdentifier.UID ) );
        params.setImportMode( getEnumWithDefault( ImportStrategy.class, parameters, "importMode", ImportStrategy.ATOMIC_CREATE_AND_UPDATE ) );
        params.setMergeMode( getEnumWithDefault( MergeMode.class, parameters, "mergeMode", MergeMode.MERGE ) );
        params.setFlushMode( getEnumWithDefault( FlushMode.class, parameters, "flushMode", FlushMode.AUTO ) );

        return params;
    }

    private <T extends Enum<T>> T getEnumWithDefault( Class<T> enumKlass, Map<String, List<String>> parameters, String key, T defaultValue )
    {
        if ( parameters == null || parameters.get( key ) == null || parameters.get( key ).isEmpty() )
        {
            return defaultValue;
        }

        String value = String.valueOf( parameters.get( key ).get( 0 ) );

        return Enums.getIfPresent( enumKlass, value ).or( defaultValue );
    }
}
