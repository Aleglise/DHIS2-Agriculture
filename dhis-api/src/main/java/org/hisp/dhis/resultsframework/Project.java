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

import java.util.Date;
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
@JacksonXmlRootElement( localName = "project", namespace = DxfNamespaces.DXF_2_0 )
public class Project
    extends BaseNameableObject
{
    private String description;    
    
    private String contactName;
    
    private String contactPhone;
    
    private String contactEmail;
    
    private Integer totalCost;
    
    private Integer costByGovernment;
    
    private Integer costByLeadDonor;
    
    private Integer costByOthers;
    
    private String leadDonor;
    
    private Date startDate;
    
    private Date endDate;
    
    private Boolean extensionPossible;
    
    private ProjectStatus status;
    
    private DataSet budgetExecutionDataSet;
    
    private DataSet budgetForecastDataSet;

    @Scanned
    private Set<SubProgramm> subProgramms = new HashSet<>();

    
    // -------------------------------------------------------------------------
    // Constructors
    // -------------------------------------------------------------------------    
    
    public Project()
    {

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
     * @return the contactName
     */
    @JsonProperty
    @JacksonXmlProperty( namespace = DxfNamespaces.DXF_2_0 )
    public String getContactName()
    {
        return contactName;
    }

    /**
     * @param contactName the contactName to set
     */
    public void setContactName( String contactName )
    {
        this.contactName = contactName;
    }

    /**
     * @return the contactPhone
     */
    @JsonProperty
    @JacksonXmlProperty( namespace = DxfNamespaces.DXF_2_0 )
    public String getContactPhone()
    {
        return contactPhone;
    }

    /**
     * @param contactPhone the contactPhone to set
     */
    public void setContactPhone( String contactPhone )
    {
        this.contactPhone = contactPhone;
    }

    /**
     * @return the contactEmail
     */
    @JsonProperty
    @JacksonXmlProperty( namespace = DxfNamespaces.DXF_2_0 )
    public String getContactEmail()
    {
        return contactEmail;
    }

    /**
     * @param contactEmail the contactEmail to set
     */
    public void setContactEmail( String contactEmail )
    {
        this.contactEmail = contactEmail;
    }

    /**
     * @return the totalCost
     */
    @JsonProperty
    @JacksonXmlProperty( namespace = DxfNamespaces.DXF_2_0 )
    public Integer getTotalCost()
    {
        return totalCost;
    }

    /**
     * @param totalCost the totalCost to set
     */
    public void setTotalCost( Integer totalCost )
    {
        this.totalCost = totalCost;
    }

    /**
     * @return the costByGovernment
     */
    @JsonProperty
    @JacksonXmlProperty( namespace = DxfNamespaces.DXF_2_0 )
    public Integer getCostByGovernment()
    {
        return costByGovernment;
    }

    /**
     * @param costByGovernment the costByGovernment to set
     */
    public void setCostByGovernment( Integer costByGovernment )
    {
        this.costByGovernment = costByGovernment;
    }

    /**
     * @return the costByLeadDonor
     */
    @JsonProperty
    @JacksonXmlProperty( namespace = DxfNamespaces.DXF_2_0 )
    public Integer getCostByLeadDonor()
    {
        return costByLeadDonor;
    }

    /**
     * @param costByLeadDonor the costByLeadDonor to set
     */
    public void setCostByLeadDonor( Integer costByLeadDonor )
    {
        this.costByLeadDonor = costByLeadDonor;
    }

    /**
     * @return the costByOthers
     */
    @JsonProperty
    @JacksonXmlProperty( namespace = DxfNamespaces.DXF_2_0 )
    public Integer getCostByOthers()
    {
        return costByOthers;
    }

    /**
     * @param costByOthers the costByOthers to set
     */
    public void setCostByOthers( Integer costByOthers )
    {
        this.costByOthers = costByOthers;
    }

    /**
     * @return the leadDonor
     */
    @JsonProperty
    @JacksonXmlProperty( namespace = DxfNamespaces.DXF_2_0 )
    public String getLeadDonor()
    {
        return leadDonor;
    }

    /**
     * @param leadDonor the leadDonor to set
     */
    public void setLeadDonor( String leadDonor )
    {
        this.leadDonor = leadDonor;
    }

    /**
     * @return the startDate
     */
    @JsonProperty
    @JacksonXmlProperty( namespace = DxfNamespaces.DXF_2_0 )
    public Date getStartDate()
    {
        return startDate;
    }

    /**
     * @param startDate the startDate to set
     */
    public void setStartDate( Date startDate )
    {
        this.startDate = startDate;
    }

    /**
     * @return the endDate
     */
    @JsonProperty
    @JacksonXmlProperty( namespace = DxfNamespaces.DXF_2_0 )
    public Date getEndDate()
    {
        return endDate;
    }

    /**
     * @param endDate the endDate to set
     */
    public void setEndDate( Date endDate )
    {
        this.endDate = endDate;
    }

    /**
     * @return the extensionPossible
     */
    @JsonProperty
    @JacksonXmlProperty( namespace = DxfNamespaces.DXF_2_0 )
    public Boolean getExtensionPossible()
    {
        return extensionPossible;
    }

    /**
     * @param extensionPossible the extensionPossible to set
     */
    public void setExtensionPossible( Boolean extensionPossible )
    {
        this.extensionPossible = extensionPossible;
    }

    /**
     * @return the status
     */
    @JsonProperty
    @JacksonXmlProperty( namespace = DxfNamespaces.DXF_2_0 )
    public ProjectStatus getStatus()
    {
        return status;
    }

    /**
     * @param status the status to set
     */
    public void setStatus( ProjectStatus status )
    {
        this.status = status;
    }

    /**
     * @return the subProgramms
     */
    @JsonProperty( "subProgramms" )
    @JsonSerialize( contentAs = BaseIdentifiableObject.class )
    @JsonView( { DetailedView.class, ExportView.class } )
    @JacksonXmlElementWrapper( localName = "subProgramms", namespace = DxfNamespaces.DXF_2_0 )
    @JacksonXmlProperty( localName = "subProgramms", namespace = DxfNamespaces.DXF_2_0 )
    public Set<SubProgramm> getSubProgramms()
    {
        return subProgramms;
    }

    /**
     * @param subProgramms the subProgramms to set
     */
    public void setSubProgramms( Set<SubProgramm> subProgramms )
    {
        this.subProgramms = subProgramms;
    }
    
    /**
     * @return the budgetExecutionDataSet
     */
    @JsonProperty
    @JsonSerialize( as = BaseIdentifiableObject.class )
    @JacksonXmlProperty( namespace = DxfNamespaces.DXF_2_0 )
    public DataSet getBudgetExecutionDataSet()
    {
        return budgetExecutionDataSet;
    }

    /**
     * @param budgetExecutionDataSet the budgetExecutionDataSet to set
     */
    public void setBudgetExecutionDataSet( DataSet budgetExecutionDataSet )
    {
        this.budgetExecutionDataSet = budgetExecutionDataSet;
    }
    
    /**
     * @return the budgetForecastDataSet
     */
    @JsonProperty
    @JsonSerialize( as = BaseIdentifiableObject.class )
    @JacksonXmlProperty( namespace = DxfNamespaces.DXF_2_0 )
    public DataSet getBudgetForecastDataSet()
    {
        return budgetForecastDataSet;
    }

    /**
     * @param budgetForecastDataSet the budgetForecastDataSet to set
     */
    public void setBudgetForecastDataSet( DataSet budgetForecastDataSet )
    {
        this.budgetForecastDataSet = budgetForecastDataSet;
    }

    @Override
    public void mergeWith( IdentifiableObject other, MergeMode mergeMode )
    {
        super.mergeWith( other, mergeMode );

        if ( other.getClass().isInstance( this ) )
        {
            Project project = (Project) other;

            if ( mergeMode.isReplace() )
            {
                description = project.getDescription();
                contactName = project.getContactName();
                contactPhone = project.getContactPhone();
                contactEmail = project.getContactEmail();
                totalCost = project.getTotalCost();
                costByGovernment = project.getCostByGovernment();
                costByLeadDonor = project.getCostByLeadDonor();
                costByOthers = project.getCostByOthers();
                leadDonor = project.getLeadDonor();
                startDate = project.getStartDate();
                endDate = project.getEndDate();
                extensionPossible = project.getExtensionPossible();
                status = project.getStatus();
                subProgramms = project.getSubProgramms();
                budgetExecutionDataSet = project.getBudgetExecutionDataSet();
                budgetForecastDataSet = project.getBudgetForecastDataSet();
            }
            else if ( mergeMode.isMerge() )
            {
                description = project.getDescription() == null ? description : project.getDescription();
                contactName = project.getContactName() == null ? contactName : project.getContactName();
                contactPhone = project.getContactPhone() == null ? contactPhone : project.getContactPhone();
                contactName = project.getContactName() == null ? contactName : project.getContactName();
                contactEmail = project.getContactEmail() == null ? contactEmail : project.getContactEmail();
                totalCost = project.getTotalCost() == null ? totalCost : project.getTotalCost();
                costByGovernment = project.getCostByGovernment() == null ? costByGovernment : project.getCostByGovernment();
                costByLeadDonor = project.getCostByLeadDonor() == null ? costByLeadDonor : project.getCostByLeadDonor();
                costByOthers = project.getCostByOthers() == null ? costByOthers : project.getCostByOthers();
                leadDonor = project.getLeadDonor() == null ? leadDonor : project.getLeadDonor();
                startDate = project.getStartDate() == null ? startDate : project.getStartDate();
                endDate = project.getEndDate() == null ? endDate : project.getEndDate();
                extensionPossible = project.getExtensionPossible() == null ? extensionPossible : project.getExtensionPossible();
                status = project.getStatus() == null ? status : project.getStatus();
                subProgramms = project.getSubProgramms() == null ? subProgramms : project.getSubProgramms();
                budgetExecutionDataSet = project.getBudgetExecutionDataSet() == null ? budgetExecutionDataSet : project.getBudgetExecutionDataSet();
                budgetForecastDataSet = project.getBudgetForecastDataSet() == null ? budgetForecastDataSet : project.getBudgetForecastDataSet();
            }
        }
    }
}
