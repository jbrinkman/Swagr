// Mock React Native for Jest tests
import { View, Text, TouchableOpacity, ScrollView, FlatList } from 'react-native-web';

const mockComponent = (name) => {
    const Component = (props) => {
        const { children, ...otherProps } = props;
        return React.createElement(name, otherProps, children);
    };
    Component.displayName = name;
    return Component;
};

export const Alert = {
    alert: jest.fn(),
};

export const StyleSheet = {
    create: (styles) => styles,
};

export const RefreshControl = mockComponent('RefreshControl');

export { View, Text, TouchableOpacity, ScrollView, FlatList };

// Mock other React Native components as needed
export default {
    Alert,
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    FlatList,
    RefreshControl,
};