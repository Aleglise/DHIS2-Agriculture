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

import java.util.List;

import org.springframework.transaction.annotation.Transactional;

/**
 * @author Abyot Asalefew Gizaw <abyota@gmail.com>
 *
 */
@Transactional
public class DefaultProjectService
    implements ProjectService
{

    // -------------------------------------------------------------------------
    // Dependencies
    // -------------------------------------------------------------------------
    
    private ProjectStore projectStore;

    public void setProjectStore( ProjectStore projectStore )
    {
        this.projectStore = projectStore;
    }

    // -------------------------------------------------------------------------
    // Project
    // -------------------------------------------------------------------------

    @Override
    public int saveProject( Project project )
    {
        return projectStore.save( project );
    }

    @Override
    public Project getProject( int id )
    {
        return projectStore.get( id );
    }

    @Override
    public Project getProject( String uid )
    {
        return projectStore.getByUid( uid );
    }

    @Override
    public void updateProject( Project Project )
    {
        projectStore.update( Project );
    }

    @Override
    public void deleteProject( Project Project )
    {
        projectStore.delete( Project );
    }

    @Override
    public List<Project> getAllProjects()
    {
        return projectStore.getAll();
    }
}
