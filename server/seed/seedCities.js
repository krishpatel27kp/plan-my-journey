const db = require('../db');

const cities = [
  {
    name: 'Goa',
    country: 'India',
    region: 'west',
    costIndex: 3,
    popularity: 94,
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e',
    activities: [
      { name: 'Scuba Diving at Grand Island', category: 'Adventure', durationMinutes: 180, estimatedCost: 2500 },
      { name: 'Baga Beach Sunset Walk', category: 'Relaxing', durationMinutes: 60, estimatedCost: 0 },
      { name: 'Visit Basilica of Bom Jesus', category: 'Culture', durationMinutes: 90, estimatedCost: 0 },
      { name: 'Water Sports at Calangute', category: 'Adventure', durationMinutes: 120, estimatedCost: 1500 },
      { name: 'Spice Plantation Tour with Lunch', category: 'Food', durationMinutes: 240, estimatedCost: 1000 },
      { name: 'Anjuna Flea Market Shopping', category: 'Shopping', durationMinutes: 120, estimatedCost: 500 }
    ]
  },
  {
    name: 'Mumbai',
    country: 'India',
    region: 'west',
    costIndex: 4,
    popularity: 92,
    imageUrl: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f',
    activities: [
      { name: 'Gateway of India Visit', category: 'Sightseeing', durationMinutes: 45, estimatedCost: 0 },
      { name: 'Street Food Tour at Chowpatty', category: 'Food', durationMinutes: 90, estimatedCost: 400 },
      { name: 'Elephanta Caves Ferry & Trek', category: 'Culture', durationMinutes: 300, estimatedCost: 300 },
      { name: 'Marine Drive Late Night Drive', category: 'Relaxing', durationMinutes: 60, estimatedCost: 200 },
      { name: 'Shopping at Colaba Causeway', category: 'Shopping', durationMinutes: 120, estimatedCost: 500 }
    ]
  },
  {
    name: 'Delhi',
    country: 'India',
    region: 'north',
    costIndex: 3,
    popularity: 88,
    imageUrl: 'https://images.unsplash.com/photo-1587474260584-136574528ed5',
    activities: [
      { name: 'Red Fort Heritage Walk', category: 'Culture', durationMinutes: 120, estimatedCost: 80 },
      { name: 'Chandni Chowk Rickshaw Ride', category: 'Food', durationMinutes: 120, estimatedCost: 500 },
      { name: 'Qutub Minar Exploration', category: 'Sightseeing', durationMinutes: 90, estimatedCost: 80 },
      { name: 'Lotus Temple Meditation', category: 'Relaxing', durationMinutes: 60, estimatedCost: 0 },
      { name: 'Shopping at Sarojini Nagar', category: 'Shopping', durationMinutes: 180, estimatedCost: 300 }
    ]
  },
  {
    name: 'Bengaluru',
    country: 'India',
    region: 'south',
    costIndex: 3,
    popularity: 85,
    imageUrl: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2',
    activities: [
      { name: 'Stroll in Lalbagh Botanical Garden', category: 'Relaxing', durationMinutes: 90, estimatedCost: 50 },
      { name: 'Microbrewery Crawl in Indiranagar', category: 'Food', durationMinutes: 180, estimatedCost: 1500 },
      { name: 'Bangalore Palace Tour', category: 'Culture', durationMinutes: 120, estimatedCost: 250 },
      { name: 'Trekking at Nandi Hills', category: 'Adventure', durationMinutes: 360, estimatedCost: 600 },
      { name: 'Commercial Street Shopping', category: 'Shopping', durationMinutes: 120, estimatedCost: 300 }
    ]
  },
  {
    name: 'Kolkata',
    country: 'India',
    region: 'east',
    costIndex: 2,
    popularity: 80,
    imageUrl: 'https://images.unsplash.com/photo-1558431382-27e303142255',
    activities: [
      { name: 'Victoria Memorial Visit', category: 'Sightseeing', durationMinutes: 120, estimatedCost: 60 },
      { name: 'Howrah Bridge Photography Walk', category: 'Sightseeing', durationMinutes: 60, estimatedCost: 0 },
      { name: 'Bengali Sweet Tasting Tour', category: 'Food', durationMinutes: 90, estimatedCost: 250 },
      { name: 'Tram Ride in North Kolkata', category: 'Culture', durationMinutes: 45, estimatedCost: 20 },
      { name: 'Dakshineswar Kali Temple Visit', category: 'Culture', durationMinutes: 120, estimatedCost: 0 }
    ]
  },
  {
    name: 'Jaipur',
    country: 'India',
    region: 'north',
    costIndex: 2,
    popularity: 89,
    imageUrl: 'https://images.unsplash.com/photo-1477584322813-ac491aeb4c0b',
    activities: [
      { name: 'Amer Fort Elephant Ride & Tour', category: 'Culture', durationMinutes: 180, estimatedCost: 500 },
      { name: 'Hawa Mahal Photo Op', category: 'Sightseeing', durationMinutes: 45, estimatedCost: 50 },
      { name: 'Chokhi Dhani Rajasthani Dinner', category: 'Food', durationMinutes: 240, estimatedCost: 900 },
      { name: 'Johari Bazar Jewelry Shopping', category: 'Shopping', durationMinutes: 120, estimatedCost: 1000 },
      { name: 'Jantar Mantar Astronomical Tour', category: 'Sightseeing', durationMinutes: 90, estimatedCost: 200 }
    ]
  },
  {
    name: 'Agra',
    country: 'India',
    region: 'north',
    costIndex: 2,
    popularity: 95,
    imageUrl: 'https://images.unsplash.com/photo-1564507592333-c60657eea523',
    activities: [
      { name: 'Taj Mahal Sunrise Visit', category: 'Sightseeing', durationMinutes: 180, estimatedCost: 50 },
      { name: 'Agra Fort Historical Tour', category: 'Culture', durationMinutes: 120, estimatedCost: 50 },
      { name: 'Petha Sweets Tasting', category: 'Food', durationMinutes: 30, estimatedCost: 100 },
      { name: 'Mehtab Bagh Sunset View of Taj', category: 'Relaxing', durationMinutes: 90, estimatedCost: 150 },
      { name: 'Sadar Bazar Marble Shopping', category: 'Shopping', durationMinutes: 90, estimatedCost: 500 }
    ]
  },
  {
    name: 'Udaipur',
    country: 'India',
    region: 'north',
    costIndex: 3,
    popularity: 87,
    imageUrl: 'https://images.unsplash.com/photo-1590050752117-238cb0612b1b',
    activities: [
      { name: 'Lake Pichola Boat Cruise', category: 'Relaxing', durationMinutes: 90, estimatedCost: 400 },
      { name: 'City Palace Guided Tour', category: 'Culture', durationMinutes: 150, estimatedCost: 250 },
      { name: 'Sajjangarh Monsoon Palace Sunset', category: 'Sightseeing', durationMinutes: 120, estimatedCost: 300 },
      { name: 'Rooftop Dinner Overlooking Lake', category: 'Food', durationMinutes: 120, estimatedCost: 1200 },
      { name: 'Traditional Puppet Show at Bagore Ki Haveli', category: 'Culture', durationMinutes: 60, estimatedCost: 150 }
    ]
  },
  {
    name: 'Manali',
    country: 'India',
    region: 'north',
    costIndex: 2,
    popularity: 86,
    imageUrl: 'https://images.unsplash.com/photo-1605649487212-47bdab064df7',
    activities: [
      { name: 'Paragliding in Solang Valley', category: 'Adventure', durationMinutes: 120, estimatedCost: 3000 },
      { name: 'Hadimba Temple Pine Forest Walk', category: 'Culture', durationMinutes: 60, estimatedCost: 0 },
      { name: 'Rohtang Pass Snow Scooter Ride', category: 'Adventure', durationMinutes: 360, estimatedCost: 2500 },
      { name: 'Cafe Hopping in Old Manali', category: 'Food', durationMinutes: 180, estimatedCost: 800 },
      { name: 'Jogini Waterfall Trek', category: 'Adventure', durationMinutes: 150, estimatedCost: 0 }
    ]
  },
  {
    name: 'Kochi',
    country: 'India',
    region: 'south',
    costIndex: 2,
    popularity: 82,
    imageUrl: 'https://images.unsplash.com/photo-1589308078059-be1415eab4c3',
    activities: [
      { name: 'Fort Kochi Chinese Fishing Nets View', category: 'Sightseeing', durationMinutes: 60, estimatedCost: 0 },
      { name: 'Kathakali Dance Performance', category: 'Culture', durationMinutes: 90, estimatedCost: 400 },
      { name: 'Kerala Seafood Feast', category: 'Food', durationMinutes: 90, estimatedCost: 700 },
      { name: 'Dutch Palace & Jew Town Walk', category: 'Culture', durationMinutes: 120, estimatedCost: 50 },
      { name: 'Vembanad Lake Houseboat Cruise', category: 'Relaxing', durationMinutes: 240, estimatedCost: 2000 }
    ]
  },
  {
    name: 'Varanasi',
    country: 'India',
    region: 'north',
    costIndex: 1,
    popularity: 90,
    imageUrl: 'https://images.unsplash.com/photo-1561361058-c24cecae35ca',
    activities: [
      { name: 'Ganga Aarti at Dashashwamedh Ghat', category: 'Culture', durationMinutes: 90, estimatedCost: 0 },
      { name: 'Subah-e-Banaras Sunrise Boat Ride', category: 'Relaxing', durationMinutes: 120, estimatedCost: 300 },
      { name: 'Kashi Vishwanath Temple Darshan', category: 'Culture', durationMinutes: 120, estimatedCost: 0 },
      { name: 'Sarnath Buddhist Site Visit', category: 'Culture', durationMinutes: 180, estimatedCost: 100 },
      { name: 'Banarasi Kachori Sabzi Breakfast', category: 'Food', durationMinutes: 60, estimatedCost: 100 }
    ]
  },
  {
    name: 'Hyderabad',
    country: 'India',
    region: 'south',
    costIndex: 3,
    popularity: 84,
    imageUrl: 'https://images.unsplash.com/photo-1608958220927-42c13dcb4d21',
    activities: [
      { name: 'Charminar & Laad Bazar Shopping', category: 'Shopping', durationMinutes: 120, estimatedCost: 300 },
      { name: 'Authentic Hyderabadi Biryani Feast', category: 'Food', durationMinutes: 90, estimatedCost: 500 },
      { name: 'Golconda Fort Sound & Light Show', category: 'Culture', durationMinutes: 180, estimatedCost: 200 },
      { name: 'Ramoji Film City Day Tour', category: 'Sightseeing', durationMinutes: 480, estimatedCost: 1500 },
      { name: 'Boating at Hussain Sagar Lake', category: 'Relaxing', durationMinutes: 90, estimatedCost: 200 }
    ]
  },
  {
    name: 'Leh',
    country: 'India',
    region: 'north',
    costIndex: 4,
    popularity: 91,
    imageUrl: 'https://images.unsplash.com/photo-1581791538302-03537b9c97bf',
    activities: [
      { name: 'Pangong Tso Lake Day Trip', category: 'Sightseeing', durationMinutes: 480, estimatedCost: 3000 },
      { name: 'Magnetic Hill Demonstration', category: 'Sightseeing', durationMinutes: 60, estimatedCost: 0 },
      { name: 'Rafting in Zanskar River', category: 'Adventure', durationMinutes: 240, estimatedCost: 2000 },
      { name: 'Visit Thiksey Monastery', category: 'Culture', durationMinutes: 120, estimatedCost: 50 },
      { name: 'Tasting Ladakhi Momos & Thukpa', category: 'Food', durationMinutes: 90, estimatedCost: 300 }
    ]
  },
  {
    name: 'Alleppey',
    country: 'India',
    region: 'south',
    costIndex: 2,
    popularity: 88,
    imageUrl: 'https://images.unsplash.com/photo-1593693397690-362cb9666fc2',
    activities: [
      { name: 'Overnight Houseboat Backwater Cruise', category: 'Relaxing', durationMinutes: 720, estimatedCost: 5000 },
      { name: 'Kayaking in Backwater Canals', category: 'Adventure', durationMinutes: 180, estimatedCost: 1200 },
      { name: 'Alleppey Beach Sunset Walk', category: 'Relaxing', durationMinutes: 60, estimatedCost: 0 },
      { name: 'Kerala Ayurvedic Massage', category: 'Relaxing', durationMinutes: 90, estimatedCost: 1500 },
      { name: 'Toddyshop Local Food Tasting', category: 'Food', durationMinutes: 90, estimatedCost: 400 }
    ]
  },
  {
    name: 'Rishikesh',
    country: 'India',
    region: 'north',
    costIndex: 2,
    popularity: 89,
    imageUrl: 'https://images.unsplash.com/photo-1542856391-010fb87dcfed',
    activities: [
      { name: 'White Water Rafting (16km)', category: 'Adventure', durationMinutes: 240, estimatedCost: 1200 },
      { name: 'Ganga Aarti at Triveni Ghat', category: 'Culture', durationMinutes: 90, estimatedCost: 0 },
      { name: 'Bungee Jumping at Jumping Heights', category: 'Adventure', durationMinutes: 180, estimatedCost: 3500 },
      { name: 'Beatles Ashram Exploration', category: 'Culture', durationMinutes: 120, estimatedCost: 200 },
      { name: 'Yoga Class by the Ganges', category: 'Relaxing', durationMinutes: 90, estimatedCost: 300 }
    ]
  },
  {
    name: 'Pondicherry',
    country: 'India',
    region: 'south',
    costIndex: 2,
    popularity: 85,
    imageUrl: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220',
    activities: [
      { name: 'French Quarter Bicycle Tour', category: 'Sightseeing', durationMinutes: 120, estimatedCost: 350 },
      { name: 'Meditation at Auroville Matrimandir', category: 'Relaxing', durationMinutes: 180, estimatedCost: 0 },
      { name: 'Surfing at Serenity Beach', category: 'Adventure', durationMinutes: 120, estimatedCost: 1500 },
      { name: 'French Cafe Croissant Tasting', category: 'Food', durationMinutes: 60, estimatedCost: 300 },
      { name: 'Rock Beach Evening Walk', category: 'Relaxing', durationMinutes: 90, estimatedCost: 0 }
    ]
  },
  {
    name: 'Paris',
    country: 'France',
    region: 'europe',
    costIndex: 5,
    popularity: 98,
    imageUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34',
    activities: [
      { name: 'Eiffel Tower Summit Access', category: 'Sightseeing', durationMinutes: 150, estimatedCost: 2500 },
      { name: 'Louvre Museum Masterpieces Tour', category: 'Culture', durationMinutes: 240, estimatedCost: 1800 },
      { name: 'Seine River Cruise', category: 'Relaxing', durationMinutes: 75, estimatedCost: 1200 },
      { name: 'Macarons and Pastry Tasting', category: 'Food', durationMinutes: 90, estimatedCost: 1500 },
      { name: 'Champs-Élysées Walk & Arc de Triomphe', category: 'Shopping', durationMinutes: 120, estimatedCost: 1000 }
    ]
  },
  {
    name: 'London',
    country: 'UK',
    region: 'europe',
    costIndex: 5,
    popularity: 97,
    imageUrl: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad',
    activities: [
      { name: 'London Eye Flight', category: 'Sightseeing', durationMinutes: 45, estimatedCost: 3500 },
      { name: 'Tower of London & Crown Jewels', category: 'Culture', durationMinutes: 180, estimatedCost: 3000 },
      { name: 'British Museum Free Tour', category: 'Culture', durationMinutes: 150, estimatedCost: 0 },
      { name: 'West End Musical Show', category: 'Culture', durationMinutes: 180, estimatedCost: 5000 },
      { name: 'Afternoon Tea at The Ritz', category: 'Food', durationMinutes: 90, estimatedCost: 6500 }
    ]
  },
  {
    name: 'New York',
    country: 'USA',
    region: 'north america',
    costIndex: 5,
    popularity: 99,
    imageUrl: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9',
    activities: [
      { name: 'Empire State Building Observatory', category: 'Sightseeing', durationMinutes: 90, estimatedCost: 4200 },
      { name: 'Central Park Bicycle Rental', category: 'Relaxing', durationMinutes: 120, estimatedCost: 1500 },
      { name: 'Broadway Show Ticket', category: 'Culture', durationMinutes: 180, estimatedCost: 8000 },
      { name: 'Metropolitan Museum of Art', category: 'Culture', durationMinutes: 240, estimatedCost: 3000 },
      { name: 'New York Pizza Slice Walk', category: 'Food', durationMinutes: 60, estimatedCost: 600 }
    ]
  },
  {
    name: 'Tokyo',
    country: 'Japan',
    region: 'asia',
    costIndex: 4,
    popularity: 98,
    imageUrl: 'https://images.unsplash.com/photo-1540959733332-eab4deceeaf7',
    activities: [
      { name: 'Shibuya Crossing & Hachiko Statue', category: 'Sightseeing', durationMinutes: 60, estimatedCost: 0 },
      { name: 'Senso-ji Temple Asakusa Visit', category: 'Culture', durationMinutes: 90, estimatedCost: 0 },
      { name: 'Sushi Making Workshop', category: 'Food', durationMinutes: 150, estimatedCost: 6000 },
      { name: 'TeamLab Planets Digital Art Exhibition', category: 'Culture', durationMinutes: 120, estimatedCost: 3500 },
      { name: 'Harajuku Takeshita Street Shopping', category: 'Shopping', durationMinutes: 120, estimatedCost: 1000 }
    ]
  },
  {
    name: 'Singapore',
    country: 'Singapore',
    region: 'asia',
    costIndex: 4,
    popularity: 96,
    imageUrl: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd',
    activities: [
      { name: 'Gardens by the Bay Cloud Forest', category: 'Sightseeing', durationMinutes: 180, estimatedCost: 2000 },
      { name: 'Sentosa Island Cable Car & Beach', category: 'Relaxing', durationMinutes: 240, estimatedCost: 2500 },
      { name: 'Chinatown Hawker Center Food Tour', category: 'Food', durationMinutes: 120, estimatedCost: 800 },
      { name: 'Night Safari Experience', category: 'Adventure', durationMinutes: 240, estimatedCost: 4000 },
      { name: 'Orchard Road Shopping', category: 'Shopping', durationMinutes: 180, estimatedCost: 1000 }
    ]
  },
  {
    name: 'Bangkok',
    country: 'Thailand',
    region: 'asia',
    costIndex: 2,
    popularity: 95,
    imageUrl: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365',
    activities: [
      { name: 'Grand Palace & Emerald Buddha Tour', category: 'Culture', durationMinutes: 180, estimatedCost: 1200 },
      { name: 'Wat Arun River Boat Crossing', category: 'Sightseeing', durationMinutes: 60, estimatedCost: 150 },
      { name: 'Chatuchak Weekend Market Shopping', category: 'Shopping', durationMinutes: 240, estimatedCost: 500 },
      { name: 'Thai Street Food Tour by Tuk Tuk', category: 'Food', durationMinutes: 180, estimatedCost: 1500 },
      { name: 'Traditional Thai Massage', category: 'Relaxing', durationMinutes: 90, estimatedCost: 800 }
    ]
  },
  {
    name: 'Dubai',
    country: 'UAE',
    region: 'middle east',
    costIndex: 5,
    popularity: 96,
    imageUrl: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c',
    activities: [
      { name: 'Burj Khalifa 124th Floor View', category: 'Sightseeing', durationMinutes: 90, estimatedCost: 4000 },
      { name: 'Desert Safari with BBQ Dinner & Dune Bashing', category: 'Adventure', durationMinutes: 360, estimatedCost: 3500 },
      { name: 'Dubai Mall Aquarium & Fountain Show', category: 'Sightseeing', durationMinutes: 120, estimatedCost: 0 },
      { name: 'Jumeirah Beach Sunset Relax', category: 'Relaxing', durationMinutes: 90, estimatedCost: 0 },
      { name: 'Gold & Spice Souk Walking Tour', category: 'Shopping', durationMinutes: 120, estimatedCost: 200 }
    ]
  },
  {
    name: 'Sydney',
    country: 'Australia',
    region: 'oceania',
    costIndex: 5,
    popularity: 94,
    imageUrl: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9',
    activities: [
      { name: 'Sydney Opera House Guided Tour', category: 'Culture', durationMinutes: 60, estimatedCost: 2500 },
      { name: 'Bondi to Coogee Coastal Walk', category: 'Relaxing', durationMinutes: 180, estimatedCost: 0 },
      { name: 'Sydney Harbour Bridge Climb', category: 'Adventure', durationMinutes: 210, estimatedCost: 15000 },
      { name: 'Taronga Zoo Ferry & Entry', category: 'Sightseeing', durationMinutes: 240, estimatedCost: 3000 },
      { name: 'Darling Harbour Seafood Dinner', category: 'Food', durationMinutes: 120, estimatedCost: 3500 }
    ]
  },
  {
    name: 'Cape Town',
    country: 'South Africa',
    region: 'africa',
    costIndex: 3,
    popularity: 92,
    imageUrl: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f',
    activities: [
      { name: 'Table Mountain Cableway Flight', category: 'Sightseeing', durationMinutes: 120, estimatedCost: 1800 },
      { name: 'Cape of Good Hope Day Tour', category: 'Adventure', durationMinutes: 480, estimatedCost: 3500 },
      { name: 'Robben Island Museum Tour', category: 'Culture', durationMinutes: 240, estimatedCost: 2500 },
      { name: 'Boulders Beach Penguin Colony Visit', category: 'Sightseeing', durationMinutes: 90, estimatedCost: 800 },
      { name: 'V&A Waterfront Dinner & Shopping', category: 'Food', durationMinutes: 180, estimatedCost: 2000 }
    ]
  },
  {
    name: 'Rome',
    country: 'Italy',
    region: 'europe',
    costIndex: 4,
    popularity: 97,
    imageUrl: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5',
    activities: [
      { name: 'Colosseum & Roman Forum Guided Tour', category: 'Culture', durationMinutes: 180, estimatedCost: 2500 },
      { name: 'Vatican Museums & Sistine Chapel', category: 'Culture', durationMinutes: 240, estimatedCost: 2200 },
      { name: 'Trevi Fountain & Spanish Steps Walk', category: 'Sightseeing', durationMinutes: 90, estimatedCost: 0 },
      { name: 'Gelato Tasting & Pizza Making Masterclass', category: 'Food', durationMinutes: 180, estimatedCost: 3500 },
      { name: 'Trastevere Evening Food Stroll', category: 'Food', durationMinutes: 120, estimatedCost: 1500 }
    ]
  },
  {
    name: 'Barcelona',
    country: 'Spain',
    region: 'europe',
    costIndex: 3,
    popularity: 94,
    imageUrl: 'https://images.unsplash.com/photo-1583422409516-2895a77efedd',
    activities: [
      { name: 'Sagrada Família Inside Tour', category: 'Culture', durationMinutes: 120, estimatedCost: 2000 },
      { name: 'Park Güell Mosaic Exploration', category: 'Sightseeing', durationMinutes: 120, estimatedCost: 800 },
      { name: 'Tapas Tasting Tour in Gothic Quarter', category: 'Food', durationMinutes: 180, estimatedCost: 2500 },
      { name: 'La Rambla & La Boqueria Market Stroll', category: 'Shopping', durationMinutes: 90, estimatedCost: 0 },
      { name: 'Barceloneta Beach Relaxation', category: 'Relaxing', durationMinutes: 120, estimatedCost: 0 }
    ]
  },
  {
    name: 'Rio de Janeiro',
    country: 'Brazil',
    region: 'south america',
    costIndex: 3,
    popularity: 91,
    imageUrl: 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325',
    activities: [
      { name: 'Christ the Redeemer Train & Visit', category: 'Sightseeing', durationMinutes: 180, estimatedCost: 1500 },
      { name: 'Sugarloaf Mountain Cable Car', category: 'Sightseeing', durationMinutes: 120, estimatedCost: 1200 },
      { name: 'Copacabana Beach Walk & Coconut Water', category: 'Relaxing', durationMinutes: 90, estimatedCost: 100 },
      { name: 'Samba Dance Class in Lapa', category: 'Culture', durationMinutes: 120, estimatedCost: 800 },
      { name: 'Churrascaria Brazilian Steakhouse Dinner', category: 'Food', durationMinutes: 120, estimatedCost: 2000 }
    ]
  },
  {
    name: 'Cairo',
    country: 'Egypt',
    region: 'middle east',
    costIndex: 2,
    popularity: 93,
    imageUrl: 'https://images.unsplash.com/photo-1539650116574-8efeb43e2750',
    activities: [
      { name: 'Giza Pyramids & Sphinx Camel Tour', category: 'Culture', durationMinutes: 240, estimatedCost: 1000 },
      { name: 'Egyptian Museum Mummies Tour', category: 'Culture', durationMinutes: 180, estimatedCost: 800 },
      { name: 'Khan el-Khalili Bazaar Shopping', category: 'Shopping', durationMinutes: 120, estimatedCost: 200 },
      { name: 'Nile River Felucca Sunset Ride', category: 'Relaxing', durationMinutes: 90, estimatedCost: 500 },
      { name: 'Koshary Tasting (National Dish)', category: 'Food', durationMinutes: 45, estimatedCost: 100 }
    ]
  },
  {
    name: 'Istanbul',
    country: 'Turkey',
    region: 'europe',
    costIndex: 2,
    popularity: 95,
    imageUrl: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200',
    activities: [
      { name: 'Hagia Sophia & Blue Mosque Tour', category: 'Culture', durationMinutes: 150, estimatedCost: 0 },
      { name: 'Bosphorus Sunset Cruise', category: 'Relaxing', durationMinutes: 90, estimatedCost: 800 },
      { name: 'Grand Bazaar Shopping & Bargaining', category: 'Shopping', durationMinutes: 180, estimatedCost: 0 },
      { name: 'Traditional Turkish Bath (Hammal)', category: 'Relaxing', durationMinutes: 90, estimatedCost: 2000 },
      { name: 'Turkish Kebabs & Baklava Tasting', category: 'Food', durationMinutes: 90, estimatedCost: 500 }
    ]
  }
];

