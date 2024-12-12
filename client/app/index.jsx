import * as React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
// import ProfileScreen from "./profile/ProfileScreen.jsx";
// import PersonalScreen from "./profile/PersonalScreen.jsx";
import Home from "./Home/Home.jsx";
import HomeDetails from "./Home/HomeDetails.jsx";
// import Login from './Auth/Login';
// import SignUpScreen from './Auth/Sign-up';
const Stack = createNativeStackNavigator();

function App() {
  return (
    <Stack.Navigator>
      {/* <Stack.Screen name="Screen1" component={Login} />
        <Stack.Screen name="Screen2" component={SignUpScreen} /> */}
      <Stack.Screen name="Home" component={Home} />
      <Stack.Screen name="HomeDetails" component={HomeDetails} />
    </Stack.Navigator>
  );
}

export default App;
