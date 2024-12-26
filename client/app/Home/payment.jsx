import React, { useEffect, useState } from 'react';
import { View, Button, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import { StripeProvider, useStripe } from '@stripe/stripe-react-native';
import axios from 'axios';

export default function Payment({ route, navigation }) {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [isPaymentSheetInitialized, setPaymentSheetInitialized] = useState(false);
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;
  
  // Get booking details from route params
  const { amount, bookingId } = route.params || {};

  useEffect(() => {
    async function createPaymentIntent() {
      try {
        const response = await fetch(`${apiUrl}/create-payment-intent`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            amount: amount * 100, // Convert to cents
            bookingId: bookingId // Pass bookingId to backend
          }), 
        });

        if (!response.ok) {
          Alert.alert('Error', 'Failed to create payment intent');
          return;
        }

        const { clientSecret } = await response.json();

        const { error } = await initPaymentSheet({
          paymentIntentClientSecret: clientSecret,
          merchantDisplayName: 'Your Company Name',
        });

        if (error) {
          Alert.alert('Initialization Error', error.message);
        } else {
          setPaymentSheetInitialized(true);
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to create payment intent');
        console.error(error);
      }
    }

    if (amount && bookingId) {
      createPaymentIntent();
    }
  }, [amount, bookingId, initPaymentSheet]);

  const handlePayment = async () => {
    if (!isPaymentSheetInitialized) {
      Alert.alert('Not Ready', 'Payment sheet is not initialized yet');
      return;
    }
    
    const { error } = await presentPaymentSheet();
    if (error) {
      Alert.alert('Payment Failed', error.message);
    } else {
      Alert.alert(
        'Success', 
        'Payment successful!',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('notifications')
          }
        ]
      );
    }
  };

  return (
    <StripeProvider publishableKey="pk_test_51QWZjFIMfjBRRWpmKbgRGRyIP0AkhnlogSBIQrghezlopGqI51F93A0KQPbSnNnQxfxPEASVihFurfKZjxuZxZ9N009imbaotE">
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Complete Your Payment</Text>
          <Text style={styles.subtitle}>Total Amount: ${amount?.toFixed(2)}</Text>
          
          <TouchableOpacity 
            style={[
              styles.payButton, 
              !isPaymentSheetInitialized && styles.payButtonDisabled
            ]}
            onPress={handlePayment}
            disabled={!isPaymentSheetInitialized}
          >
            <Text style={styles.payButtonText}>
              {isPaymentSheetInitialized ? 'Pay Now' : 'Initializing...'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </StripeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f4f4',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  payButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  payButtonDisabled: {
    backgroundColor: '#A9A9A9',
  },
  payButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});