import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProfileScreen from "./profile/ProfileScreen.jsx";
import PersonalScreen from "./profile/PersonalScreen.jsx";
import ShowProfile from "./profile/showprofile"
import CreatePost from './profile/CreatePost.jsx';
// import ProfileScreen from "./profile/ProfileScreen.jsx";
// import PersonalScreen from "./profile/PersonalScreen.jsx";
import Login from './Auth/Login';
import SignUpScreen from './Auth/Sign-up';
const Stack = createNativeStackNavigator();

function App() {
  return (

      <Stack.Navigator initialRouteName="Login" >
        <Stack.Screen name="Login" component={Login} options={{ headerShown: false }}/> 
        <Stack.Screen name="Screen1" component={ProfileScreen} options={{ headerShown: false }}/>
        <Stack.Screen name="Screen2" component={PersonalScreen} options={{ headerShown: true }}/>
        <Stack.Screen name="ShowProfile" component={ShowProfile} options={{ headerShown: false }}/> 
        <Stack.Screen name="Signup" component={SignUpScreen} options={{ headerShown: false }}/> 
        <Stack.Screen name="CreatePost" component={CreatePost} options={{ headerShown: false }}/> 

      </Stack.Navigator>
   
  );
}

export default App;