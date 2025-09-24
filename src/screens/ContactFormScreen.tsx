import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Card,
  Title,
  HelperText,
  Snackbar,
} from 'react-native-paper';
import { useContact } from '../contexts/ContactContext';
import { Contact, ContactFormData, ValidationError, NetworkError } from '../types';
import { sanitizeInput, isEmptyOrWhitespace } from '../utils/validation';

interface ContactFormScreenProps {
  navigation: {
    goBack: () => void;
    setOptions: (options: { title: string }) => void;
  };
  route: {
    params: {
      yearId: string;
      contact?: Contact;
      isEdit?: boolean;
    };
  };
}

interface ContactFormErrors {
  firstName?: string;
  lastName?: string;
  enterpriseName?: string;
  comments?: string;
}

const ContactFormScreen: React.FC<ContactFormScreenProps> = ({
  navigation,
  route,
}) => {
  const { contact, isEdit = false } = route.params;
  const { addContact, updateContact } = useContact();
  
  const [formData, setFormData] = useState<ContactFormData>({
    firstName: contact?.firstName || '',
    lastName: contact?.lastName || '',
    enterpriseName: contact?.enterpriseName || '',
    comments: contact?.comments || '',
  });
  
  const [errors, setErrors] = useState<ContactFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' });

  // Set navigation title based on mode
  useEffect(() => {
    navigation.setOptions({
      title: isEdit ? 'Edit Contact' : 'Add Contact',
    });
  }, [navigation, isEdit]);

  /**
   * Validate contact form data
   */
  const validateForm = (): boolean => {
    const newErrors: ContactFormErrors = {};

    // Validate first name
    if (isEmptyOrWhitespace(formData.firstName)) {
      newErrors.firstName = 'First name is required';
    } else if (formData.firstName.trim().length > 50) {
      newErrors.firstName = 'First name must be 50 characters or less';
    }

    // Validate last name
    if (isEmptyOrWhitespace(formData.lastName)) {
      newErrors.lastName = 'Last name is required';
    } else if (formData.lastName.trim().length > 50) {
      newErrors.lastName = 'Last name must be 50 characters or less';
    }

    // Validate enterprise name
    if (isEmptyOrWhitespace(formData.enterpriseName)) {
      newErrors.enterpriseName = 'Enterprise name is required';
    } else if (formData.enterpriseName.trim().length > 100) {
      newErrors.enterpriseName = 'Enterprise name must be 100 characters or less';
    }

    // Validate comments (optional but has length limit)
    if (formData.comments && formData.comments.trim().length > 500) {
      newErrors.comments = 'Comments must be 500 characters or less';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle input changes
   */
  const handleInputChange = (field: keyof ContactFormData, value: string) => {
    const sanitizedValue = sanitizeInput(value);
    setFormData(prev => ({
      ...prev,
      [field]: sanitizedValue,
    }));

    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEdit && contact) {
        // Update existing contact
        await updateContact(contact.id, {
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          enterpriseName: formData.enterpriseName.trim(),
          comments: formData.comments?.trim() || '',
        });
        
        setSnackbar({ 
          visible: true, 
          message: `${formData.firstName} ${formData.lastName} updated successfully` 
        });
      } else {
        // Add new contact
        await addContact({
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          enterpriseName: formData.enterpriseName.trim(),
          comments: formData.comments?.trim() || '',
        });
        
        setSnackbar({ 
          visible: true, 
          message: `${formData.firstName} ${formData.lastName} added successfully` 
        });
      }

      // Navigate back after a short delay to show the success message
      setTimeout(() => {
        navigation.goBack();
      }, 1500);
      
    } catch (error) {
      console.error('Error saving contact:', error);
      
      let errorMessage = `Failed to ${isEdit ? 'update' : 'add'} contact`;
      
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
   * Handle cancel action
   */
  const handleCancel = () => {
    // Check if form has unsaved changes
    const hasChanges = isEdit ? (
      formData.firstName !== (contact?.firstName || '') ||
      formData.lastName !== (contact?.lastName || '') ||
      formData.enterpriseName !== (contact?.enterpriseName || '') ||
      formData.comments !== (contact?.comments || '')
    ) : (
      formData.firstName.trim() !== '' ||
      formData.lastName.trim() !== '' ||
      formData.enterpriseName.trim() !== '' ||
      formData.comments?.trim() !== ''
    );

    if (hasChanges) {
      Alert.alert(
        'Discard Changes',
        'Are you sure you want to discard your changes?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.title}>
              {isEdit ? 'Edit Contact Information' : 'Add New Contact'}
            </Title>

            <View style={styles.form}>
              <TextInput
                label="First Name *"
                value={formData.firstName}
                onChangeText={(value) => handleInputChange('firstName', value)}
                mode="outlined"
                autoCapitalize="words"
                error={!!errors.firstName}
                style={styles.input}
                disabled={isSubmitting}
                maxLength={50}
              />
              <HelperText type="error" visible={!!errors.firstName}>
                {errors.firstName}
              </HelperText>

              <TextInput
                label="Last Name *"
                value={formData.lastName}
                onChangeText={(value) => handleInputChange('lastName', value)}
                mode="outlined"
                autoCapitalize="words"
                error={!!errors.lastName}
                style={styles.input}
                disabled={isSubmitting}
                maxLength={50}
              />
              <HelperText type="error" visible={!!errors.lastName}>
                {errors.lastName}
              </HelperText>

              <TextInput
                label="Enterprise Name *"
                value={formData.enterpriseName}
                onChangeText={(value) => handleInputChange('enterpriseName', value)}
                mode="outlined"
                autoCapitalize="words"
                error={!!errors.enterpriseName}
                style={styles.input}
                disabled={isSubmitting}
                maxLength={100}
              />
              <HelperText type="error" visible={!!errors.enterpriseName}>
                {errors.enterpriseName}
              </HelperText>

              <TextInput
                label="Comments (Optional)"
                value={formData.comments}
                onChangeText={(value) => handleInputChange('comments', value)}
                mode="outlined"
                multiline
                numberOfLines={4}
                error={!!errors.comments}
                style={styles.textArea}
                disabled={isSubmitting}
                maxLength={500}
                placeholder="Add any notes about this contact..."
              />
              <HelperText type="error" visible={!!errors.comments}>
                {errors.comments}
              </HelperText>
              {formData.comments && (
                <HelperText type="info">
                  {formData.comments.length}/500 characters
                </HelperText>
              )}

              <Text variant="bodySmall" style={styles.requiredNote}>
                * Required fields
              </Text>

              <View style={styles.buttonContainer}>
                <Button
                  mode="outlined"
                  onPress={handleCancel}
                  disabled={isSubmitting}
                  style={styles.cancelButton}
                >
                  Cancel
                </Button>
                
                <Button
                  mode="contained"
                  onPress={handleSubmit}
                  loading={isSubmitting}
                  disabled={isSubmitting}
                  style={styles.submitButton}
                >
                  {isEdit ? 'Update Contact' : 'Add Contact'}
                </Button>
              </View>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Snackbar for notifications */}
      <Snackbar
        visible={snackbar.visible}
        onDismiss={() => setSnackbar({ visible: false, message: '' })}
        duration={3000}
      >
        {snackbar.message}
      </Snackbar>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 16,
  },
  card: {
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  title: {
    textAlign: 'center',
    marginBottom: 24,
    fontSize: 20,
    fontWeight: 'bold',
  },
  form: {
    gap: 8,
  },
  input: {
    backgroundColor: 'transparent',
  },
  textArea: {
    backgroundColor: 'transparent',
    minHeight: 100,
  },
  requiredNote: {
    color: '#666',
    fontStyle: 'italic',
    marginTop: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
  },
  submitButton: {
    flex: 1,
  },
});

export default ContactFormScreen;