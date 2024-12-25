// NotificationBadge.jsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNotifications } from './Notifications';

export const NotificationBadge = () => {
  const { unreadCount } = useNotifications();

  if (unreadCount === 0) return null;

  return (
    <View style={styles.badge}>
      <Text style={styles.count}>
        {unreadCount > 99 ? '99+' : unreadCount}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'red',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fff',
    zIndex: 1,
  },
  count: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 4,
  }
});