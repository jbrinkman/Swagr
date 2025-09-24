import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Menu, Button, Text, ActivityIndicator } from 'react-native-paper';
import { Year } from '../types';

interface YearSelectorProps {
  years: Year[];
  selectedYear: Year | null;
  onYearSelect: (year: Year) => void;
  loading?: boolean;
  disabled?: boolean;
}

/**
 * YearSelector component provides a dropdown menu for selecting years
 * Shows/hides based on available years and handles year switching
 */
const YearSelector: React.FC<YearSelectorProps> = ({
  years,
  selectedYear,
  onYearSelect,
  loading = false,
  disabled = false,
}) => {
  const [menuVisible, setMenuVisible] = useState(false);

  // Don't show dropdown if there's only one year or no years
  const shouldShowDropdown = years.length > 1;

  const openMenu = () => setMenuVisible(true);
  const closeMenu = () => setMenuVisible(false);

  const handleYearSelect = (year: Year) => {
    onYearSelect(year);
    closeMenu();
  };

  if (!shouldShowDropdown) {
    // Show selected year as text when dropdown is not needed
    return (
      <View style={styles.container}>
        {selectedYear ? (
          <Text variant="titleMedium" style={styles.singleYearText}>
            {selectedYear.name}
          </Text>
        ) : (
          <Text variant="bodyMedium" style={styles.noYearText}>
            No year selected
          </Text>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Menu
        visible={menuVisible}
        onDismiss={closeMenu}
        anchor={
          <Button
            mode="outlined"
            onPress={openMenu}
            disabled={disabled || loading}
            style={styles.dropdownButton}
            contentStyle={styles.dropdownButtonContent}
            icon={loading ? undefined : 'chevron-down'}
          >
            {loading ? (
              <ActivityIndicator size="small" />
            ) : selectedYear ? (
              selectedYear.name
            ) : (
              'Select Year'
            )}
          </Button>
        }
        contentStyle={styles.menuContent}
      >
        {years.map((year) => (
          <Menu.Item
            key={year.id}
            onPress={() => handleYearSelect(year)}
            title={year.name}
            titleStyle={[
              styles.menuItemTitle,
              selectedYear?.id === year.id && styles.selectedMenuItemTitle,
            ]}
            style={[
              styles.menuItem,
              selectedYear?.id === year.id && styles.selectedMenuItem,
            ]}
          />
        ))}
      </Menu>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    minWidth: 120,
  },
  singleYearText: {
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#6200ee',
  },
  noYearText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
  },
  dropdownButton: {
    minWidth: 120,
  },
  dropdownButtonContent: {
    flexDirection: 'row-reverse',
  },
  menuContent: {
    backgroundColor: 'white',
    borderRadius: 8,
    elevation: 4,
  },
  menuItem: {
    minWidth: 120,
  },
  menuItemTitle: {
    fontSize: 16,
  },
  selectedMenuItem: {
    backgroundColor: '#f3e5f5',
  },
  selectedMenuItemTitle: {
    fontWeight: 'bold',
    color: '#6200ee',
  },
});

export default YearSelector;