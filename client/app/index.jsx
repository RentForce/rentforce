import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProfileScreen from "./profile/ProfileScreen.jsx";
import PersonalScreen from "./profile/PersonalScreen.jsx";
import ShowProfile from "./profile/showprofile"

const Stack = createNativeStackNavigator();

function App() {
  return (

      <Stack.Navigator>
        <Stack.Screen name="Screen1" component={ProfileScreen} />
        <Stack.Screen name="Screen2" component={PersonalScreen} />
        <Stack.Screen name="ShowProfile" component={ShowProfile} /> 

      </Stack.Navigator>
   
  );
}

export default App;