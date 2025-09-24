import React from "react";

// Mock react-native
jest.mock("react-native", () => {
  const RN = jest.requireActual("react-native");
  return {
    ...RN,
    StyleSheet: {
      ...RN.StyleSheet,
      flatten: (style: any) => style || {},
    },
  };
});

// Mock react-native-gesture-handler
jest.mock("react-native-gesture-handler", () => ({
  Directions: {},
  State: {},
  PanGestureHandler: "PanGestureHandler",
  TapGestureHandler: "TapGestureHandler",
  FlingGestureHandler: "FlingGestureHandler",
  ForceTouchGestureHandler: "ForceTouchGestureHandler",
  LongPressGestureHandler: "LongPressGestureHandler",
  PinchGestureHandler: "PinchGestureHandler",
  RotationGestureHandler: "RotationGestureHandler",
  /* Buttons */
  RawButton: "RawButton",
  BaseButton: "BaseButton",
  RectButton: "RectButton",
  BorderlessButton: "BorderlessButton",
  /* Other */
  FlatList: "FlatList",
  ScrollView: "ScrollView",
  Switch: "Switch",
  TextInput: "TextInput",
  ToolbarAndroid: "ToolbarAndroid",
  ViewPagerAndroid: "ViewPagerAndroid",
  DrawerLayoutAndroid: "DrawerLayoutAndroid",
  WebView: "WebView",
}));

// Mock react-native-paper
jest.mock("react-native-paper", () => {
  const React = require("react");

  const mockComponent = (name: string) => {
    const Component = ({ children, ...props }: any) => {
      return React.createElement(
        "div",
        { ...props, "data-testid": props.testID },
        children
      );
    };
    Component.displayName = name;
    return Component;
  };

  return {
    Provider: ({ children }: { children: React.ReactNode }) => children,
    Portal: ({ children }: { children: React.ReactNode }) => children,
    Text: mockComponent("Text"),
    Button: ({ onPress, children, loading, disabled, testID, ...props }: any) =>
      React.createElement(
        "button",
        {
          onClick: onPress,
          disabled: disabled || loading,
          "data-testid": testID,
          ...props,
        },
        children
      ),
    TextInput: ({ onChangeText, value, testID, ...props }: any) =>
      React.createElement("input", {
        onChange: (e: any) => onChangeText && onChangeText(e.target.value),
        value,
        "data-testid": testID,
        ...props,
      }),
    Card: Object.assign(mockComponent("Card"), {
      Content: mockComponent("CardContent"),
    }),
    IconButton: ({ onPress, icon, testID, disabled, ...props }: any) =>
      React.createElement(
        "button",
        {
          onClick: onPress,
          disabled,
          "data-testid": testID,
          ...props,
        },
        icon
      ),
    FAB: ({ onPress, icon, testID, ...props }: any) =>
      React.createElement(
        "button",
        {
          onClick: onPress,
          "data-testid": testID,
          ...props,
        },
        icon
      ),
    Dialog: Object.assign(mockComponent("Dialog"), {
      Title: mockComponent("DialogTitle"),
      Content: mockComponent("DialogContent"),
      Actions: mockComponent("DialogActions"),
    }),
    Snackbar: ({ children, visible, onDismiss }: any) =>
      visible
        ? React.createElement("div", { onClick: onDismiss }, children)
        : null,
    ActivityIndicator: mockComponent("ActivityIndicator"),
    Checkbox: ({ onPress, status, ...props }: any) =>
      React.createElement("input", {
        type: "checkbox",
        checked: status === "checked",
        onChange: onPress,
        role: "checkbox",
        ...props,
      }),
    Chip: ({ children, onPress, ...props }: any) =>
      React.createElement("button", { onClick: onPress, ...props }, children),
    Title: mockComponent("Title"),
    HelperText: ({ children, visible, ...props }: any) =>
      visible ? React.createElement("div", props, children) : null,
    Divider: mockComponent("Divider"),
  };
});

// Mock AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

// Mock environment variables
process.env.EXPO_PUBLIC_FIREBASE_API_KEY = "test-api-key";
process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN = "test.firebaseapp.com";
process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID = "test-project";
process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET = "test-project.appspot.com";
process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = "123456789";
process.env.EXPO_PUBLIC_FIREBASE_APP_ID = "1:123456789:web:abcdef";

// Silence console warnings in tests
// 🚨 CRITICAL: This console mocking pattern MUST NOT be changed by autofix tools!
// Using a more autofix-resistant pattern to prevent recurring TypeScript compilation failures
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const globalAny = globalThis as any;
const originalConsole = globalAny.console;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
globalAny.console = {
  ...originalConsole,
  warn: jest.fn(),
  error: jest.fn(),
};
