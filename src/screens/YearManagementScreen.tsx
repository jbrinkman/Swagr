import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Alert,
  RefreshControl,
} from 'react-native';
import {
  Text,
  Button,
  Card,
  IconButton,
  Dialog,
  Portal,
  TextInput,
  ActivityIndicator,
  Snackbar,
  FAB,
} from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';
import { FirestoreService } from '../services/FirestoreService';
import StorageService from '../services/StorageService';
import { Year, ValidationError, NetworkError } from '../types';

interface YearManagementScreenProps {
  navigation: {
    navigate: (screen: string, params?: Record<string, unknown>) => void;
  };
}

interface YearItemProps {
  year: Year;
  onSelect: (year: Year) => void;
  onEdit: (year: Year) => void;
  onDelete: (year: Year) => void;
  isSelected: boolean;
}

const YearItem: React.FC<YearItemProps> = ({
  year,
  onSelect,
  onEdit,
  onDelete,
  isSelected,
}) => (
  <Card
    style={[styles.yearCard, isSelected && styles.selectedYearCard]}
    onPress={() => onSelect(year)}
  >
    <Card.Content style={styles.yearCardContent}>
      <View style={styles.yearInfo}>
        <Text variant="titleMedium" style={styles.yearName}>
          {year.name}
        </Text>
        <Text variant="bodySmall" style={styles.yearDate}>
          Created: {year.createdAt.toLocaleDateString()}
        </Text>
      </View>
      <View style={styles.yearActions}>
        <IconButton
          icon="pencil"
          size={20}
          onPress={() => onEdit(year)}
          style={styles.actionButton}
        />
        <IconButton
          icon="delete"
          size={20}
          onPress={() => onDelete(year)}
          style={styles.actionButton}
        />
      </View>
    </Card.Content>
  </Card>
);

