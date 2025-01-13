const productData = {
  features: [
    "Property Listings: Browse through a wide variety of properties including houses, apartments, villas, hotels, historical buildings, and more",
    "Advanced Search: Filter properties by location, price range, property type, and amenities",
    "Real-time Chat: Communicate directly with property owners or renters through our built-in chat system",
    "Video Calls: Conduct virtual property tours using our integrated Jitsi Meet video call feature",
    "Secure Booking: Make secure payments and manage your bookings through our platform",
    "Favorites: Save your favorite properties for quick access later",
    "User Profiles: Manage your personal profile, view your booking history, and track your favorite properties",
    "Property Management: For owners - list properties, manage bookings, and communicate with potential renters",
    "Reviews and Ratings: Leave and read reviews about properties and users",
    "Location Services: View properties on a map and search by location"
  ],
  faqs: [
    {
      question: "How do I book a property?",
      answer: "To book a property: 1) Browse and select a property 2) Check availability for your desired dates 3) Click 'Book Now' 4) Enter guest details and confirm 5) Complete the payment process 6) Receive booking confirmation. You'll get instant confirmation for most properties, though some may require owner approval."
    },
    {
      question: "How do I contact a property owner?",
      answer: "You can contact property owners in several ways: 1) Use our built-in chat system by clicking the chat icon on any property listing 2) Schedule a video call for a virtual tour through our Jitsi Meet integration 3) Send inquiries about availability and specific questions about the property 4) All communication is kept secure within our platform for your safety."
    },
    {
      question: "What payment methods are accepted?",
      answer: "We accept all major credit/debit cards through our secure Stripe payment system. Your payment details are encrypted and never stored on our servers. Full payment is required at booking to secure your reservation. For long-term rentals, we also offer monthly payment plans."
    },
    {
      question: "How do I list my property?",
      answer: "To list your property: 1) Create an account and verify your identity 2) Go to your profile and click 'Add Property' 3) Fill in detailed property information including description, location, pricing, and house rules 4) Upload high-quality photos and videos 5) Set your availability calendar 6) Choose instant booking or manual approval 7) Submit for review. Our team will verify your listing within 24 hours."
    },
    {
      question: "How does the video call feature work?",
      answer: "Our video call feature uses Jitsi Meet for high-quality virtual property tours. To use it: 1) Schedule a tour time with the property owner through chat 2) Click the video call icon at the scheduled time 3) Join the secure video meeting 4) Take a virtual walk-through of the property 5) Ask questions in real-time. This feature works on both desktop and mobile devices."
    },
    {
      question: "What happens if I need to cancel my booking?",
      answer: "Our cancellation policies vary by property type and length of stay. Most properties offer: 1) Full refund if cancelled within 48 hours of booking 2) Full refund if cancelled 14+ days before check-in 3) Partial refund if cancelled 7-14 days before check-in. Check the specific cancellation policy on each property listing before booking."
    },
    {
      question: "How do reviews and ratings work?",
      answer: "Our review system helps maintain quality and trust: 1) Both renters and owners can leave reviews after a stay 2) Reviews include ratings for cleanliness, communication, accuracy, and overall experience 3) Reviews can't be edited or deleted to ensure authenticity 4) Properties with consistently high ratings get featured placement 5) Users must have completed a stay to leave a review."
    },
    {
      question: "What security measures do you have?",
      answer: "We prioritize your security with: 1) Verified user profiles for both renters and owners 2) Secure payment processing through Stripe 3) In-platform messaging to protect your privacy 4) Property verification process 5) 24/7 customer support 6) Secure video calls for virtual tours 7) Regular property quality checks 8) Protected personal and payment information."
    },
    {
      question: "How do I use the advanced search?",
      answer: "Our advanced search helps you find the perfect property: 1) Enter your desired location and dates 2) Filter by property type (house, apartment, villa, hotel) 3) Set your price range 4) Choose specific amenities you need 5) Filter by rating or superhost status 6) Sort by price, rating, or location 7) Use the map view to see property locations 8) Save your search preferences for future use."
    },
    {
      question: "What if I have issues during my stay?",
      answer: "If you encounter any issues: 1) Contact the property owner through our chat system 2) If unresolved, use our 24/7 support available in English, French, and Arabic 3) Use the 'Report Issue' button in your booking details 4) Our support team will respond within 1 hour 5) We can help arrange alternative accommodation if necessary 6) All bookings include basic protection against major issues."
    }
  ],
  propertyTypes: [
    {
      type: "House",
      description: "Full residential properties with private entrances and complete amenities. Perfect for families or groups wanting privacy and space. Includes gardens, parking, and full kitchen facilities."
    },
    {
      type: "Apartment",
      description: "Self-contained units in residential buildings, perfect for urban stays. Ranging from studios to multi-bedroom units, featuring modern amenities and often including access to building facilities."
    },
    {
      type: "Villa",
      description: "Luxury standalone properties, often with private pools and gardens. Ideal for premium stays, events, or large family gatherings. Complete with high-end amenities and often including staff services."
    },
    {
      type: "Hotel",
      description: "Professional hospitality accommodations with standard hotel services. Includes daily housekeeping, front desk service, and often featuring restaurants, gyms, and business facilities."
    },
    {
      type: "Historical",
      description: "Unique properties with architectural and historical significance. Carefully preserved while offering modern comforts. Experience authentic local heritage with modern amenities."
    }
  ],
  policies: {
    booking: "Instant booking available for most properties. Some may require owner approval. Verification required for first-time bookers. Special conditions may apply for long-term stays or large groups.",
    payment: "Secure payment through Stripe. Full payment required at booking. Monthly payment plans available for long-term stays. All transactions are encrypted and protected.",
    cancellation: "Flexible, Moderate, and Strict policies available depending on property. Full refund options available if cancelled early. Property-specific policies clearly displayed on listing.",
    security: "All users verified through ID verification. Properties regularly reviewed for quality and safety. 24/7 support team available. Secure messaging and payment systems."
  },
  support: {
    availableHours: "24/7 through chat assistant",
    responseTime: "Usually within 1 hour",
    emergencyContact: "Available through the app's help center",
    languages: ["English", "French", "Arabic"],
    supportTypes: [
      "Booking assistance",
      "Payment issues",
      "Property concerns",
      "Technical support",
      "Emergency situations",
      "Dispute resolution"
    ]
  }
};

module.exports = productData;