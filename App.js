// TEMPORARY: confirms Firebase is configured. Replaced in the navigation step.
import { Text, View } from 'react-native';
import { auth } from './src/services/firebase';

export default function App() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 22, fontWeight: 'bold' }}>SplitBTN</Text>
      <Text>Firebase project: {auth.app.options.projectId}</Text>
    </View>
  );
}