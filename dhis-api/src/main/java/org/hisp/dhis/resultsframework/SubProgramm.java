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
package org.hisp.dhis.resultsframework;

import java.util.HashSet;
import java.util.Set;

import org.hisp.dhis.common.BaseIdentifiableObject;
import org.hisp.dhis.common.DxfNamespaces;
import org.hisp.dhis.common.IdentifiableObject;
import org.hisp.dhis.common.MergeMode;
import org.hisp.dhis.common.annotation.Scanned;
import org.hisp.dhis.common.view.DetailedView;
import org.hisp.dhis.common.view.ExportView;
import org.hisp.dhis.dataset.DataSet;
import org.hisp.dhis.indicator.IndicatorGroup;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonView;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlElementWrapper;
import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlProperty;
import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlRootElement;

/**
 * @author Abyot Asalefew Gizaw <abyota@gmail.com>
 *
 */
@JacksonXmlRootElement( localName = "subProgramm", namespace = DxfNamespaces.DXF_2_0 )
public class SubProgramm
    extends BaseIdentifiableObject
{

    private String description;

    @Scanned
    private Set<IndicatorGroup> outputs = new HashSet<>();
    
    @Scanned
    private Set<DataSet> dataSets = new HashSet<>();

    private Programm programm;
    
    private Integer sortOrder;

    // -------------------------------------------------------------------------
    // Constructors
    // -------------------------------------------------------------------------

    public SubProgramm()
    {

    }

    public SubProgramm( String name, Programm programm )
    {
        this.name = name;
        this.programm = programm;
    }

    // -------------------------------------------------------------------------
    // Getters and setters
    // -------------------------------------------------------------------------

    /**
     * @return the description
     */
    @JsonProperty
    @JacksonXmlProperty( namespace = DxfNamespaces.DXF_2_0 )
    public String getDescription()
    {
        return description;
    }

    /**
     * @param description the description to set
     */
    public void setDescription( String description )
    {
        this.description = description;
    }

    /**
     * @return the outputs
     */
    @JsonProperty( "outputs" )
    @JsonSerialize( contentAs = BaseIdentifiableObject.class )
    @JsonView( { DetailedView.class, ExportView.class } )
    @JacksonXmlElementWrapper( localName = "outputs", namespace = DxfNamespaces.DXF_2_0 )
    @JacksonXmlProperty( localName = "outputs", namespace = DxfNamespaces.DXF_2_0 )
    public Set<IndicatorGroup> getOutputs()
    {
        return outputs;
    }

    /**
     * @param outputs the outputs to set
     */
    public void setOutputs( Set<IndicatorGroup> outputs )
    {
        this.outputs = outputs;
    }

    
    /**
     * @return the dataSets
     */
    @JsonProperty( "dataSets" )
    @JsonSerialize( contentAs = BaseIdentifiableObject.class )
    @JsonView( { DetailedView.class, ExportView.class } )
    @JacksonXmlElementWrapper( localName = "dataSets", namespace = DxfNamespaces.DXF_2_0 )
    @JacksonXmlProperty( localName = "dataSets", namespace = DxfNamespaces.DXF_2_0 )
    public Set<DataSet> getDataSets()
    {
        return dataSets;
    }

    /**
     * @param dataSets the dataSets to set
     */
    public void setDataSets( Set<DataSet> dataSets )
    {
        this.dataSets = dataSets;
    }

    /**
     * @return the programm
     */
    @JsonProperty
    @JsonSerialize( as = BaseIdentifiableObject.class )
    @JacksonXmlProperty( namespace = DxfNamespaces.DXF_2_0 )
    public Programm getProgramm()
    {
        return programm;
    }

    /**
     * @param programm the programm to set
     */
    public void setProgramm( Programm programm )
    {
        this.programm = programm;
    }
    
    @JsonProperty
    @JsonView( { DetailedView.class, ExportView.class } )
    @JacksonXmlProperty( namespace = DxfNamespaces.DXF_2_0 )
    public Integer getSortOrder()
    {
        return sortOrder;
    }

    public void setSortOrder( Integer sortOrder )
    {
        this.sortOrder = sortOrder;
    }

    @Override
    public void mergeWith( IdentifiableObject other, MergeMode mergeMode )
    {
        super.mergeWith( other, mergeMode );

        if ( other.getClass().isInstance( this ) )
        {
            SubProgramm subProgramm = (SubProgramm) other;

            if ( mergeMode.isReplace() )
            {
                description = subProgramm.getDescription();
                outputs = subProgramm.getOutputs();
                dataSets = subProgramm.getDataSets();
                programm = subProgramm.getProgramm();
            }
            else if ( mergeMode.isMerge() )
            {
                description = subProgramm.getDescription() == null ? description : subProgramm.getDescription();
                outputs = subProgramm.getOutputs() == null ? outputs : subProgramm.getOutputs();
                dataSets = subProgramm.getOutputs() == null ? dataSets : subProgramm.getDataSets();
                programm = subProgramm.getProgramm() == null ? programm : subProgramm.getProgramm();
            }
        }
    }
}
