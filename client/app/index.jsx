import * as React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { LogBox } from 'react-native';
import ProfileScreen from "./profile/ProfileScreen.jsx";
import PersonalScreen from "./profile/PersonalScreen.jsx";
import ShowProfile from "./profile/showprofile";
import CreatePost from "./profile/CreatePost.jsx";
import ChatSelectionScreen from "./chat/ChatSelectionScreen.jsx";
import ChatScreen from "../app/chat/Chat.jsx";
import Login from "./Auth/Login";
import SignUpScreen from "./Auth/Sign-up";
import ForgetPassword from "./Auth/Forget";
import ResetPassword from "./Auth/reset";
import Favourites from "./favourites/Favourites.jsx";
import Home from "./Home/Home.jsx";
import HomeDetails from "./Home/HomeDetails.jsx";
import BookingPage from "./Home/BookingPage";
import pay from "./Home/payment.jsx";
import { NotificationProvider } from "./chat/Notifications.jsx";
import NotificationScreen from "./notifications/NotificationScreen.jsx";
import PaymentHistory from "./profile/PaymentHistory.jsx";
import AboutUsScreen from "./profile/AboutUsScreen.jsx";
import Welcome from "./LandingPage/Welcome.jsx";
import LogoPage from "./LandingPage/LogoPage.jsx";

// Ignore navigation warnings
LogBox.ignoreLogs([
  'The action "NAVIGATE" with payload {"name":"Login"} was not handled by any navigator.',
  'Non-serializable values were found in the navigation state',
]);

const Stack = createNativeStackNavigator();

function App() {
  return (
    <NotificationProvider>
      <Stack.Navigator>
        <Stack.Screen
          name="LogoPage"
          component={LogoPage}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Welcome"
          component={Welcome}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="signup"
          component={SignUpScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="login"
          component={Login}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Home"
          component={Home}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="HomeDetails"
          component={HomeDetails}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="favourites"
          component={Favourites}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="forget"
          component={ForgetPassword}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="reset"
          component={ResetPassword}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="profile"
          component={ProfileScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="personal"
          component={PersonalScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="showprofile"
          component={ShowProfile}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="CreatePost"
          component={CreatePost}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Booking"
          component={BookingPage}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="payment"
          component={pay}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ChatSelectionScreen"
          component={ChatSelectionScreen}
          options={{ title: "Select User" }}
        />
          <Stack.Screen 
        name="ChatScreen" 
        component={ChatScreen}
        options={({ route }) => ({ 
          title: `${route.params.otherUser.firstName} ${route.params.otherUser.lastName}` 
        })}
      />
   
        <Stack.Screen
          name="notifications"
          component={NotificationScreen}
          options={{ headerShown: false, title: "Notifications" }}
        />
        <Stack.Screen name="PaymentHistory" component={PaymentHistory} options={{ headerShown: false }}/>
    <Stack.Screen 
      name="AboutUs" 
      component={AboutUsScreen} 
      options={{ 
        headerShown: false 
      }} 
      />
      </Stack.Navigator>
    </NotificationProvider>

  );
}

export default App;
