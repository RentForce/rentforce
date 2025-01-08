import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PaymentHistory = ({ navigation }) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;

  const fetchPaymentHistory = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      const token = await AsyncStorage.getItem('userToken');
      
      const response = await axios.get(
        `${apiUrl}/user/${userId}/payment-history`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      // Sort payments by date, with most recent first
      const sortedPayments = response.data.sort((a, b) => 
        new Date(b.bookingDate) - new Date(a.bookingDate)
      );
      
      setPayments(sortedPayments);
    } catch (error) {
      console.error('Error fetching payment history:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPaymentHistory();
  }, []);

  // Add a focus listener to refresh data when screen is focused
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchPaymentHistory();
    });

    // Cleanup subscription on unmount
    return unsubscribe;
  }, [navigation]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPaymentHistory();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const updatePaymentStatus = async (bookingId) => {
    try {
      const response = await axios.put(`${apiUrl}/posts/booking/${bookingId}/payment-status`, {
        isPaid: true
      });
      
      // Refresh the payment history after successful update
      await fetchPaymentHistory();
      
    } catch (error) {
      console.error('Error updating payment status:', error);
      // Handle error appropriately in your UI
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2D5A27" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#F1EFEF" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {payments.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={64} color="#ccc" />
            <Text style={styles.emptyStateText}>No payment history found</Text>
          </View>
        ) : (
          payments.map((payment, index) => (
            <View key={index} style={styles.paymentCard}>
              <View style={styles.paymentHeader}>
                <Text style={styles.propertyName}>{payment.propertyDetails.title}</Text>
                <Text style={[styles.status, 
                  { color: payment.isPaid ? '#2D5A27' : '#F76707' }]}>
                  {payment.isPaid ? 'Paid' : 'confirmed'}
                </Text>
              </View>
              
              <View style={styles.paymentDetails}>
                <Text style={styles.dateText}>
                  {formatDate(payment.bookingDate)}
                </Text>
                <Text style={styles.amountText}>
                  ${payment.totalPrice.toFixed(2)}
                </Text>
              </View>

              <View style={styles.bookingDetails}>
                <Text style={styles.detailText}>
                  Check-in: {formatDate(payment.checkInDate)}
                </Text>
                <Text style={styles.detailText}>
                  Check-out: {formatDate(payment.checkOutDate)}
                </Text>
                <Text style={styles.detailText}>
                  Guests: {payment.numberOfGuests}
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1EFEF',
  },
  headerContainer: {
    paddingTop: 35,
    paddingHorizontal: 20,
    paddingBottom: 0,
  },
  backButton: {
    backgroundColor: '#082631',
    borderRadius: 20,
    padding: 8,
    alignSelf: 'flex-start',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  paymentCard: {
    backgroundColor: '#F1EFEF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#082631',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#082631',
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  propertyName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#082631',
    flex: 1,
  },
  status: {
    fontSize: 14,
    fontWeight: '500',
  },
  paymentDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#082631',
  },
  dateText: {
    fontSize: 14,
    color: '#082631',
  },
  amountText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#082631',
  },
  bookingDetails: {
    marginTop: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#082631',
    marginBottom: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F1EFEF',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#082631',
    marginTop: 16,
  },
});

export default PaymentHistory;
