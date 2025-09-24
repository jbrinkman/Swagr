import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  IconButton,
  Chip,
  Divider,
  Snackbar,
  Dialog,
  Portal,
  TextInput,
} from 'react-native-paper';
import { useContact } from '../contexts/ContactContext';
import { Contact, ValidationError, NetworkError } from '../types';
import { sanitizeInput } from '../utils/validation';

interface ContactDetailScreenProps {
  navigation: {
    goBack: () => void;
    navigate: (screen: string, params?: Record<string, unknown>) => void;
    setOptions: (options: { title: string }) => void;
  };
  route: {
    params: {
      yearId: string;
      contact: Contact;
    };
  };
}

const ContactDetailScreen: React.FC<ContactDetailScreenProps> = ({
  navigation,
  route,
}) => {
  const { yearId, contact: initialContact } = route.params;
  const { updateContact, deleteContact, toggleDelivery } = useContact();
  
  const [contact, setContact] = useState<Contact>(initialContact);
  const [isEditingComments, setIsEditingComments] = useState(false);
  const [editedComments, setEditedComments] = useState(contact.comments || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' });

  // Set navigation title
  useEffect(() => {
    navigation.setOptions({
      title: `${contact.firstName} ${contact.lastName}`,
    });
  }, [navigation, contact.firstName, contact.lastName]);

  /**
   * Format delivery date for display
   */
  const formatDeliveryDate = (date: Date | null): string => {
    if (!date) return 'Not delivered';
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  /**
   * Handle delivery status toggle
   */
  const handleToggleDelivery = async () => {
    try {
      setIsSubmitting(true);
      await toggleDelivery(contact.id);
      
      // Update local contact state
      const updatedContact = {
        ...contact,
        delivered: !contact.delivered,
        deliveredAt: !contact.delivered ? new Date() : null,
      };
      setContact(updatedContact);
      
      const action = contact.delivered ? 'unmarked' : 'marked';
      setSnackbar({ 
        visible: true, 
        message: `Contact ${action} as delivered` 
      });
    } catch (error) {
      console.error('Error toggling delivery status:', error);
      setSnackbar({ visible: true, message: 'Failed to update delivery status' });
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle comments editing
   */
  const handleEditComments = () => {
    setEditedComments(contact.comments || '');
    setIsEditingComments(true);
  };

  /**
   * Handle comments save
   */
  const handleSaveComments = async () => {
    try {
      setIsSubmitting(true);
      
      const sanitizedComments = sanitizeInput(editedComments).trim();
      
      // Validate comments length
      if (sanitizedComments.length > 500) {
        Alert.alert('Error', 'Comments must be 500 characters or less');
        return;
      }
      
      await updateContact(contact.id, {
        comments: sanitizedComments,
      });
      
      // Update local contact state
      const updatedContact = {
        ...contact,
        comments: sanitizedComments,
      };
      setContact(updatedContact);
      
      setIsEditingComments(false);
      setSnackbar({ visible: true, message: 'Comments updated successfully' });
    } catch (error) {
      console.error('Error updating comments:', error);
      
      let errorMessage = 'Failed to update comments';
      if (error instanceof ValidationError) {
        errorMessage = error.message;
      } else if (error instanceof NetworkError) {
        errorMessage = 'Network error. Please check your connection.';
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle comments cancel
   */
  const handleCancelComments = () => {
    setEditedComments(contact.comments || '');
    setIsEditingComments(false);
  };

  /**
   * Handle contact deletion
   */
  const handleDeleteContact = async () => {
    try {
      setIsSubmitting(true);
      await deleteContact(contact.id);
      setShowDeleteDialog(false);
      setSnackbar({ 
        visible: true, 
        message: `${contact.firstName} ${contact.lastName} deleted successfully` 
      });
      
      // Navigate back after a short delay
      setTimeout(() => {
        navigation.goBack();
      }, 1500);
    } catch (error) {
      console.error('Error deleting contact:', error);
      setSnackbar({ visible: true, message: 'Failed to delete contact' });
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Navigate to edit contact form
   */
  const navigateToEditForm = () => {
    navigation.navigate('ContactForm', {
      yearId,
      contact,
      isEdit: true,
    });
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          {/* Contact Header */}
          <View style={styles.header}>
            <View style={styles.contactInfo}>
              <Text variant="headlineSmall" style={styles.contactName}>
                {contact.firstName} {contact.lastName}
              </Text>
              <Text variant="titleMedium" style={styles.enterpriseName}>
                {contact.enterpriseName}
              </Text>
            </View>
            <View style={styles.headerActions}>
              <IconButton
                icon="pencil"
                size={24}
                onPress={navigateToEditForm}
                disabled={isSubmitting}
                testID="edit-contact-button"
              />
              <IconButton
                icon="delete"
                size={24}
                onPress={() => setShowDeleteDialog(true)}
                disabled={isSubmitting}
                testID="delete-contact-button"
              />
            </View>
          </View>

          <Divider style={styles.divider} />

          {/* Delivery Status */}
          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Delivery Status
            </Text>
            <View style={styles.deliverySection}>
              <Chip
                icon={contact.delivered ? 'check-circle' : 'circle-outline'}
                style={[
                  styles.deliveryChip,
                  contact.delivered ? styles.deliveredChip : styles.pendingChip
                ]}
              >
                {contact.delivered ? 'Delivered' : 'Pending'}
              </Chip>
              <Button
                mode="outlined"
                onPress={handleToggleDelivery}
                loading={isSubmitting}
                disabled={isSubmitting}
                style={styles.toggleButton}
              >
                {contact.delivered ? 'Mark as Pending' : 'Mark as Delivered'}
              </Button>
            </View>
            <Text variant="bodyMedium" style={styles.deliveryDate}>
              {formatDeliveryDate(contact.deliveredAt)}
            </Text>
          </View>

          <Divider style={styles.divider} />

          {/* Comments Section */}
          <View style={styles.section}>
            <View style={styles.commentsHeader}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Comments
              </Text>
              {!isEditingComments && (
                <IconButton
                  icon="pencil"
                  size={20}
                  onPress={handleEditComments}
                  disabled={isSubmitting}
                  testID="edit-comments-button"
                />
              )}
            </View>

            {isEditingComments ? (
              <View style={styles.commentsEditSection}>
                <TextInput
                  value={editedComments}
                  onChangeText={setEditedComments}
                  mode="outlined"
                  multiline
                  numberOfLines={6}
                  placeholder="Add comments about this contact..."
                  maxLength={500}
                  disabled={isSubmitting}
                  style={styles.commentsInput}
                />
                <Text variant="bodySmall" style={styles.characterCount}>
                  {editedComments.length}/500 characters
                </Text>
                <View style={styles.commentsActions}>
                  <Button
                    mode="outlined"
                    onPress={handleCancelComments}
                    disabled={isSubmitting}
                    style={styles.commentButton}
                  >
                    Cancel
                  </Button>
                  <Button
                    mode="contained"
                    onPress={handleSaveComments}
                    loading={isSubmitting}
                    disabled={isSubmitting}
                    style={styles.commentButton}
                  >
                    Save
                  </Button>
                </View>
              </View>
            ) : (
              <View style={styles.commentsDisplaySection}>
                {contact.comments ? (
                  <Text variant="bodyMedium" style={styles.commentsText}>
                    {contact.comments}
                  </Text>
                ) : (
                  <Text variant="bodyMedium" style={styles.noCommentsText}>
                    No comments added yet. Tap the edit icon to add comments.
                  </Text>
                )}
              </View>
            )}
          </View>

          <Divider style={styles.divider} />

          {/* Contact Metadata */}
          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Contact Information
            </Text>
            <View style={styles.metadataRow}>
              <Text variant="bodyMedium" style={styles.metadataLabel}>
                Created:
              </Text>
              <Text variant="bodyMedium">
                {contact.createdAt.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
            </View>
            <View style={styles.metadataRow}>
              <Text variant="bodyMedium" style={styles.metadataLabel}>
                Last Updated:
              </Text>
              <Text variant="bodyMedium">
                {contact.updatedAt.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Portal>
        <Dialog visible={showDeleteDialog} onDismiss={() => setShowDeleteDialog(false)}>
          <Dialog.Title>Delete Contact</Dialog.Title>
          <Dialog.Content>
            <Text>
              Are you sure you want to delete "{contact.firstName} {contact.lastName}"? 
              This action cannot be undone.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowDeleteDialog(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              onPress={handleDeleteContact}
              loading={isSubmitting}
              disabled={isSubmitting}
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
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    margin: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
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
  },
  headerActions: {
    flexDirection: 'row',
  },
  divider: {
    marginVertical: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  deliverySection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  deliveryChip: {
    alignSelf: 'flex-start',
  },
  deliveredChip: {
    backgroundColor: '#e8f5e8',
  },
  pendingChip: {
    backgroundColor: '#fff3e0',
  },
  toggleButton: {
    flex: 1,
  },
  deliveryDate: {
    color: '#666',
    fontStyle: 'italic',
  },
  commentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  commentsEditSection: {
    gap: 8,
  },
  commentsInput: {
    backgroundColor: 'transparent',
    minHeight: 120,
  },
  characterCount: {
    textAlign: 'right',
    color: '#666',
  },
  commentsActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  commentButton: {
    minWidth: 80,
  },
  commentsDisplaySection: {
    minHeight: 40,
  },
  commentsText: {
    lineHeight: 20,
  },
  noCommentsText: {
    color: '#666',
    fontStyle: 'italic',
  },
  metadataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  metadataLabel: {
    fontWeight: '500',
    color: '#666',
  },
});

export default ContactDetailScreen;