//
//
//
mapboxgl.accessToken = "pk.eyJ1IjoiY2FwdGFpbmxvZ2lzdGljcyIsImEiOiJjbTNsZGl1MDAwNTI4MmpvcG0xdzNsOTgzIn0.sEYVbUajiL9bNbFdZP2ouw";

const map = new mapboxgl.Map({
  container: "map", // The ID of the div in your HTML
  style: "mapbox://styles/mapbox/dark-v10", // Map style
  center: [-100.398361, 20.6050736], // Initial map center [lng, lat] (Mexico City)
  zoom: 11 // Initial zoom level
});

// Array of locations
const locations = [
    {   
      id: 1,
      lng: -100.3942094,
      lat: 20.6180475,
      title: 'Alberca Olimpica 2000',
      description: 'Parque Queretaro 2000.',
      icon: 'https://files.svgcdn.io/noto/woman-swimming-light-skin-tone.svg',
      category: 'ECO'
    },
    { 
      id: 2,
      lng: -100.366395,
      lat: 20.577552,
      title: 'Estadio Corregidora',
      description: 'Estadio de Queretaro, Qro.',
      icon: 'https://files.svgcdn.io/noto-v1/stadium.svg',
      category: 'PRO'
    },
    { 
      id: 3,
      lng: -100.4563699,
      lat: 20.6971818,
      title: 'Juriquilla Nautica',
      description: 'Alimentos y bebidas en Juriquilla.',
      icon: 'https://files.svgcdn.io/noto/spaghetti.svg',
      category: 'ECO'
    },
    { 
      id: 4,
      lng: -100.40511489,
      lat: 20.57463769,
      title: 'Plaza de Toros Santa María',
      description: 'Centro de espectáculos en renta para todo tipo de eventos y/o espectáculos.',
      icon: 'https://files.svgcdn.io/noto/stadium.svg',
      category: 'PRO'
    },
    { 
      id: 5,
      lng: -100.431146,
      lat: 20.639300,
      title: 'Corporativo Santander',
      description: 'Santander siempre está en contacto con usted.',
      icon: 'https://files.svgcdn.io/noto/bank.svg',
      category: 'ECO'
    }];

// Function to update the floating menu
function updateMenu(title, description, imageUrl) {
    const menuTitle = document.getElementById('menu-title');
    const menuDescription = document.getElementById('menu-description');
    const menuImage = document.getElementById('menu-image');

    menuTitle.textContent = title; // Set the menu title
    menuDescription.textContent = description; // Set the menu description
    menuImage.src = imageUrl; // Set the menu image
}

// Get references to floating menu elements
const floatingMenu = document.getElementById('floating-menu');
const menuTitle = document.getElementById('menu-title');
const menuDescription = document.getElementById('menu-description');
const menuImage = document.getElementById('menu-image');
const menuCloseButton = document.querySelector('.close-button');

// Function to expand the floating menu
function expandMenu(title, description, imageUrl) {
    menuTitle.textContent = title; // Set the menu title
    menuDescription.textContent = description; // Set the menu description
    menuImage.src = imageUrl; // Set the menu image

    // Show the expanded content
    menuTitle.style.display = 'block';
    menuDescription.style.display = 'block';
    menuCloseButton.style.display = 'block';

    // Expand the floating menu
    floatingMenu.classList.add('expanded');
}

// Function to collapse the floating menu
function collapseMenu() {
    // Hide the expanded content
    menuTitle.style.display = 'none';
    menuDescription.style.display = 'none';
    menuCloseButton.style.display = 'none';

    // Collapse the floating menu
    floatingMenu.classList.remove('expanded');
}

