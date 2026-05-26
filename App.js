import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { registerRootComponent } from "expo";
import HomeScreen from "./screens/HomeScreen";
import IssueDetailScreen from "./screens/IssueDetailScreen";
import IssuesListScreen from "./screens/IssuesListScreen";
import SuccessScreen from "./screens/SuccessScreen";
import SurveyScreen from "./screens/SurveyScreen";
import TaskDetailScreen from "./screens/TaskDetailScreen";
import TaskListScreen from "./screens/TaskListScreen";

const Stack = createNativeStackNavigator();

function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="TaskList" component={TaskListScreen} />
        <Stack.Screen name="TaskDetail" component={TaskDetailScreen} />
        <Stack.Screen name="Survey" component={SurveyScreen} />
        <Stack.Screen name="Success" component={SuccessScreen} />
        <Stack.Screen name="IssuesList" component={IssuesListScreen} />
        <Stack.Screen name="IssueDetail" component={IssueDetailScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

registerRootComponent(App);

export default App;