const YearManagementScreen: React.FC<YearManagementScreenProps> = ({
  navigation,
}) => {
  const { user } = useAuth();
  const [years, setYears] = useState<Year[]>([]);
  const [selectedYear, setSelectedYear] = useState<Year | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Dialog states
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingYear, setEditingYear] = useState<Year | null>(null);
  const [deletingYear, setDeletingYear] = useState<Year | null>(null);
  
  // Form states
  const [yearName, setYearName] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // Snackbar state
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' });

  const firestoreService = FirestoreService.getInstance();
  const storageService = StorageService;

  /**
   * Load years from Firestore
   */
  const loadYears = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const fetchedYears = await firestoreService.getYears(user.uid);
      setYears(fetchedYears);

      // Load last selected year from storage
      const lastSelectedYearId = await storageService.getLastSelectedYear();
      if (lastSelectedYearId) {
        const lastYear = fetchedYears.find(y => y.id === lastSelectedYearId);
        if (lastYear) {
          setSelectedYear(lastYear);
        } else if (fetchedYears.length > 0) {
          // If last selected year doesn't exist, select the first one
          setSelectedYear(fetchedYears[0]);
          await storageService.setLastSelectedYear(fetchedYears[0].id);
        }
      } else if (fetchedYears.length > 0) {
        // No previous selection, select the first year
        setSelectedYear(fetchedYears[0]);
        await storageService.setLastSelectedYear(fetchedYears[0].id);
      }
    } catch (error) {
      console.error('Error loading years:', error);
      let message = 'Failed to load years';
      if (error instanceof NetworkError) {
        message = 'Network error. Please check your connection.';
      }
      setSnackbar({ visible: true, message });
    } finally {
      setLoading(false);
    }
  }, [user, firestoreService, storageService]);

  /**
   * Refresh years data
   */
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadYears();
    setRefreshing(false);
  }, [loadYears]);

  /**
   * Load years on component mount
   */
  useEffect(() => {
    loadYears();
  }, [loadYears]);

  /**
   * Validate year name
   */
  const validateYearName = (name: string): string | null => {
    if (!name || name.trim().length === 0) {
      return 'Year name is required';
    }
    if (name.trim().length > 50) {
      return 'Year name must be 50 characters or less';
    }
    // Check for duplicate names (case-insensitive)
    const existingYear = years.find(
      y => y.name.toLowerCase() === name.trim().toLowerCase() && 
           (!editingYear || y.id !== editingYear.id)
    );
    if (existingYear) {
      return 'A year with this name already exists';
    }
    return null;
  };

  /**
   * Handle year selection
   */
  const handleSelectYear = async (year: Year) => {
    try {
      setSelectedYear(year);
      await storageService.setLastSelectedYear(year.id);
      setSnackbar({ visible: true, message: `Selected ${year.name}` });
    } catch (error) {
      console.error('Error selecting year:', error);
      setSnackbar({ visible: true, message: 'Failed to save year selection' });
    }
  };

  /**
   * Handle adding a new year
   */
  const handleAddYear = async () => {
    if (!user) return;

    const error = validateYearName(yearName);
    if (error) {
      setFormError(error);
      return;
    }

    try {
      setSubmitting(true);
      setFormError('');

      const newYearId = await firestoreService.addYear(user.uid, {
        userId: user.uid,
        name: yearName.trim(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Refresh years list
      await loadYears();

      // Select the new year
      const newYear = years.find(y => y.id === newYearId);
      if (newYear) {
        await handleSelectYear(newYear);
      }

      setShowAddDialog(false);
      setYearName('');
      setSnackbar({ visible: true, message: `Year "${yearName.trim()}" added successfully` });
    } catch (error) {
      console.error('Error adding year:', error);
      let message = 'Failed to add year';
      if (error instanceof ValidationError) {
        message = error.message;
      } else if (error instanceof NetworkError) {
        message = 'Network error. Please check your connection.';
      }
      setFormError(message);
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Handle editing a year
   */
  const handleEditYear = async () => {
    if (!user || !editingYear) return;

    const error = validateYearName(yearName);
    if (error) {
      setFormError(error);
      return;
    }

    try {
      setSubmitting(true);
      setFormError('');

      await firestoreService.updateYear(user.uid, editingYear.id, {
        name: yearName.trim(),
      });

      // Refresh years list
      await loadYears();

      setShowEditDialog(false);
      setEditingYear(null);
      setYearName('');
      setSnackbar({ visible: true, message: `Year renamed successfully` });
    } catch (error) {
      console.error('Error updating year:', error);
      let message = 'Failed to update year';
      if (error instanceof ValidationError) {
        message = error.message;
      } else if (error instanceof NetworkError) {
        message = 'Network error. Please check your connection.';
      }
      setFormError(message);
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Handle deleting a year
   */
  const handleDeleteYear = async () => {
    if (!user || !deletingYear) return;

    try {
      setSubmitting(true);

      await firestoreService.deleteYear(user.uid, deletingYear.id);

      // If we deleted the selected year, select another one
      if (selectedYear?.id === deletingYear.id) {
        const remainingYears = years.filter(y => y.id !== deletingYear.id);
        if (remainingYears.length > 0) {
          await handleSelectYear(remainingYears[0]);
        } else {
          setSelectedYear(null);
          await storageService.setLastSelectedYear('');
        }
      }

      // Refresh years list
      await loadYears();

      setShowDeleteDialog(false);
      setDeletingYear(null);
      setSnackbar({ visible: true, message: `Year "${deletingYear.name}" deleted successfully` });
    } catch (error) {
      console.error('Error deleting year:', error);
      let message = 'Failed to delete year';
      if (error instanceof NetworkError) {
        message = 'Network error. Please check your connection.';
      }
      setSnackbar({ visible: true, message });
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Show add year dialog
   */
  const showAddYearDialog = () => {
    setYearName('');
    setFormError('');
    setShowAddDialog(true);
  };

  /**
   * Show edit year dialog
   */
  const showEditYearDialog = (year: Year) => {
    setEditingYear(year);
    setYearName(year.name);
    setFormError('');
    setShowEditDialog(true);
  };

  /**
   * Show delete confirmation dialog
   */
  const showDeleteYearDialog = (year: Year) => {
    // Prevent deletion of the last year
    if (years.length <= 1) {
      Alert.alert(
        'Cannot Delete Year',
        'You must have at least one year. Create another year before deleting this one.',
        [{ text: 'OK' }]
      );
      return;
    }

    setDeletingYear(year);
    setShowDeleteDialog(true);
  };

  /**
   * Navigate to contact list for selected year
   */
  const navigateToContacts = () => {
    if (selectedYear) {
      navigation.navigate('ContactList', { yearId: selectedYear.id });
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading years...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {years.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text variant="headlineSmall" style={styles.emptyTitle}>
            No Years Found
          </Text>
          <Text variant="bodyMedium" style={styles.emptyMessage}>
            Create your first year to start managing contacts.
          </Text>
          <Button
            mode="contained"
            onPress={showAddYearDialog}
            style={styles.emptyButton}
          >
            Add First Year
          </Button>
        </View>
      ) : (
        <>
          <View style={styles.header}>
            <Text variant="headlineSmall" style={styles.title}>
              Manage Years
            </Text>
            {selectedYear && (
              <Button
                mode="contained"
                onPress={navigateToContacts}
                style={styles.viewContactsButton}
              >
                View Contacts ({selectedYear.name})
              </Button>
            )}
          </View>

          <FlatList
            data={years}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <YearItem
                year={item}
                onSelect={handleSelectYear}
                onEdit={showEditYearDialog}
                onDelete={showDeleteYearDialog}
                isSelected={selectedYear?.id === item.id}
              />
            )}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />

          <FAB
            icon="plus"
            style={styles.fab}
            onPress={showAddYearDialog}
          />
        </>
      )}

      {/* Add Year Dialog */}
      <Portal>
        <Dialog visible={showAddDialog} onDismiss={() => setShowAddDialog(false)}>
          <Dialog.Title>Add New Year</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Year Name"
              value={yearName}
              onChangeText={setYearName}
              error={!!formError}
              disabled={submitting}
              placeholder="e.g., 2024, 2025"
              autoFocus
            />
            {formError ? (
              <Text style={styles.errorText}>{formError}</Text>
            ) : null}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowAddDialog(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button
              onPress={handleAddYear}
              loading={submitting}
              disabled={submitting}
            >
              Add
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Edit Year Dialog */}
      <Portal>
        <Dialog visible={showEditDialog} onDismiss={() => setShowEditDialog(false)}>
          <Dialog.Title>Rename Year</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Year Name"
              value={yearName}
              onChangeText={setYearName}
              error={!!formError}
              disabled={submitting}
              autoFocus
            />
            {formError ? (
              <Text style={styles.errorText}>{formError}</Text>
            ) : null}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowEditDialog(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button
              onPress={handleEditYear}
              loading={submitting}
              disabled={submitting}
            >
              Save
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Delete Confirmation Dialog */}
      <Portal>
        <Dialog visible={showDeleteDialog} onDismiss={() => setShowDeleteDialog(false)}>
          <Dialog.Title>Delete Year</Dialog.Title>
          <Dialog.Content>
            <Text>
              Are you sure you want to delete "{deletingYear?.name}"? This will also delete all contacts in this year. This action cannot be undone.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowDeleteDialog(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button
              onPress={handleDeleteYear}
              loading={submitting}
              disabled={submitting}
              textColor="red"
            >
              Delete
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Snackbar for notifications */}
      <Snackbar
        visible={snackbar.visible}
        onDismiss={() => setSnackbar({ visible: false, message: '' })}
        duration={3000}
      >
        {snackbar.message}
      </Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    marginBottom: 16,
    textAlign: 'center',
  },
  emptyMessage: {
    marginBottom: 32,
    textAlign: 'center',
    color: '#666',
  },
  emptyButton: {
    minWidth: 200,
  },
  header: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    marginBottom: 8,
  },
  viewContactsButton: {
    marginTop: 8,
  },
  listContainer: {
    padding: 16,
  },
  yearCard: {
    marginBottom: 12,
    elevation: 2,
  },
  selectedYearCard: {
    borderWidth: 2,
    borderColor: '#6200ee',
  },
  yearCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  yearInfo: {
    flex: 1,
  },
  yearName: {
    fontWeight: 'bold',
  },
  yearDate: {
    color: '#666',
    marginTop: 4,
  },
  yearActions: {
    flexDirection: 'row',
  },
  actionButton: {
    margin: 0,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 8,
  },
});

export default YearManagementScreen;