import { jest } from '@jest/globals';
import React from 'react';

const mockComponent = (name) => {
    const Component = (props) => {
        const { children, ...otherProps } = props;
        return React.createElement(name, otherProps, children);
    };
    Component.displayName = name;
    return Component;
};

export const View = mockComponent('View');
export const Text = mockComponent('Text');
export const TouchableOpacity = mockComponent('TouchableOpacity');
export const ScrollView = mockComponent('ScrollView');
export const FlatList = mockComponent('FlatList');
export const TextInput = mockComponent('TextInput');
export const ActivityIndicator = mockComponent('ActivityIndicator');
export const RefreshControl = mockComponent('RefreshControl');
export const KeyboardAvoidingView = mockComponent('KeyboardAvoidingView');

export const StyleSheet = {
    create: (styles) => styles,
};

export const Platform = {
    OS: 'ios',
    select: (options) => options.ios || options.default,
};

export const Alert = {
    alert: jest.fn(),
};

export const Dimensions = {
    get: jest.fn(() => ({ width: 375, height: 812 })),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
};

export default {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    FlatList,
    TextInput,
    ActivityIndicator,
    RefreshControl,
    KeyboardAvoidingView,
    StyleSheet,
    Platform,
    Alert,
    Dimensions,
};