// Initial marker setup
locations.forEach(location => {
  const markerElement = document.createElement('div'); // Create a custom marker element
  markerElement.style.backgroundImage = `url(${location.icon})`;
  markerElement.style.width = '35px'; // Adjust size
  markerElement.style.height = '35px';
  markerElement.style.backgroundSize = '35px';
  markerElement.style.borderRadius = '15%';
  markerElement.style.cursor = 'pointer'; // Add a pointer cursor

  const marker = new mapboxgl.Marker({ element: markerElement })
    .setLngLat([location.lng, location.lat])
    .addTo(map);

  // Add event listener to expand floating menu on marker click
  marker.getElement().addEventListener('click', () => {
    expandMenu(location.title, location.description, location.icon);
  });
});

// Event listener to collapse the floating menu
menuCloseButton.addEventListener('click', collapseMenu);

// Get references to modal elements
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modal-title');
const modalDescription = document.getElementById('modal-description');
const closeButton = document.querySelector('.close-button'); // Fix the selector

// Function to open the modal
function openModal(title, description) {
    modalTitle.textContent = title; // Set the modal title
    modalDescription.textContent = description; // Set the modal description
    modal.style.display = 'block'; // Show the modal as a floating window
};

// Function to close the modal
closeButton.addEventListener('click', () => {
  modal.style.display = 'none'; // Hide the modal
});

// Close the modal if the user clicks outside of it
window.addEventListener('click', (e) => {
  if (e.target === modal) {
    modal.style.display = 'none';
    }
});

// Function to center the map
function centerMap() {
  map.flyTo({
    center: [-100.398361, 20.6050736], // Initial map center
    zoom: 11, // Initial zoom level
    essential: true // This ensures smooth animation
  });
}

// Event listener for the home button
document.getElementById('home-button').addEventListener('click', centerMap);

// Filtering Logic
const filterDropdown = document.getElementById('category-filter');

filterDropdown.addEventListener("change", (e) => {
  const selectedCategory = e.target.value;

  // Remove existing markers
  document.querySelectorAll('.mapboxgl-marker').forEach(marker => marker.remove());

  // Re-add markers matching the selected category
  locations
    .filter(location => selectedCategory === 'Todos' || location.category === selectedCategory)
    .forEach(location => {
      const markerElement = document.createElement('div'); // Create a custom marker element
      markerElement.style.backgroundImage = `url(${location.icon})`;
      markerElement.style.width = '35px'; // Adjust size
      markerElement.style.height = '35px';
      markerElement.style.backgroundSize = '35px';
      markerElement.style.borderRadius = '15%';
      markerElement.style.cursor = 'pointer'; // Add a pointer cursor

      const marker = new mapboxgl.Marker({ element: markerElement })
        .setLngLat([location.lng, location.lat])
        .addTo(map);

      // Add event listener to open floating menu on marker click
      marker.getElement().addEventListener('click', () => {
        openMenu(location.title, location.description, location.icon);
      });
    });
});

document.getElementById('category-filter').addEventListener('change', (e) => {
  const selectedCategory = e.target.value;
  console.log(`Selected category: ${selectedCategory}`);
});

function openMarkerModal(locations) {
  const modal = document.getElementById('modal');
  const modalTitle = document.getElementById('modal-title');
  const modalDescription = document.getElementById('modal-description');
  const modalImage = document.getElementById('modal-image'); // Assuming you add an image field in modal
    
  modalTitle.textContent = 'location.title';
  modalDescription.textContent = `Description of ${location.title}`;
  modalImage.src = 'https://i.postimg.cc/g203SKQB/38a0e88c-bb4f-4896-8c8e-cec5dec2d925.jpg';
  modal.style.display = "auto";
  };

document.querySelector(".close-button").addEventListener("click", () => {
  document.getElementById("modal").style.display = null});

document.addEventListener("DOMContentLoaded", () => {
document.getElementById("home-button").addEventListener("click", () => {
  map.flyTo({
    center: [-100.388361, 20.624936],
    zoom: 11.8,
    essential: true // This ensures smooth animation
    });
  });
});

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("home-button").addEventListener("click", () => {
    map.flyTo({
      center: [-100.398361, 20.6050736], // Initial map center
      zoom: 11, // Initial zoom level
      essential: true // This ensures smooth animation
    });
  });
});