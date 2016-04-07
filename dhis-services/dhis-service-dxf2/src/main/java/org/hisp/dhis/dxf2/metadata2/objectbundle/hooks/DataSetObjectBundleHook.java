package org.hisp.dhis.dxf2.metadata2.objectbundle.hooks;

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

import org.hibernate.Session;
import org.hisp.dhis.common.IdentifiableObject;
import org.hisp.dhis.dataelement.DataElementOperand;
import org.hisp.dhis.dataset.DataSet;
import org.hisp.dhis.dataset.Section;
import org.hisp.dhis.dxf2.metadata2.objectbundle.ObjectBundle;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Set;

/**
 * @author Morten Olav Hansen <mortenoh@gmail.com>
 */
@Component
public class DataSetObjectBundleHook extends AbstractObjectBundleHook
{
    @Override
    public void preCreate( IdentifiableObject identifiableObject, ObjectBundle objectBundle )
    {
        if ( !DataSet.class.isInstance( identifiableObject ) ) return;
        DataSet dataSet = (DataSet) identifiableObject;

        Session session = sessionFactory.getCurrentSession();

        for ( DataElementOperand dataElementOperand : dataSet.getCompulsoryDataElementOperands() )
        {
            preheatService.connectReferences( dataElementOperand, objectBundle.getPreheat(), objectBundle.getPreheatIdentifier() );
            session.save( dataElementOperand );
        }
    }

    @Override
    public void preUpdate( IdentifiableObject identifiableObject, ObjectBundle objectBundle )
    {
        if ( !DataSet.class.isInstance( identifiableObject ) ) return;
        DataSet dataSet = (DataSet) identifiableObject;
        dataSet.getCompulsoryDataElementOperands().clear();
    }

    @Override
    @SuppressWarnings( "unchecked" )
    public void postUpdate( IdentifiableObject identifiableObject, ObjectBundle objectBundle )
    {
        if ( !DataSet.class.isInstance( identifiableObject ) ) return;
        if ( !objectBundle.getObjectReferences().containsKey( Section.class ) ) return;
        DataSet dataSet = (DataSet) identifiableObject;

        Map<String, Object> references = objectBundle.getObjectReferences( Section.class ).get( dataSet.getUid() );
        if ( references == null ) return;

        Set<DataElementOperand> dataElementOperands = (Set<DataElementOperand>) references.get( "compulsoryDataElementOperands" );
        if ( dataElementOperands == null || dataElementOperands.isEmpty() ) return;

        for ( DataElementOperand dataElementOperand : dataElementOperands )
        {
            preheatService.connectReferences( dataElementOperand, objectBundle.getPreheat(), objectBundle.getPreheatIdentifier() );
            sessionFactory.getCurrentSession().save( dataElementOperand );
            dataSet.getCompulsoryDataElementOperands().add( dataElementOperand );
        }

        sessionFactory.getCurrentSession().update( dataSet );
    }
}
