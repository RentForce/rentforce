<<<<<<< HEAD
import * as React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
=======
import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProfileScreen from "./profile/ProfileScreen.jsx";
import PersonalScreen from "./profile/PersonalScreen.jsx";
import ShowProfile from "./profile/showprofile"
import CreatePost from './profile/CreatePost.jsx';
>>>>>>> adb019bab6de4320c25ec0c210501ccb6002d55e
// import ProfileScreen from "./profile/ProfileScreen.jsx";
// import PersonalScreen from "./profile/PersonalScreen.jsx";
import Home from "./Home/Home.jsx";
import HomeDetails from "./Home/HomeDetails.jsx";
// import Login from './Auth/Login';
// import SignUpScreen from './Auth/Sign-up';
const Stack = createNativeStackNavigator();

function App() {
  return (
<<<<<<< HEAD
    <Stack.Navigator>
      {/* <Stack.Screen name="Screen1" component={Login} />
        <Stack.Screen name="Screen2" component={SignUpScreen} /> */}
      <Stack.Screen name="Home" component={Home} />
      <Stack.Screen name="HomeDetails" component={HomeDetails} />
    </Stack.Navigator>
=======

      <Stack.Navigator initialRouteName="Login" >
        <Stack.Screen name="Login" component={Login} options={{ headerShown: false }}/> 
        <Stack.Screen name="Screen1" component={ProfileScreen} options={{ headerShown: false }}/>
        <Stack.Screen name="Screen2" component={PersonalScreen} options={{ headerShown: true }}/>
        <Stack.Screen name="ShowProfile" component={ShowProfile} options={{ headerShown: false }}/> 
        <Stack.Screen name="Signup" component={SignUpScreen} options={{ headerShown: false }}/> 
        <Stack.Screen name="CreatePost" component={CreatePost} options={{ headerShown: false }}/> 

      </Stack.Navigator>
   
>>>>>>> adb019bab6de4320c25ec0c210501ccb6002d55e
  );
}

export default App;
