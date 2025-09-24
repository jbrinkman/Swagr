import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
} from 'react-native';
import {
  Text,
  Card,
  IconButton,
  Dialog,
  Portal,
  ActivityIndicator,
  Snackbar,
  FAB,
  Checkbox,
  Chip,
  Button,
} from 'react-native-paper';
import { useContact } from '../contexts/ContactContext';
import { useYear } from '../contexts/YearContext';
import { Contact } from '../types';

interface ContactListScreenProps {
  navigation: {
    navigate: (screen: string, params?: Record<string, unknown>) => void;
  };
  route: {
    params: {
      yearId: string;
    };
  };
}

interface ContactItemProps {
  contact: Contact;
  onEdit: (contact: Contact) => void;
  onDelete: (contact: Contact) => void;
  onToggleDelivery: (contact: Contact) => void;
  onViewDetails: (contact: Contact) => void;
}

const ContactItem: React.FC<ContactItemProps> = ({
  contact,
  onEdit,
  onDelete,
  onToggleDelivery,
  onViewDetails,
}) => {
  const formatDeliveryDate = (date: Date | null): string => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card style={[styles.contactCard, contact.delivered && styles.deliveredCard]}>
      <Card.Content>
        <View style={styles.contactHeader}>
          <View style={styles.contactInfo}>
            <Text variant="titleMedium" style={styles.contactName}>
              {contact.firstName} {contact.lastName}
            </Text>
            <Text variant="bodyMedium" style={styles.enterpriseName}>
              {contact.enterpriseName}
            </Text>
            {contact.comments && (
              <Chip
                icon="comment-text"
                compact
                style={styles.commentsChip}
                onPress={() => onViewDetails(contact)}
              >
                Has Comments
              </Chip>
            )}
          </View>
          <View style={styles.contactActions}>
            <Checkbox
              status={contact.delivered ? 'checked' : 'unchecked'}
              onPress={() => onToggleDelivery(contact)}
            />
          </View>
        </View>
        
        {contact.delivered && contact.deliveredAt && (
          <View style={styles.deliveryInfo}>
            <Text variant="bodySmall" style={styles.deliveryText}>
              Delivered: {formatDeliveryDate(contact.deliveredAt)}
            </Text>
          </View>
        )}
        
        <View style={styles.actionButtons}>
          <IconButton
            icon="eye"
            size={20}
            onPress={() => onViewDetails(contact)}
            style={styles.actionButton}
            testID="view-contact-button"
          />
          <IconButton
            icon="pencil"
            size={20}
            onPress={() => onEdit(contact)}
            style={styles.actionButton}
            testID="edit-contact-button"
          />
          <IconButton
            icon="delete"
            size={20}
            onPress={() => onDelete(contact)}
            style={styles.actionButton}
            testID="delete-contact-button"
          />
        </View>
      </Card.Content>
    </Card>
  );
};