async function seed() {
  console.log('Seeding cities and activities into the database...');
  try {
    for (const city of cities) {
      // Upsert city
      const cityRes = await db.query(
        `INSERT INTO cities (name, country, region, cost_index, popularity, image_url)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (name, country) 
         DO UPDATE SET 
           region = EXCLUDED.region,
           cost_index = EXCLUDED.cost_index,
           popularity = EXCLUDED.popularity,
           image_url = EXCLUDED.image_url
         RETURNING id`,
        [city.name, city.country, city.region.toLowerCase(), city.costIndex, city.popularity, city.imageUrl]
      );
      
      const cityId = cityRes.rows[0].id;
      
      // Upsert activities
      for (const act of city.activities) {
        await db.query(
          `INSERT INTO activities (city_id, name, category, duration_minutes, estimated_cost)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (city_id, name)
           DO UPDATE SET
             category = EXCLUDED.category,
             duration_minutes = EXCLUDED.duration_minutes,
             estimated_cost = EXCLUDED.estimated_cost`,
          [cityId, act.name, act.category, act.durationMinutes, act.estimatedCost]
        );
      }
    }
    console.log(`Seeding complete. Seeding database with ${cities.length} cities and their activities successfully done!`);
  } catch (err) {
    console.error('Error seeding database:', err);
  } finally {
    await db.end();
  }
}

// If run directly
if (require.main === module) {
  seed();
}
