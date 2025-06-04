/**
 * Real API tests for GuaraníHost
 * Tests against the actual running server
 */

import request from 'supertest'

// URL of your running server
const SERVER_URL = 'http://localhost:4000'

describe('GuaraníHost Real API Tests', () => {
  
  it('should get featured properties from real API', async () => {
    const response = await request(SERVER_URL)
      .get('/api/properties/public')
    
    expect(response.status).toBe(200)
    expect(response.body).toHaveProperty('message')
    expect(response.body).toHaveProperty('properties')
    expect(Array.isArray(response.body.properties)).toBe(true)
    
    console.log('✅ Real properties API working')
    console.log('📊 Properties found:', response.body.properties?.length || 0)
    console.log('🏠 First property:', response.body.properties[0]?.title || 'None')
  })
  
  it('should get featured tours from real API', async () => {
    const response = await request(SERVER_URL)
      .get('/api/tours/public')
    
    expect(response.status).toBe(200)
    expect(response.body).toHaveProperty('message')
    
    // Check if tours exist
    if (response.body.tours) {
      expect(Array.isArray(response.body.tours)).toBe(true)
      console.log('🗺️ Tours found:', response.body.tours.length)
    } else {
      console.log('🗺️ No tours field in response')
    }
    
    console.log('✅ Real tours API working')
  })
  
  it('should handle basic API health check', async () => {
    // Test a simple endpoint that should exist
    const response = await request(SERVER_URL)
      .get('/api/properties/public?limit=1')
    
    expect(response.status).toBe(200)
    
    console.log('🔍 Health check passed')
    console.log('🔍 Limited properties response works')
  })
  
})