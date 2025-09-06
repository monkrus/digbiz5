import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Card, Paragraph, Title } from 'react-native-paper';

export function HomeScreen() {
  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title>Welcome to DigBiz!</Title>
          <Paragraph>
            Your digital business solution is ready with all core dependencies
            configured:
          </Paragraph>
          <Paragraph>
            ✓ React Navigation for routing{'\n'}✓ React Native Paper for UI
            components{'\n'}✓ Redux Toolkit for state management{'\n'}✓ React
            Hook Form for form handling{'\n'}✓ React Native MMKV for secure
            storage{'\n'}✓ React Native Config for environment variables
          </Paragraph>
        </Card.Content>
        <Card.Actions>
          <Button
            mode="contained"
            onPress={() => console.log('Getting started!')}
          >
            Get Started
          </Button>
        </Card.Actions>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  card: {
    elevation: 4,
  },
});
