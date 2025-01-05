document.addEventListener('DOMContentLoaded', () => {
    // Check if running in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches || 
        window.navigator.standalone === true) {
        document.body.classList.add('standalone-mode');
    }
    
    // Handle theme changes for the status bar
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const updateThemeColor = (e) => {
        const themeColor = e.matches ? '#0B0B0B' : '#FFFFFF';
        document.querySelector('meta[name="theme-color"]').setAttribute('content', themeColor);
    };
    
    darkModeMediaQuery.addListener(updateThemeColor);
    updateThemeColor(darkModeMediaQuery);
    
    // Set initial theme to dark by default
    document.documentElement.setAttribute('data-theme', 'dark');
    
    // Global variables
    let mapInstance = null;
    let originMarker = null;
    let destinationMarker = null;
    let routeLine = null;
    let pinMarker = null;
    let originLocation = null;
    let destinationLocation = null;

    // Utility Functions
    function showLoading(show, message = 'Cargando...') {
        const loader = document.querySelector('.loading-overlay');
        const loadingText = loader.querySelector('.loading-text');
        if (show) {
            loadingText.textContent = message;
            loader.classList.add('active');
        } else {
            loader.classList.remove('active');
        }
    }

    function showNotification(message) {
        const toast = document.querySelector('.notification-toast');
        toast.textContent = message;
        toast.classList.add('active');
        setTimeout(() => toast.classList.remove('active'), 3000);
    }

    async function getCurrentLocation() {
        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            });
        });
    }

    function getPlaceLocation(type) {
        const locations = {
            home: [-100.366263, 20.577444],
            work: [-100.385422, 20.589738],
            family: [-100.395182, 20.592831],
            friends: [-100.375922, 20.585633]
        };
        return locations[type];
    }

    function initializeLocationBox() {
        // Get new elements
        const currentLocationBtn = document.querySelector('.location-button.current-location');
        const locationButtons = document.querySelectorAll('.location-button');
        
        // Current Location Button
        if (currentLocationBtn) {
            currentLocationBtn.addEventListener('click', async () => {
                try {
                    showLoading(true, 'Obteniendo ubicación...');
                    const position = await getCurrentLocation();
                    const userLocation = [position.coords.longitude, position.coords.latitude];

                    if (originMarker) originMarker.remove();
                    originMarker = new mapboxgl.Marker({ color: '#0066ff' })
                        .setLngLat(userLocation)
                        .addTo(mapInstance);

                    mapInstance.flyTo({
                        center: userLocation,
                        zoom: 14,
                        duration: 1000
                    });

                    showLoading(false);
                    // Move to destination card after setting origin
                    showNextCard('origin', 'destination');
                } catch (error) {
                    console.error('Location error:', error);
                    showLoading(false);
                    showNotification('Rayos, no pudimos obtener tu ubicación. Nos ayudas a revisar si tienes GPS activado?');
                }
            });
        }

        // Location Buttons (Home, Work, etc.)
        locationButtons.forEach(button => {
            if (button.classList.contains('current-location')) return; // Skip current location button
            
            button.addEventListener('click', () => {
                const location = getPlaceLocation(button.dataset.location);
                if (location) {
                    const isDestination = button.closest('.destination-card') !== null;
                    const marker = isDestination ? destinationMarker : originMarker;
                    const markerColor = isDestination ? '#ff0000' : '#0066ff';

                    if (marker) marker.remove();
                    const newMarker = new mapboxgl.Marker({ color: markerColor })
                        .setLngLat(location)
                        .addTo(mapInstance);

                    if (isDestination) {
                        destinationMarker = newMarker;
                        
                        // If we have both markers, calculate route
                        if (originMarker) {
                            const bounds = new mapboxgl.LngLatBounds()
                                .extend(originMarker.getLngLat())
                                .extend(location);

                            mapInstance.fitBounds(bounds, {
                                padding: { top: 100, bottom: 100, left: 80, right: 80 },
                                duration: 1500
                            });

                            setTimeout(() => calculateRoute(), 1500);
                        }
                    } else {
                        originMarker = newMarker;
                        mapInstance.flyTo({
                            center: location,
                            zoom: 15,
                            duration: 1500
                        });
                        // Move to destination card after setting origin
                        showNextCard('origin', 'destination');
                    }
                }
            });
        });

        // Add receipt confirmation handlers
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('confirm-trip')) {
                handleReceiptConfirm();
            } else if (e.target.classList.contains('cancel-trip')) {
                showNextCard('receipt', 'origin');
                if (routeLine) routeLine.remove();
                if (destinationMarker) destinationMarker.remove();
            }
        });
    }

    function initializeSideMenu() {
        const sideMenu = document.querySelector('.side-menu');
        const burgerMenu = document.querySelector('.burger-menu');
        const closeMenuButton = document.querySelector('.close-menu');
        const sideMenuOverlay = document.querySelector('.side-menu-overlay');
        const bottomActions = document.querySelector('.bottom-actions');

        function openMenu() {
            sideMenu.classList.add('active');
            sideMenuOverlay.classList.add('active');
            bottomActions.classList.add('hidden');
        }

        function closeMenu() {
            sideMenu.classList.remove('active');
            sideMenuOverlay.classList.remove('active');
            setTimeout(() => {
                bottomActions.classList.remove('hidden');
            }, 300);
        }

        burgerMenu.addEventListener('click', openMenu);
        closeMenuButton.addEventListener('click', closeMenu);
        sideMenuOverlay.addEventListener('click', closeMenu);
    }

    function initMap() {
        try {
            mapboxgl.accessToken = 'pk.eyJ1IjoiY2FwdGFpbmxvZ2lzdGljcyIsImEiOiJjbTNsZGl1MDAwNTI4MmpvcG0xdzNsOTgzIn0.sEYVbUajiL9bNbFdZP2ouw';

            const STYLES = {
                light: 'mapbox://styles/captainlogistics/cm5i65mpl002h01qo7i79dndo',
                dark: 'mapbox://styles/captainlogistics/cm56ostgm00m201s8ak8f6cdq'
            };

            const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';

            mapInstance = new mapboxgl.Map({
                container: 'map',
                style: STYLES[currentTheme],
                center: [-100.3899, 20.5881],
                zoom: 12,
                attributionControl: false,
                antialias: true
            });

            // Handle window resize
            window.addEventListener('resize', () => {
                mapInstance.resize();
            });

            mapInstance.on('load', () => {
                console.log('Map loaded successfully');
                initializeSideMenu();
                initializeLocationBox();
                initializeCarousels();
            });

        } catch (error) {
            console.error('Error initializing map:', error);
        }
    }

    // Update theme switching functionality
    const logoContainer = document.querySelector('.logo-container');
    logoContainer.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        // Update theme attribute
        document.documentElement.setAttribute('data-theme', newTheme);
        
        // Update map style
        if (mapInstance) {
            const STYLES = {
                light: 'mapbox://styles/captainlogistics/cm5i65mpl002h01qo7i79dndo',
                dark: 'mapbox://styles/captainlogistics/cm56ostgm00m201s8ak8f6cdq'
            };
            mapInstance.setStyle(STYLES[newTheme]);
        }
    });

    // Add route calculation functions
    async function getRoute(start, end) {
        const query = await fetch(
            `https://api.mapbox.com/directions/v5/mapbox/driving/${start[0]},${start[1]};${end[0]},${end[1]}?steps=true&geometries=geojson&access_token=${mapboxgl.accessToken}`
        );
        const json = await query.json();
        return json.routes[0];
    }

    function drawRoute(route) {
        if (routeLine) {
            routeLine.remove();
        }

        // Add the route to the map
        mapInstance.addSource('route', {
            type: 'geojson',
            data: {
                type: 'Feature',
                properties: {},
                geometry: route.geometry
            }
        });

        mapInstance.addLayer({
            id: 'route',
            type: 'line',
            source: 'route',
            layout: {
                'line-join': 'round',
                'line-cap': 'round'
            },
            paint: {
                'line-color': '#0066ff',
                'line-width': 4
            }
        });

        return {
            remove: () => {
                if (mapInstance.getLayer('route')) mapInstance.removeLayer('route');
                if (mapInstance.getSource('route')) mapInstance.removeSource('route');
            }
        };
    }

    function calculateTripPrice(distance) {
        const techPowerFee = 5;
        let fare = 0;

        if (distance <= 10) {
            fare = distance * 10;
        } else if (distance <= 20) {
            fare = 10 * 10 + (distance - 10) * 8;
        } else if (distance <= 30) {
            fare = 10 * 10 + 10 * 8 + (distance - 20) * 5;
        } else if (distance <= 40) {
            fare = 10 * 10 + 10 * 8 + 10 * 5 + (distance - 30) * 8;
        } else if (distance <= 50) {
            fare = 10 * 10 + 10 * 8 + 10 * 5 + 10 * 8 + (distance - 40) * 10;
        } else {
            fare = 10 * 10 + 10 * 8 + 10 * 5 + 10 * 8 + 10 * 10 + Math.ceil((distance - 50) / 10) * 2;
        }

        const total = fare + techPowerFee;

        return {
            fare: fare.toFixed(2),
            techPowerFee: techPowerFee.toFixed(2),
            total: total.toFixed(2)
        };
    }

    function createReceiptHTML(pricing, distance) {
        return `
            <div class="receipt-content">
                <div class="receipt-details">
                    <div class="receipt-row">
                        <span>Distance</span>
                        <span>${distance.toFixed(2)} km</span>
                    </div>
                    <div class="receipt-row">
                        <span>Base fare</span>
                        <span>$${pricing.baseFare}</span>
                    </div>
                    <div class="receipt-row">
                        <span>Distance cost</span>
                        <span>$${pricing.distanceCost}</span>
                    </div>
                    <div class="receipt-row">
                        <span>Service fee</span>
                        <span>$${pricing.serviceFee}</span>
                    </div>
                    <div class="receipt-row total">
                        <span>Total</span>
                        <span>$${pricing.total}</span>
                    </div>
                </div>
                <div class="receipt-actions">
                    <button class="cancel-trip">Cancel</button>
                    <button class="confirm-trip">Confirm</button>
                </div>
            </div>
        `;
    }

    function showReceipt(pricing, distance) {
        const cardsWrapper = document.querySelector('.cards-wrapper');
        const receiptCard = document.querySelector('.receipt-card');
        
        // Update receipt content
        receiptCard.innerHTML = `
            <div class="card-header">
                <h3>Trip Details</h3>
            </div>
            ${createReceiptHTML(pricing, distance)}
        `;
        
        // Slide to receipt
        cardsWrapper.dataset.activeCard = 'receipt';
        
        // Update active states
        document.querySelector('.origin-card').classList.remove('active');
        document.querySelector('.destination-card').classList.remove('active');
        receiptCard.classList.add('active');
    }

    function confirmTrip() {
        const cardsWrapper = document.querySelector('.cards-wrapper');
        const driverCard = document.querySelector('.driver-card');
        
        // Slide to driver assignment
        cardsWrapper.dataset.activeCard = 'driver';
        
        // Update active states
        document.querySelector('.receipt-card').classList.remove('active');
        driverCard.classList.add('active');
        
        // Start driver assignment animation/process
        startDriverAssignment();
    }

    function cancelTrip() {
        const cardsWrapper = document.querySelector('.cards-wrapper');
        const locationsCard = document.querySelector('.locations-card');
        
        // Slide back to locations
        cardsWrapper.dataset.activeCard = 'locations';
        
        // Update active states
        document.querySelector('.receipt-card').classList.remove('active');
        locationsCard.classList.add('active');
        
        // Clean up route and markers
        if (routeLine) routeLine.remove();
        if (destinationMarker) destinationMarker.remove();
    }

    function initializeCarousels() {
        document.querySelectorAll('.locations-carousel').forEach(carousel => {
            const container = carousel.querySelector('.carousel-container');
            const content = carousel.querySelector('.carousel-content');
            const leftBtn = carousel.querySelector('.scroll-btn.left');
            const rightBtn = carousel.querySelector('.scroll-btn.right');
            
            function updateScrollButtons() {
                leftBtn.classList.toggle('hidden', content.scrollLeft <= 0);
                rightBtn.classList.toggle('hidden', 
                    content.scrollLeft >= content.scrollWidth - content.clientWidth);
            }

            leftBtn.addEventListener('click', () => {
                content.scrollBy({ left: -200, behavior: 'smooth' });
            });

            rightBtn.addEventListener('click', () => {
                content.scrollBy({ left: 200, behavior: 'smooth' });
            });

            content.addEventListener('scroll', updateScrollButtons);
            window.addEventListener('resize', updateScrollButtons);
            updateScrollButtons();
        });
    }

    // Add this helper function for route calculation
    async function calculateRoute() {
        try {
            showLoading(true, 'Calculando ruta...');
            const route = await getRoute(originLocation, destinationLocation);

            if (routeLine) routeLine.remove();
            routeLine = drawRoute(route);
            
            const distance = route.distance / 1000;
            const pricing = calculateTripPrice(distance);

            updateTripCostBox(distance, pricing);
            showLoading(false);
        } catch (error) {
            console.error('Route error:', error);
            showLoading(false);
            showNotification('Error al calcular la ruta. Intenta de nuevo.');
        }
    }

    function updateTripCostBox(distance, pricing) {
        const tripCostBox = document.querySelector('.trip-cost-box');
        const tripDistance = tripCostBox.querySelector('.trip-distance');
        const tripFare = tripCostBox.querySelector('.trip-fare');
        const tripTechPowerFee = tripCostBox.querySelector('.trip-tech-power-fee');
        const tripTotal = tripCostBox.querySelector('.trip-total');

        tripDistance.textContent = `${distance.toFixed(2)} km`;
        tripFare.textContent = `$${pricing.fare} MXN`;
        tripTechPowerFee.textContent = `$${pricing.techPowerFee} MXN`;
        tripTotal.textContent = `$${pricing.total} MXN`;
        tripCostBox.classList.add('active');
    }

    function showNextCard(currentCard, nextCard) {
        const wrapper = document.querySelector('.cards-wrapper');
        const current = document.querySelector(`.${currentCard}-card`);
        const next = document.querySelector(`.${nextCard}-card`);
        
        wrapper.dataset.activeCard = nextCard;
        current.classList.remove('active');
        next.classList.add('active');
    }

    function handleLocationSelection(location, isOrigin) {
        if (isOrigin) {
            originLocation = location;
            if (originMarker) originMarker.remove();
            originMarker = new mapboxgl.Marker({ color: '#0066ff' })
                .setLngLat(location)
                .addTo(mapInstance);
            document.querySelector('.origin-btn').classList.remove('active');
        } else {
            destinationLocation = location;
            if (destinationMarker) destinationMarker.remove();
            destinationMarker = new mapboxgl.Marker({ color: '#00ff00' })
                .setLngLat(location)
                .addTo(mapInstance);
            document.querySelector('.destination-btn').classList.remove('active');
        }

        updateRouteAndCost();
    }

    function updateRouteAndCost() {
        if (originLocation && destinationLocation) {
            calculateRoute();
        } else {
            if (routeLine) routeLine.remove();
            const tripCostBox = document.querySelector('.trip-cost-box');
            tripCostBox.classList.remove('active');
        }
    }

    function handleReceiptConfirm() {
        showNextCard('receipt', 'agents');
        loadNearbyAgents();
    }

    function loadNearbyAgents() {
        const agentsList = document.querySelector('.agents-list');
        // Populate agents list with nearby available agents
        // This would typically fetch from your backend
    }

    function initializeLocationButtons() {
        const originBtn = document.querySelector('.origin-btn');
        const destinationBtn = document.querySelector('.destination-btn');
        const originPopup = document.querySelector('.origin-popup');
        const destinationPopup = document.querySelector('.destination-popup');

        // Function to close all popups
        function closeAllPopups() {
            originPopup.classList.remove('active');
            destinationPopup.classList.remove('active');
        }

        // Handle clicking outside to close popups
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.location-popup') && 
                !e.target.closest('.origin-btn') && 
                !e.target.closest('.destination-btn')) {
                closeAllPopups();
            }
        });

        // Origin button click handler
        originBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const tripCostBox = document.querySelector('.trip-cost-box');
            if (!tripCostBox.classList.contains('active')) {
                destinationPopup.classList.remove('active');
                originPopup.classList.toggle('active');
            }
        });

        // Destination button click handler
        destinationBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const tripCostBox = document.querySelector('.trip-cost-box');
            if (!tripCostBox.classList.contains('active')) {
                originPopup.classList.remove('active');
                destinationPopup.classList.toggle('active');
            }
        });

        // Add click handlers for popup buttons
        document.querySelectorAll('.popup-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = btn.classList.contains('current-location') ? 'current' :
                              btn.classList.contains('my-places') ? 'places' : 'pin';
                const isOrigin = btn.closest('.origin-popup') !== null;
                
                if (action === 'current') {
                    handleCurrentLocation(isOrigin);
                } else if (action === 'places') {
                    handleMyPlaces(isOrigin);
                } else if (action === 'pin') {
                    handlePinLocation(isOrigin);
                }
                
                closeAllPopups();
            });
        });
    }

    function handleMyPlaces(isOrigin) {
        const myPlacesModal = document.querySelector('.my-places-modal');
        myPlacesModal.classList.add('active');

        const placeItems = document.querySelectorAll('.place-item');
        placeItems.forEach(item => {
            item.addEventListener('click', () => {
                const location = getPlaceLocation(item.dataset.location);
                if (location) {
                    handleLocationSelection(location, isOrigin);
                    myPlacesModal.classList.remove('active');
                }
            });
        });

        const closeBtn = myPlacesModal.querySelector('.modal-close-btn');
        closeBtn.addEventListener('click', () => {
            myPlacesModal.classList.remove('active');
        });
    }

    function handlePinLocation(isOrigin) {
        if (pinMarker) pinMarker.remove();

        const markerColor = isOrigin ? '#0066ff' : '#00ff00';
        pinMarker = new mapboxgl.Marker({ color: markerColor, draggable: true })
            .setLngLat(mapInstance.getCenter())
            .addTo(mapInstance)
            .setPopup(new mapboxgl.Popup().setHTML('<button class="confirm-pin">Confirmar</button>'))
            .togglePopup();

        pinMarker.on('dragend', () => {
            pinMarker.togglePopup();
        });

        mapInstance.on('click', (e) => {
            pinMarker.setLngLat(e.lngLat).addTo(mapInstance);
            pinMarker.togglePopup();
        });

        document.querySelector('.confirm-pin').addEventListener('click', () => {
            const pinLocation = pinMarker.getLngLat().toArray();
            handleLocationSelection(pinLocation, isOrigin);
            pinMarker.remove();
        });
    }

    function handleCurrentLocation(isOrigin) {
        getCurrentLocation()
            .then(position => {
                const location = [position.coords.longitude, position.coords.latitude];
                handleLocationSelection(location, isOrigin);
            })
            .catch(error => {
                console.error('Location error:', error);
                showNotification('No se pudo obtener la ubicación. Por favor, verifica los permisos.');
            });
    }

    // Add this function to handle user confirmation
    function handleTripConfirmation() {
        // Proceed with the trip, e.g., show nearby agents, etc.
    }

    // Add event listeners for trip confirmation and cancellation
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('confirm-trip')) {
            handleTripConfirmation();
        } else if (e.target.classList.contains('cancel-trip')) {
            const tripCostBox = document.querySelector('.trip-cost-box');
            tripCostBox.classList.remove('active');
            if (routeLine) routeLine.remove();
            if (destinationMarker) destinationMarker.remove();
            destinationLocation = null;
            document.querySelector('.destination-btn').classList.remove('active');
        }
    });

    // Start initialization
    initMap();

    const sideMenu = document.querySelector('.side-menu');
    const burgerMenu = document.querySelector('.burger-menu');
    const closeMenuButton = document.querySelector('.close-menu');
    const bottomActions = document.querySelector('.bottom-actions');

    // Function to toggle bottom action buttons
    function toggleBottomActions(show) {
        if (show) {
            bottomActions.classList.remove('hidden');
            console.log("Bottom actions shown");
        } else {
            bottomActions.classList.add('hidden');
            console.log("Bottom actions hidden");
        }
    }

    // Open side menu
    burgerMenu.addEventListener('click', () => {
        sideMenu.classList.add('active');
        toggleBottomActions(false); // Hide bottom actions
    });

    // Close side menu
    closeMenuButton.addEventListener('click', () => {
        sideMenu.classList.remove('active');
        // Use setTimeout to delay the display of bottom actions to ensure they are shown after the menu is fully closed
        setTimeout(() => toggleBottomActions(true), 300); // Show bottom actions after 300ms
    });

    initializeLocationButtons();
}); 