const ContactListScreen: React.FC<ContactListScreenProps> = ({
  navigation,
  route,
}) => {
  const { yearId } = route.params;
  const { contacts, loading, deleteContact, toggleDelivery, refreshContacts } = useContact();
  const { selectedYear } = useYear();
  
  const [refreshing, setRefreshing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingContact, setDeletingContact] = useState<Contact | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' });

  /**
   * Refresh contacts data
   */
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshContacts();
    } catch (error) {
      console.error('Error refreshing contacts:', error);
      setSnackbar({ visible: true, message: 'Failed to refresh contacts' });
    } finally {
      setRefreshing(false);
    }
  }, [refreshContacts]);

  /**
   * Handle contact deletion
   */
  const handleDeleteContact = async () => {
    if (!deletingContact) return;

    try {
      setSubmitting(true);
      await deleteContact(deletingContact.id);
      setShowDeleteDialog(false);
      setDeletingContact(null);
      setSnackbar({ 
        visible: true, 
        message: `${deletingContact.firstName} ${deletingContact.lastName} deleted successfully` 
      });
    } catch (error) {
      console.error('Error deleting contact:', error);
      setSnackbar({ visible: true, message: 'Failed to delete contact' });
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Handle delivery status toggle
   */
  const handleToggleDelivery = async (contact: Contact) => {
    try {
      await toggleDelivery(contact.id);
      const action = contact.delivered ? 'unmarked' : 'marked';
      setSnackbar({ 
        visible: true, 
        message: `${contact.firstName} ${contact.lastName} ${action} as delivered` 
      });
    } catch (error) {
      console.error('Error toggling delivery status:', error);
      setSnackbar({ visible: true, message: 'Failed to update delivery status' });
    }
  };

  /**
   * Show delete confirmation dialog
   */
  const showDeleteContactDialog = (contact: Contact) => {
    setDeletingContact(contact);
    setShowDeleteDialog(true);
  };

  /**
   * Navigate to contact form for editing
   */
  const navigateToEditContact = (contact: Contact) => {
    navigation.navigate('ContactForm', {
      yearId,
      contact,
      isEdit: true,
    });
  };

  /**
   * Navigate to contact details
   */
  const navigateToContactDetails = (contact: Contact) => {
    navigation.navigate('ContactDetail', {
      yearId,
      contact,
    });
  };

  /**
   * Navigate to add new contact
   */
  const navigateToAddContact = () => {
    navigation.navigate('ContactForm', {
      yearId,
    });
  };

  /**
   * Get delivery statistics
   */
  const getDeliveryStats = () => {
    const delivered = contacts.filter(c => c.delivered).length;
    const total = contacts.length;
    return { delivered, total, percentage: total > 0 ? Math.round((delivered / total) * 100) : 0 };
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading contacts...</Text>
      </View>
    );
  }

  const stats = getDeliveryStats();

  return (
    <View style={styles.container}>
      {contacts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text variant="headlineSmall" style={styles.emptyTitle}>
            No Contacts Found
          </Text>
          <Text variant="bodyMedium" style={styles.emptyMessage}>
            Add your first contact for {selectedYear?.name || 'this year'} to start tracking your marketing outreach.
          </Text>
          <FAB
            icon="plus"
            label="Add First Contact"
            onPress={navigateToAddContact}
            style={styles.emptyFab}
          />
        </View>
      ) : (
        <>
          <View style={styles.header}>
            <Text variant="headlineSmall" style={styles.title}>
              Contacts - {selectedYear?.name || 'Unknown Year'}
            </Text>
            <View style={styles.statsContainer}>
              <Text variant="bodyMedium" style={styles.statsText}>
                {stats.delivered} of {stats.total} delivered ({stats.percentage}%)
              </Text>
            </View>
          </View>

          <FlatList
            testID="contacts-list"
            data={contacts}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ContactItem
                contact={item}
                onEdit={navigateToEditContact}
                onDelete={showDeleteContactDialog}
                onToggleDelivery={handleToggleDelivery}
                onViewDetails={navigateToContactDetails}
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
            onPress={navigateToAddContact}
            testID="add-contact-fab"
          />
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <Portal>
        <Dialog visible={showDeleteDialog} onDismiss={() => setShowDeleteDialog(false)}>
          <Dialog.Title>Delete Contact</Dialog.Title>
          <Dialog.Content>
            <Text>
              Are you sure you want to delete "{deletingContact?.firstName} {deletingContact?.lastName}"? 
              This action cannot be undone.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowDeleteDialog(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button
              onPress={handleDeleteContact}
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
  emptyFab: {
    alignSelf: 'center',
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
  statsContainer: {
    marginTop: 8,
  },
  statsText: {
    color: '#666',
  },
  listContainer: {
    padding: 16,
  },
  contactCard: {
    marginBottom: 12,
    elevation: 2,
  },
  deliveredCard: {
    backgroundColor: '#f0f8f0',
  },
  contactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  enterpriseName: {
    color: '#666',
    marginBottom: 8,
  },
  commentsChip: {
    alignSelf: 'flex-start',
  },
  contactActions: {
    alignItems: 'center',
  },
  deliveryInfo: {
    marginBottom: 8,
  },
  deliveryText: {
    color: '#4caf50',
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
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
});

export default ContactListScreen;