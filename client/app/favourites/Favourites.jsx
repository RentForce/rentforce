import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, Image } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import jwtDecode from 'jwt-decode';

const Favourites = ({ navigation }) => {
  const [favouritePosts, setFavouritePosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFavourites = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        if (!token) {
          throw new Error('User token not found');
        }

        // const decodedToken = jwtDecode(token);
        // const userId = decodedToken.id; // Extract user ID from the token

        const userId = 1; // Hardcoded user ID for testing

        const response = await axios.get(`http://192.168.104.13:5000/user/favourites/${userId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        setFavouritePosts(response.data);
      } catch (err) {
        console.error('Error fetching favourites:', err);
        setError(err.message || 'Failed to fetch favourites');
      } finally {
        setLoading(false);
      }
    };

    fetchFavourites();
  }, []);

  const handleRemoveFavourite = async (postId) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error('User token not found');
      }

      // const decodedToken = jwtDecode(token);
      // const userId = decodedToken.id; // Extract user ID from the token

      const userId = 1; // Hardcoded user ID for testing

      await axios.delete(`http://192.168.104.13:5000/user/favourites`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      setFavouritePosts(favouritePosts.filter(post => post.id !== postId));
      Alert.alert('Success', 'Post removed from favourites');
    } catch (err) {
      console.error('Error removing favourite:', err);
      Alert.alert('Error', 'Failed to remove post from favourites');
    }
  };

  if (loading) {
    return <Text style={styles.loadingText}>Loading...</Text>;
  }

  if (error) {
    return <Text style={styles.errorText}>Error: {error}</Text>;
  }

  return (
    <View style={styles.container}>
      {favouritePosts.length === 0 ? (
        <Text style={styles.emptyMessage}>No favourite posts available. Start adding some!</Text>
      ) : (
        <FlatList
          data={favouritePosts}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.postContainer}>
              <Image source={{ uri: item.image }} style={styles.postImage} />
              <View style={styles.textContainer}>
                <Text style={styles.postTitle}>{item.title}</Text>
                <Text style={styles.postLocation}>{item.location}</Text>
              </View>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => handleRemoveFavourite(item.id)}
              >
                <Text style={styles.removeButtonText}>Remove</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f0f0f0',
  },
  postContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  postImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  postTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  postLocation: {
    fontSize: 14,
    color: '#777',
  },
  removeButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#ff4d4d',
    borderRadius: 20,
  },
  removeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#777',
  },
  errorText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#ff4d4d',
  },
  emptyMessage: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#777',
  },
});

export default Favourites;












// import React, { useEffect, useState } from 'react';
// import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
// import axios from 'axios';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { jwtDecode } from 'jwt-decode';

// const Favourites = ({ navigation }) => {
//   const [favouritePosts, setFavouritePosts] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     const fetchFavourites = async () => {
//       try {
//         const token = await AsyncStorage.getItem('userToken');
//         if (!token) {
//           throw new Error('User token not found');
//         }

//         const decodedToken = jwtDecode(token);
//         const userId = decodedToken.id;

//         const response = await axios.get(`http://192.168.11.149:5000/user/favourites/${userId}`, {
//           headers: {
//             'Authorization': `Bearer ${token}`,
//             'Content-Type': 'application/json',
//           },
//         });
//         setFavouritePosts(response.data);
//       } catch (err) {
//         console.error('Error fetching favourites:', err);
//         setError(err.message || 'Failed to fetch favourites');
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchFavourites();
//   }, []);

//   const handleRemoveFavourite = async (postId) => {
//     try {
//       const token = await AsyncStorage.getItem('userToken');
//       if (!token) {
//         throw new Error('User token not found');
//       }

//       const decodedToken = jwtDecode(token);
//       const userId = decodedToken.id;

//       await axios.delete(`http://192.168.11.149:5000/user/${userId}/favourites/${postId}`, {
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json',
//         },
//       });
//       setFavouritePosts(favouritePosts.filter(post => post.id !== postId));
//       Alert.alert('Success', 'Post removed from favourites');
//     } catch (err) {
//       console.error('Error removing favourite:', err);
//       Alert.alert('Error', 'Failed to remove post from favourites');
//     }
//   };

//   if (loading) {
//     return <Text>Loading...</Text>;
//   }

//   if (error) {
//     return <Text>Error: {error}</Text>;
//   }

//   return (
//     <View style={styles.container}>
//       <FlatList
//         data={favouritePosts}
//         keyExtractor={(item) => item.id.toString()}
//         renderItem={({ item }) => (
//           <View style={styles.postContainer}>
//             <Text style={styles.postTitle}>{item.title}</Text>
//             <TouchableOpacity
//               style={styles.removeButton}
//               onPress={() => handleRemoveFavourite(item.id)}
//             >
//               <Text style={styles.removeButtonText}>Remove</Text>
//             </TouchableOpacity>
//           </View>
//         )}
//       />
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     padding: 16,
//     backgroundColor: '#fff',
//   },
//   postContainer: {
//     marginBottom: 16,
//     padding: 16,
//     backgroundColor: '#f9f9f9',
//     borderRadius: 8,
//   },
//   postTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//   },
//   removeButton: {
//     marginTop: 8,
//     padding: 8,
//     backgroundColor: '#ff4d4d',
//     borderRadius: 4,
//   },
//   removeButtonText: {
//     color: '#fff',
//     textAlign: 'center',
//   },
// });

// export default Favourites;