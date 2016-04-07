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
import org.hisp.dhis.common.BaseNameableObject;
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
@JacksonXmlRootElement( localName = "resultsFramework", namespace = DxfNamespaces.DXF_2_0 )
public class ResultsFramework
    extends BaseNameableObject
{

    private String description;
    
    private boolean active = false;

    @Scanned
    private Set<IndicatorGroup> impacts = new HashSet<>();

    @Scanned
    private Set<IndicatorGroup> outcomes = new HashSet<>();

    @Scanned
    private Set<IndicatorGroup> outputs = new HashSet<>();

    @Scanned
    private Set<Programm> programms = new HashSet<>();
    
    @Scanned
    private Set<DataSet> dataSets = new HashSet<>();

    // -------------------------------------------------------------------------
    // Constructors
    // -------------------------------------------------------------------------

    public ResultsFramework()
    {

    }

    public ResultsFramework( String name, String code, String description )
    {
        this.name = name;
        this.code = code;
        this.description = description;
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
     * @return the active
     */
    @JsonProperty
    @JacksonXmlProperty( namespace = DxfNamespaces.DXF_2_0 )
    public boolean isActive()
    {
        return active;
    }

    /**
     * @param active the active to set
     */
    public void setActive( boolean active )
    {
        this.active = active;
    }

    /**
     * @return the impacts
     */
    @JsonProperty( "impacts" )
    @JsonSerialize( contentAs = BaseIdentifiableObject.class )
    @JsonView( { DetailedView.class, ExportView.class } )
    @JacksonXmlElementWrapper( localName = "impacts", namespace = DxfNamespaces.DXF_2_0 )
    @JacksonXmlProperty( localName = "impacts", namespace = DxfNamespaces.DXF_2_0 )
    public Set<IndicatorGroup> getImpacts()
    {
        return impacts;
    }

    /**
     * @param impacts the impacts to set
     */
    public void setImpacts( Set<IndicatorGroup> impacts )
    {
        this.impacts = impacts;
    }

    /**
     * @return the outcomes
     */
    @JsonProperty( "outcomes" )
    @JsonSerialize( contentAs = BaseIdentifiableObject.class )
    @JsonView( { DetailedView.class, ExportView.class } )
    @JacksonXmlElementWrapper( localName = "outcomes", namespace = DxfNamespaces.DXF_2_0 )
    @JacksonXmlProperty( localName = "outcomes", namespace = DxfNamespaces.DXF_2_0 )
    public Set<IndicatorGroup> getOutcomes()
    {
        return outcomes;
    }

    /**
     * @param outcomes the outcomes to set
     */
    public void setOutcomes( Set<IndicatorGroup> outcomes )
    {
        this.outcomes = outcomes;
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
     * @return the programms
     */
    @JsonProperty( "programms" )
    @JsonSerialize( contentAs = BaseIdentifiableObject.class )
    @JsonView( { DetailedView.class, ExportView.class } )
    @JacksonXmlElementWrapper( localName = "programms", namespace = DxfNamespaces.DXF_2_0 )
    @JacksonXmlProperty( localName = "programms", namespace = DxfNamespaces.DXF_2_0 )
    public Set<Programm> getProgramms()
    {
        return programms;
    }

    /**
     * @param programms the programms to set
     */
    public void setProgramms( Set<Programm> programms )
    {
        this.programms = programms;
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

    @Override
    public void mergeWith( IdentifiableObject other, MergeMode mergeMode )
    {
        super.mergeWith( other, mergeMode );

        if ( other.getClass().isInstance( this ) )
        {
            ResultsFramework resultsFramework = (ResultsFramework) other;

            if ( mergeMode.isReplace() )
            {                
                description = resultsFramework.getDescription();
                active = resultsFramework.isActive();
                impacts = resultsFramework.getImpacts();
                outcomes = resultsFramework.getOutcomes();
                outputs = resultsFramework.getOutputs();
                programms = resultsFramework.getProgramms();
                dataSets = resultsFramework.getDataSets();
            }
            else if ( mergeMode.isMerge() )
            {
                description = resultsFramework.getDescription() == null ? description
                    : resultsFramework.getDescription();
                active = resultsFramework.isActive();
                impacts = resultsFramework.getImpacts() == null ? impacts : resultsFramework.getImpacts();
                outcomes = resultsFramework.getOutcomes() == null ? outcomes : resultsFramework.getOutcomes();
                outputs = resultsFramework.getOutputs() == null ? outputs : resultsFramework.getOutputs();
                programms = resultsFramework.getProgramms() == null ? programms : resultsFramework.getProgramms();
                dataSets = resultsFramework.getOutputs() == null ? dataSets : resultsFramework.getDataSets();
            }
        }
    }
}
