import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProfileScreen from "./profile/ProfileScreen.jsx";
import PersonalScreen from "./profile/PersonalScreen.jsx";
import ShowProfile from "./profile/showprofile"
import CreatePost from './profile/CreatePost.jsx';

import Login from './Auth/Login';
import SignUpScreen from './Auth/Sign-up';
import ForgetPassword from './Auth/Forget';
import ResetPassword from './Auth/reset';
import Favourites from './favourites/Favourites.jsx';
const Stack = createNativeStackNavigator();

function App() {
  return (
<Stack.Navigator>
        <Stack.Screen name="favourites" component={Favourites} options={{ headerShown: false }} />
        {/* <Stack.Screen name="login" component={Login} options={{ headerShown: false }} />
        <Stack.Screen name="forget" component={ForgetPassword} options={{ headerShown: false }} />
        <Stack.Screen name="reset" component={ResetPassword} options={{ headerShown: false }} />
        <Stack.Screen name="profile" component={ProfileScreen} options={{ headerShown: false }} />
        <Stack.Screen name="personal" component={PersonalScreen} options={{ headerShown: false }} />
        <Stack.Screen name="showprofile" component={ShowProfile} options={{ headerShown: false }} />
        <Stack.Screen name="CreatePost" component={CreatePost} options={{ headerShown: false }} />
        <Stack.Screen name="signup" component={SignUpScreen} options={{ headerShown: false }} /> */}





      </Stack.Navigator>
   
  );
}

export default App;