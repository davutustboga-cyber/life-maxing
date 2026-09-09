// types.ts — gedeelde types, gespiegeld aan datamodel.md en de content/*.yaml bestanden.

                                                                 
                                                
                                                          
                                                            
                                                                                                        
                                            

                        
             
                
                           
                        
                     
                          
                                                                               
                        
 

                         
                                
                   
                   
 

                           
             
                
               
                 
                      
                 
                        
                 
     
                                                                          
                                                                             
                                                                      
    
                                                                    
                                                                        
                                                                        
                                                                           
                                                                   
     
                                                        
                                                                             
                    
                                                                      
                        
                                                                 
                              
     
                                                                          
                                                                      
                                                                           
                                                                    
                                                                          
                            
     
                           
 

                         
             
                          
                                 
                                                                
                        
             
                                                                  
                           
                                 
 

                       
             
                   
                 
                
                     
 

                               
             
                 
               
                    
                       
 

                             
             
                                                                     
                       
                                                                                   
                    
                   
 

/**
 * Het Weekmoment — De Spiegel (v2.0 §9.1 punt 8, v2.2 §11: "Spiegel: één keer
 * per week, vier zinnen, uitschakelbaar"). De beeldoefening (mentale
 * contrastering / WOOP, Pijler 5): beeld, werkelijkheid, plan — nooit alleen
 * het eerste deel. Bevroren zodra geschreven, net als een Maandbrief.
 */
                             
             
                                                                        
                       
                
                        
               
                                                                               
                            
 

                                
                     
                                 
                                                  
 

/**
 * De perfectionisme-check (S17, v2.2 Wet 7 laatste punt). Hooguit één per
 * kalendermaand, nooit een trend of geschiedenis getoond — dit veld bestaat
 * alleen om "al deze maand gedaan" te kunnen bepalen.
 */
                                      
                                                                     
                                            
 

                                 
                 
                              
                 
                              
                            
                                      
                                                                     
                           
       
                                                                   
                                                                           
                                                                        
       
                                                                         
       
                                                                            
                                                                           
                                                                        
                                           
       
                                  
    
                              
                     
                  
                                 
                                   
     
                                                                              
                                                                               
                                                                             
                                                                             
                                   
     
                                        
     
                                                                           
                                                                       
     
                        
                                                                                
                             
                                                                          
                                              
     
                                                                         
                                                                         
                                                           
     
                                     
     
                                                                            
                                                                            
                                                                            
                           
     
                           
     
                                                                         
                                                                          
                                                  
     
                                                                       
                                                                            
                                   
                                                                            
                               
     
                                                                        
                                                                        
                                                                   
     
                    
                                                    
                      
 

                       
               
                  
                        
                  
                  
                
 

                                                             

/**
 * De Visie (v22, bij onboarding): een zelfgeschreven "toekomst in het nu" —
 * drie delen, tegenwoordige tijd. Net als wieIkWord/doel altijd overschrijf-
 * baar, geen geschiedenis (Wet 4). Bewust geen "manifestatie-belofte" op
 * zich: puur een identiteitsbeeld, zoals wieIkWord dat ook al mag zijn
 * zonder obstakel — de brug naar een concreet doel (met obstakel + plan,
 * v21 se Doel) staat los, als vrijblijvende link na het schrijven.
 */
                        
                        
                   
                   
                    
                       
                            
 

                                
             
                
                          
                          
 

                              
             
                
                                                    
                  
                              
                     
     
                                                                          
                                                                         
                                                                          
                                                                           
     
                            
 

export function leegBestand()                 {
  return {
    versie: "1.0",
    aangemaaktOp: null,
    instellingen: {
      islamitischeLaag: true,
      rustigeBeelden: false,
      ethischeOndergrensGezien: false,
      weekmomentAan: true,
      visieCheckIns: { ochtend: true, middag: true, avond: true },
      visieIntroAangeboden: false,
    },
    woordenUitbreiding: [],
    momenten: [],
    sterren: [],
    sterrenbeelden: [],
    onderdrukkingen: [],
    sterrenbeeldAanbodAfgewezen: [],
    brieven: [],
    weekmomenten: [],
    perfectionismeChecks: [],
    frictieAangebodenMaanden: [],
    wieIkWord: null,
    verlangenVanDePeriode: null,
    ochtendMomenten: [],
    dagsluitingen: [],
    doel: null,
    visie: null,
  };
}


//# sourceURL=src/lib/types.ts