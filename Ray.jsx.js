import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom/client';
import * as THREE from 'three';
// Initialize Mapbox when available
const initializeMapbox = () => {
  if (window.mapboxgl) {
    window.mapboxgl.accessToken = 'pk.eyJ1IjoiY2FwdGFpbmxvZ2lzdGljcyIsImEiOiJjbTNsZGl1MDAwNTI4MmpvcG0xdzNsOTgzIn0.sEYVbUajiL9bNbFdZP2ouw';
  }
};
initializeMapbox();
// Add custom font
const fontStyle = document.createElement('style');
fontStyle.textContent = `
  @font-face {
    font-family: 'SuisseIntl';
    src: url('https://raw.githubusercontent.com/christian-bromann/makes.one/master/fonts/SuisseIntl-Bold.otf') format('opentype');
    font-weight: bold;
    font-style: normal;
    font-display: swap;
  }
`;
document.head.appendChild(fontStyle);
// Add viewport meta tag programmatically
const setViewportMeta = () => {
  const viewport = document.createElement('meta');
  viewport.name = 'viewport';
  viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
  document.getElementsByTagName('head')[0].appendChild(viewport);
};
const App = () => {
  const [activeScreen, setActiveScreen] = useState('main'); // 'left', 'main', 'right'
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [lng] = useState(-70.9);
  const [lat] = useState(42.35);
  const [zoom] = useState(9);
  useEffect(() => {
    setViewportMeta();
    
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  useEffect(() => {
    if (map.current) return; // initialize map only once
    
    if (!window.mapboxgl) {
      console.error('Mapbox GL JS is not loaded');
      return;
    }
    
    map.current = new window.mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/captainlogistics/cm3vnaux2002201qrhqvnai80',
      center: [lng, lat],
      zoom: zoom,
      pitch: 45,
      bearing: -17.6,
      antialias: true
    });
    
    map.current.on('load', () => {
      // Add 3D building layer
      map.current.addLayer({
        'id': '3d-buildings',
        'source': 'composite',
        'source-layer': 'building',
        'filter': ['==', 'extrude', 'true'],
        'type': 'fill-extrusion',
        'minzoom': 15,
        'paint': {
          'fill-extrusion-color': '#aaa',
          'fill-extrusion-height': [
            'interpolate',
            ['linear'],
            ['zoom'],
            15,
            0,
            15.05,
            ['get', 'height']
          ],
          'fill-extrusion-base': [
            'interpolate',
            ['linear'],
            ['zoom'],
            15,
            0,
            15.05,
            ['get', 'min_height']
          ],
          'fill-extrusion-opacity': 0.6
        }
      });
      // Add navigation controls
      map.current.addControl(new window.mapboxgl.NavigationControl());
    });
    return () => map.current?.remove();
  }, [lng, lat, zoom]);
  return (
    <div style={{
      position: 'relative',
      width: '100vw',
      height: '100vh',
      backgroundColor: '#1a1a1a',
      display: 'flex',
      overflow: 'hidden',
      flexDirection: isMobile ? 'column' : 'row',
      fontFamily: 'SuisseIntl, Segoe UI, sans-serif',
      color: '#ffffff',
    }}>
      {/* Floating Navigation Bar */}
      <div style={{
        position: 'fixed',
        top: '35px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: '#FFD966',
        padding: '8px 16px',
        borderRadius: '30px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        zIndex: 1000,
        display: 'flex',
        gap: '16px',
        alignItems: 'center',
        width: '425px',
        justifyContent: 'space-between',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flex: '1',
        }}>
          <button style={{
            padding: '8px 16px',
            backgroundColor: '#1a1a1a',
            border: 'none',
            borderRadius: '20px',
            color: '#ffffff',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            flex: '1',
            maxWidth: '100px',
          }}>HOME</button>
          <input 
            type="text" 
            placeholder="Search..."
            style={{
              padding: '8px 16px',
              backgroundColor: '#ffffff',
              border: 'none',
              borderRadius: '20px',
              fontSize: '14px',
              flex: '1',
              maxWidth: '140px',
              outline: 'none',
            }}
          />
        </div>
        <button
          onClick={() => setActiveScreen('left')}
          style={{
            padding: '8px',
            backgroundColor: 'transparent',
            border: 'none',
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s ease',
            color: activeScreen === 'left' ? '#00f2ff' : '#666666',
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12h18M3 6h18M3 18h18"/>
          </svg>
        </button>
        <button
          onClick={() => setActiveScreen('main')}
          style={{
            padding: '8px',
            backgroundColor: 'transparent',
            border: 'none',
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s ease',
            color: activeScreen === 'main' ? '#00f2ff' : '#666666',
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
        </button>
        <button
          onClick={() => setActiveScreen('right')}
          style={{
            padding: '8px',
            backgroundColor: 'transparent',
            border: 'none',
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s ease',
            color: activeScreen === 'right' ? '#00f2ff' : '#666666',
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 16v-4M12 8h.01"/>
          </svg>
        </button>
      </div>
      {/* Left Panel - Dashboard */}
      <div style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#1a1a1a',
        padding: '48px 24px',
        transition: 'all 0.3s ease',
        zIndex: 3,
        position: 'absolute',
        top: '50px',
        left: 0,
        transform: `translateX(${activeScreen === 'left' ? '0' : '-100%'})`,
        visibility: activeScreen === 'left' ? 'visible' : 'hidden',
      }}>
        <h2 style={{ 
          fontSize: '42px', 
          marginBottom: '36px',
          fontWeight: '200',
          letterSpacing: '-0.5px',
          color: '#ffffff',
        }}>DASHBOARD</h2>
        <nav>
          <ul style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
          }}>
            <li style={{
              margin: '0 0 20px 0',
              padding: '32px 24px',
              backgroundColor: '#333333',
              fontSize: '24px',
              fontWeight: '300',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              position: 'relative',
              ':hover': {
                backgroundColor: '#404040',
              }
            }}>
              <span style={{ fontSize: '14px', opacity: 0.7, display: 'block', marginBottom: '8px' }}>PROFILE</span>
              MY ACCOUNT
            </li>
            <li style={{
              margin: '0 0 20px 0',
              padding: '32px 24px',
              backgroundColor: '#333333',
              fontSize: '24px',
              fontWeight: '300',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              ':hover': {
                backgroundColor: '#404040',
              }
            }}>
              <span style={{ fontSize: '14px', opacity: 0.7, display: 'block', marginBottom: '8px' }}>LOCATIONS</span>
              MY PLACES
            </li>
            <li style={{
              margin: '0 0 20px 0',
              padding: '32px 24px',
              backgroundColor: '#333333',
              fontSize: '24px',
              fontWeight: '300',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              ':hover': {
                backgroundColor: '#404040',
              }
            }}>
              <span style={{ fontSize: '14px', opacity: 0.7, display: 'block', marginBottom: '8px' }}>CONTACTS</span>
              MY PEOPLE
            </li>
            <li style={{
              margin: '0 0 20px 0',
              padding: '32px 24px',
              backgroundColor: '#333333',
              fontSize: '24px',
              fontWeight: '300',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              ':hover': {
                backgroundColor: '#404040',
              }
            }}>
              <span style={{ fontSize: '14px', opacity: 0.7, display: 'block', marginBottom: '8px' }}>BILLING</span>
              MY PAYMENTS
            </li>
          </ul>
        </nav>
      </div>
      
      {/* Main Screen - Map */}
      <div style={{
        width: '100%',
        position: 'absolute',
        height: 'calc(100% - 50px)',
        top: '50px',
        left: 0,
        transform: `translateX(${activeScreen === 'main' ? '0' : '-100%'})`,
        visibility: activeScreen === 'main' ? 'visible' : 'hidden',
      }}>
        <div ref={mapContainer} style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 1,
          backgroundColor: '#1a1a1a',
        }} className="mapboxgl-map" />
        
        {/* Removed old Map Controls */}
      </div>
      
      {/* Right Panel - River */}
      <div style={{
        width: '100%',
        height: 'calc(100% - 50px)',
        backgroundColor: '#f0f0f0',
        padding: '20px',
        transition: 'all 0.3s ease',
        zIndex: 3,
        position: 'absolute',
        top: '50px',
        left: 0,
        transform: `translateX(${activeScreen === 'right' ? '0' : '100%'})`,
        visibility: activeScreen === 'right' ? 'visible' : 'hidden',
      }}>
        <h2 style={{ 
          fontSize: '24px', 
          marginBottom: '20px',
          fontWeight: 'normal',
        }}>River</h2>
        <div style={{
          backgroundColor: '#333333',
          padding: '32px 24px',
          marginBottom: '20px',
          transition: 'all 0.3s ease',
          cursor: 'pointer',
          ':hover': {
            backgroundColor: '#404040',
          }
        }}>
          <span style={{ fontSize: '14px', opacity: 0.7, display: 'block', marginBottom: '8px' }}>UPCOMING</span>
          <h3 style={{
            fontSize: '24px',
            fontWeight: '300',
            letterSpacing: '0.5px',
            marginBottom: '16px',
          }}>LOCAL EVENTS</h3>
          <p style={{
            fontSize: '16px',
            opacity: 0.7,
            letterSpacing: '0.5px',
          }}>No events currently</p>
        </div>
        <div style={{
          backgroundColor: '#333333',
          padding: '32px 24px',
          marginBottom: '20px',
          transition: 'all 0.3s ease',
          cursor: 'pointer',
          ':hover': {
            backgroundColor: '#404040',
          }
        }}>
          <span style={{ fontSize: '14px', opacity: 0.7, display: 'block', marginBottom: '8px' }}>FORECAST</span>
          <h3 style={{
            fontSize: '24px',
            fontWeight: '300',
            marginBottom: '16px',
          }}>WEATHER</h3>
          <p style={{
            fontSize: '16px',
            opacity: 0.7,
          }}>Weather information</p>
        </div>
        <div style={{
          backgroundColor: '#333333',
          padding: '32px 24px',
          transition: 'all 0.3s ease',
          cursor: 'pointer',
          ':hover': {
            backgroundColor: '#404040',
          }
        }}>
          <span style={{ fontSize: '14px', opacity: 0.7, display: 'block', marginBottom: '8px' }}>UPDATES</span>
          <h3 style={{
            fontSize: '24px',
            fontWeight: '300',
            marginBottom: '16px',
          }}>NEWS</h3>
          <p style={{
            fontSize: '16px',
            opacity: 0.7,
          }}>Latest updates</p>
        </div>
      </div>
    </div>
  );
};
const container = document.getElementById('renderDiv');
const root = ReactDOM.createRoot(container);
root.render(<App />);