package org.hisp.dhis.useraccount.action;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.hisp.dhis.user.UserCredentials;
//import org.hisp.dhis.user.User;
import org.hisp.dhis.user.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.session.SessionInformation;
import org.springframework.security.core.session.SessionRegistry;
import org.springframework.security.core.userdetails.User;

import com.opensymphony.xwork2.Action;
/**
 * @author Mithilesh Kumar Thakur
 */
public class ActiveUsersListAction implements Action
{
    
    // -------------------------------------------------------------------------
    // Dependencies
    // -------------------------------------------------------------------------
    
    @Autowired
    private SessionRegistry sessionRegistry;
    
    @Autowired
    private UserService userService;
    
    // -------------------------------------------------------------------------
    // Input/ Output
    // -------------------------------------------------------------------------
    
    private String sessionId = null;
    
    public String getSessionId()
    {
        return sessionId;
    }
    
    public void setSessionId( String sessionId )
    {
        this.sessionId = sessionId;
    }

    private List<org.hisp.dhis.user.User> activeUsers = new ArrayList<org.hisp.dhis.user.User>();
    
    public List<org.hisp.dhis.user.User> getActiveUsers()
    {
        return activeUsers;
    }
    
    private Map<String, SessionInformation> sessionInformationMap;
    
    public Map<String, SessionInformation> getSessionInformationMap()
    {
        return sessionInformationMap;
    }

    // -------------------------------------------------------------------------
    // Action implementation
    // -------------------------------------------------------------------------

    public String execute() throws Exception
    {
        
        if( sessionId != null )
        {
            logoutSession( sessionId );
        }
        
        activeUsers = new ArrayList<org.hisp.dhis.user.User>();
        sessionInformationMap = new HashMap<String, SessionInformation>();
        List<SessionInformation> activeSessions = getActiveSessions();
        for ( SessionInformation sessionInformation : activeSessions )
        {
            User user = getUser( sessionInformation );
            if( user !=null )
            {
                UserCredentials credentials = userService.getUserCredentialsByUsername( user.getUsername() );
                
                org.hisp.dhis.user.User activeUser = userService.getUser( user.getUsername() );
                
                activeUsers.add( credentials.getUserInfo() );
                sessionInformationMap.put( credentials.getUserInfo().getUid(), sessionInformation );
            }
        }
        
        return SUCCESS;
    }

    // -------------------------------------------------------------------------
    // Supportive Methods
    // -------------------------------------------------------------------------
    public List<SessionInformation> getActiveSessions()
    {
        List<SessionInformation> activeSessions = new ArrayList<SessionInformation>();
        for ( Object principal : sessionRegistry.getAllPrincipals() )
        {
            activeSessions.addAll( sessionRegistry.getAllSessions( principal, false ) );
        }
        return activeSessions;
    }

    public User getUser( SessionInformation session )
    {
        Object principalObj = session.getPrincipal();
        if ( principalObj instanceof User )
        {
            User user = (User) principalObj;
            //System.out.println( " Active User Name -- " + user.getUsername() );
            return user;
        }
        return null;
    }

    public void logoutSession(String sessionId) 
    {
        SessionInformation session = sessionRegistry.getSessionInformation(sessionId);
        if (session != null) 
        {
            session.expireNow();
        }
    }
    
}
