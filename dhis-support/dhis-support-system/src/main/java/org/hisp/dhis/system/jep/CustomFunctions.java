package org.hisp.dhis.system.jep;

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

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.regex.Pattern;

import org.hisp.dhis.system.jep.ArithmeticMean;
import org.nfunk.jep.JEP;
import org.nfunk.jep.ParseException;
import org.nfunk.jep.function.PostfixMathCommandI;

/**
 * @author Kenneth Haase
 */
public class CustomFunctions
{
    private static Boolean init_done = false;

    public static Map<String, PostfixMathCommandI> aggregate_functions = new HashMap<String, PostfixMathCommandI>();

    public static void addFunctions( JEP parser )
    {
        if ( !(init_done) )
        {
            initCustomFunctions();
        }
        
        for ( Entry<String, PostfixMathCommandI> e : aggregate_functions.entrySet() )
        {
            String fname = e.getKey();
            PostfixMathCommandI cmd = e.getValue();
            parser.addFunction( fname, cmd );
        }
    }

    private static Pattern aggregate_prefix = Pattern.compile( "" );

    private static int n_aggregates = 0;

    public static Pattern getAggregatePrefixPattern()
    {
        if ( !(init_done) )
        {
            initCustomFunctions();
        }
        
        if ( n_aggregates == aggregate_functions.size() )
        {
            return aggregate_prefix;
        }
        else
        {
            StringBuffer s = new StringBuffer();
            int i = 0;
            s.append( "(" );
            
            for ( String key : aggregate_functions.keySet() )
            {
                if ( i > 0 )
                    s.append( '|' );
                else
                    i++;
                s.append( key );
            }
            
            s.append( ")\\s*\\(" );
            aggregate_prefix = Pattern.compile( s.toString() );
            n_aggregates = aggregate_functions.size();
            return aggregate_prefix;
        }
    }

    public static void addAggregateFunction( String name, PostfixMathCommandI fn )
    {
        aggregate_functions.put( name, fn );
    }

    @SuppressWarnings( "unchecked" )
    public static List<Double> checkVector( Object param )
        throws ParseException
    {
        if ( param instanceof List )
        {
            List<?> vals = (List<?>) param;
            
            for ( Object val : vals )
            {
                if ( !(val instanceof Double) )
                {
                    throw new ParseException( "Non numeric vector" );
                }
            }
            
            return (List<Double>) param;
        }
        else
        {
            throw new ParseException( "Invalid vector argument" );
        }
    }

    private synchronized static void initCustomFunctions()
    {
        if ( init_done )
        {
            return;
        }
        else
        {
            init_done = true;
        }
        
        CustomFunctions.addAggregateFunction( "AVG", new ArithmeticMean() );
        CustomFunctions.addAggregateFunction( "STDDEV", new StandardDeviation() );
        CustomFunctions.addAggregateFunction( "MEDIAN", new MedianValue() );
        CustomFunctions.addAggregateFunction( "MAX", new MaxValue() );
        CustomFunctions.addAggregateFunction( "MIN", new MinValue() );
        CustomFunctions.addAggregateFunction( "COUNT", new Count() );
        CustomFunctions.addAggregateFunction( "VSUM", new VectorSum() );
    }
}
