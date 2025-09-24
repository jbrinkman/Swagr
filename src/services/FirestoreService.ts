import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  enableNetwork,
  disableNetwork,
  onSnapshot,
  writeBatch,
} from "firebase/firestore";
import { db } from "../config/firebase";
import {
  Year,
  Contact,
  UserPreferences,
  FirestoreService as IFirestoreService,
  NetworkError,
  NotFoundError,
  PermissionError,
  ValidationError,
} from "../types";

/**
 * FirestoreService implementation for managing years, contacts, and user preferences
 * Provides CRUD operations with error handling and offline support
 */
export class FirestoreService implements IFirestoreService {
  private static instance: FirestoreService;

  private constructor() {}

  /**
   * Get singleton instance of FirestoreService
   */
  public static getInstance(): FirestoreService {
    if (!FirestoreService.instance) {
      FirestoreService.instance = new FirestoreService();
    }
    return FirestoreService.instance;
  }

  /**
   * Enable offline persistence and network connectivity
   */
  public async enableOfflineSupport(): Promise<void> {
    try {
      await enableNetwork(db);
    } catch (error) {
      console.warn("Failed to enable network:", error);
    }
  }

  /**
   * Disable network connectivity for offline mode
   */
  public async disableOfflineSupport(): Promise<void> {
    try {
      await disableNetwork(db);
    } catch (error) {
      console.warn("Failed to disable network:", error);
    }
  }

  /**
   * Handle Firestore errors and convert to appropriate error types
   */
  private handleFirestoreError(error: any, operation: string): never {
    console.error(`Firestore ${operation} error:`, error);

    if (error.code === "permission-denied") {
      throw new PermissionError(`Access denied for ${operation}`, error.code, {
        operation,
      });
    }

    if (error.code === "not-found") {
      throw new NotFoundError(
        `Resource not found for ${operation}`,
        error.code,
        { operation }
      );
    }

    if (error.code === "unavailable" || error.code === "deadline-exceeded") {
      throw new NetworkError(
        `Network error during ${operation}. Please check your connection.`,
        error.code,
        { operation }
      );
    }

    if (error.code === "invalid-argument") {
      throw new ValidationError(
        `Invalid data provided for ${operation}`,
        error.code,
        { operation }
      );
    }

    // Generic network error for other cases
    throw new NetworkError(
      `Failed to ${operation}. Please try again.`,
      error.code || "unknown",
      { operation, originalError: error.message }
    );
  }

  /**
   * Validate user ID parameter
   */
  private validateUserId(userId: string): void {
    if (!userId || typeof userId !== "string" || userId.trim().length === 0) {
      throw new ValidationError(
        "User ID is required and must be a non-empty string"
      );
    }
  }

  /**
   * Validate year ID parameter
   */
  private validateYearId(yearId: string): void {
    if (!yearId || typeof yearId !== "string" || yearId.trim().length === 0) {
      throw new ValidationError(
        "Year ID is required and must be a non-empty string"
      );
    }
  }

  /**
   * Validate contact ID parameter
   */
  private validateContactId(contactId: string): void {
    if (
      !contactId ||
      typeof contactId !== "string" ||
      contactId.trim().length === 0
    ) {
      throw new ValidationError(
        "Contact ID is required and must be a non-empty string"
      );
    }
  }

  // Year Management Methods

  /**
   * Get all years for a user
   */
  public async getYears(userId: string): Promise<Year[]> {
    try {
      this.validateUserId(userId);

      const yearsRef = collection(db, "users", userId, "years");
      const q = query(yearsRef, orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);

      const years: Year[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        years.push({
          id: doc.id,
          userId,
          name: data.name,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        });
      });

      return years;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      this.handleFirestoreError(error, "get years");
    }
  }

  /**
   * Add a new year for a user
   */
  public async addYear(
    userId: string,
    year: Omit<Year, "id">
  ): Promise<string> {
    try {
      this.validateUserId(userId);

      if (!year.name || year.name.trim().length === 0) {
        throw new ValidationError("Year name is required");
      }

      const yearsRef = collection(db, "users", userId, "years");
      const docRef = await addDoc(yearsRef, {
        userId,
        name: year.name.trim(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return docRef.id;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      this.handleFirestoreError(error, "add year");
    }
  }

  /**
   * Update an existing year
   */
  public async updateYear(
    userId: string,
    yearId: string,
    updates: Partial<Year>
  ): Promise<void> {
    try {
      this.validateUserId(userId);
      this.validateYearId(yearId);

      const yearRef = doc(db, "users", userId, "years", yearId);

      // Prepare update data, excluding read-only fields
      const updateData: any = {
        updatedAt: serverTimestamp(),
      };

      if (updates.name !== undefined) {
        if (!updates.name || updates.name.trim().length === 0) {
          throw new ValidationError("Year name cannot be empty");
        }
        updateData.name = updates.name.trim();
      }

      await updateDoc(yearRef, updateData);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      this.handleFirestoreError(error, "update year");
    }
  }

  /**
   * Delete a year and all its contacts
   */
  public async deleteYear(userId: string, yearId: string): Promise<void> {
    try {
      this.validateUserId(userId);
      this.validateYearId(yearId);

      // Use batch to delete year and all its contacts atomically
      const batch = writeBatch(db);

      // Delete all contacts in the year
      const contactsRef = collection(
        db,
        "users",
        userId,
        "years",
        yearId,
        "contacts"
      );
      const contactsSnapshot = await getDocs(contactsRef);

      contactsSnapshot.forEach((contactDoc) => {
        batch.delete(contactDoc.ref);
      });

      // Delete the year document
      const yearRef = doc(db, "users", userId, "years", yearId);
      batch.delete(yearRef);

      await batch.commit();
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      this.handleFirestoreError(error, "delete year");
    }
  }

  // Contact Management Methods

  /**
   * Get all contacts for a specific year
   */
  public async getContacts(userId: string, yearId: string): Promise<Contact[]> {
    try {
      this.validateUserId(userId);
      this.validateYearId(yearId);

      const contactsRef = collection(
        db,
        "users",
        userId,
        "years",
        yearId,
        "contacts"
      );
      const q = query(contactsRef, orderBy("lastName"), orderBy("firstName"));
      const querySnapshot = await getDocs(q);

      const contacts: Contact[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        contacts.push({
          id: doc.id,
          userId,
          yearId,
          firstName: data.firstName,
          lastName: data.lastName,
          enterpriseName: data.enterpriseName,
          comments: data.comments || "",
          delivered: data.delivered || false,
          deliveredAt: data.deliveredAt?.toDate() || null,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        });
      });

      return contacts;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      this.handleFirestoreError(error, "get contacts");
    }
  }

  /**
   * Add a new contact to a year
   */
  public async addContact(
    userId: string,
    yearId: string,
    contact: Omit<Contact, "id">
  ): Promise<string> {
    try {
      this.validateUserId(userId);
      this.validateYearId(yearId);

      // Validate required contact fields
      if (!contact.firstName || contact.firstName.trim().length === 0) {
        throw new ValidationError("First name is required");
      }
      if (!contact.lastName || contact.lastName.trim().length === 0) {
        throw new ValidationError("Last name is required");
      }
      if (
        !contact.enterpriseName ||
        contact.enterpriseName.trim().length === 0
      ) {
        throw new ValidationError("Enterprise name is required");
      }

      const contactsRef = collection(
        db,
        "users",
        userId,
        "years",
        yearId,
        "contacts"
      );
      const docRef = await addDoc(contactsRef, {
        userId,
        yearId,
        firstName: contact.firstName.trim(),
        lastName: contact.lastName.trim(),
        enterpriseName: contact.enterpriseName.trim(),
        comments: contact.comments?.trim() || "",
        delivered: contact.delivered || false,
        deliveredAt: contact.deliveredAt || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return docRef.id;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      this.handleFirestoreError(error, "add contact");
    }
  }

  /**
   * Update an existing contact
   */
  public async updateContact(
    userId: string,
    yearId: string,
    contactId: string,
    updates: Partial<Contact>
  ): Promise<void> {
    try {
      this.validateUserId(userId);
      this.validateYearId(yearId);
      this.validateContactId(contactId);

      const contactRef = doc(
        db,
        "users",
        userId,
        "years",
        yearId,
        "contacts",
        contactId
      );

      // Prepare update data, excluding read-only fields
      const updateData: any = {
        updatedAt: serverTimestamp(),
      };

      if (updates.firstName !== undefined) {
        if (!updates.firstName || updates.firstName.trim().length === 0) {
          throw new ValidationError("First name cannot be empty");
        }
        updateData.firstName = updates.firstName.trim();
      }

      if (updates.lastName !== undefined) {
        if (!updates.lastName || updates.lastName.trim().length === 0) {
          throw new ValidationError("Last name cannot be empty");
        }
        updateData.lastName = updates.lastName.trim();
      }

      if (updates.enterpriseName !== undefined) {
        if (
          !updates.enterpriseName ||
          updates.enterpriseName.trim().length === 0
        ) {
          throw new ValidationError("Enterprise name cannot be empty");
        }
        updateData.enterpriseName = updates.enterpriseName.trim();
      }

      if (updates.comments !== undefined) {
        updateData.comments = updates.comments?.trim() || "";
      }

      if (updates.delivered !== undefined) {
        updateData.delivered = updates.delivered;
        // Set deliveredAt timestamp when marking as delivered, clear when unmarking
        updateData.deliveredAt = updates.delivered ? serverTimestamp() : null;
      }

      await updateDoc(contactRef, updateData);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      this.handleFirestoreError(error, "update contact");
    }
  }

  /**
   * Delete a contact
   */
  public async deleteContact(
    userId: string,
    yearId: string,
    contactId: string
  ): Promise<void> {
    try {
      this.validateUserId(userId);
      this.validateYearId(yearId);
      this.validateContactId(contactId);

      const contactRef = doc(
        db,
        "users",
        userId,
        "years",
        yearId,
        "contacts",
        contactId
      );
      await deleteDoc(contactRef);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      this.handleFirestoreError(error, "delete contact");
    }
  }

  // User Preferences Methods

  /**
   * Get user preferences
   */
  public async getUserPreferences(userId: string): Promise<UserPreferences> {
    try {
      this.validateUserId(userId);

      const preferencesRef = doc(db, "users", userId, "preferences", "main");
      const docSnapshot = await getDoc(preferencesRef);

      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        return {
          userId,
          lastSelectedYearId: data.lastSelectedYearId || null,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        };
      } else {
        // Create default preferences if they don't exist
        const defaultPreferences: UserPreferences = {
          userId,
          lastSelectedYearId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await this.updateUserPreferences(userId, defaultPreferences);
        return defaultPreferences;
      }
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      this.handleFirestoreError(error, "get user preferences");
    }
  }

  /**
   * Update user preferences
   */
  public async updateUserPreferences(
    userId: string,
    preferences: Partial<UserPreferences>
  ): Promise<void> {
    try {
      this.validateUserId(userId);

      const preferencesRef = doc(db, "users", userId, "preferences", "main");

      const updateData: any = {
        userId,
        updatedAt: serverTimestamp(),
      };

      if (preferences.lastSelectedYearId !== undefined) {
        updateData.lastSelectedYearId = preferences.lastSelectedYearId;
      }

      // Set createdAt only if it's a new document
      const docSnapshot = await getDoc(preferencesRef);
      if (!docSnapshot.exists()) {
        updateData.createdAt = serverTimestamp();
      }

      await updateDoc(preferencesRef, updateData);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      this.handleFirestoreError(error, "update user preferences");
    }
  }

  /**
   * Subscribe to real-time updates for years
   */
  public subscribeToYears(
    userId: string,
    callback: (years: Year[]) => void
  ): () => void {
    try {
      this.validateUserId(userId);

      const yearsRef = collection(db, "users", userId, "years");
      const q = query(yearsRef, orderBy("createdAt", "desc"));

      return onSnapshot(
        q,
        (querySnapshot) => {
          const years: Year[] = [];
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            years.push({
              id: doc.id,
              userId,
              name: data.name,
              createdAt: data.createdAt?.toDate() || new Date(),
              updatedAt: data.updatedAt?.toDate() || new Date(),
            });
          });
          callback(years);
        },
        (error) => {
          console.error("Years subscription error:", error);
          this.handleFirestoreError(error, "subscribe to years");
        }
      );
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      this.handleFirestoreError(error, "subscribe to years");
    }
  }

  /**
   * Subscribe to real-time updates for contacts
   */
  public subscribeToContacts(
    userId: string,
    yearId: string,
    callback: (contacts: Contact[]) => void
  ): () => void {
    try {
      this.validateUserId(userId);
      this.validateYearId(yearId);

      const contactsRef = collection(
        db,
        "users",
        userId,
        "years",
        yearId,
        "contacts"
      );
      const q = query(contactsRef, orderBy("lastName"), orderBy("firstName"));

      return onSnapshot(
        q,
        (querySnapshot) => {
          const contacts: Contact[] = [];
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            contacts.push({
              id: doc.id,
              userId,
              yearId,
              firstName: data.firstName,
              lastName: data.lastName,
              enterpriseName: data.enterpriseName,
              comments: data.comments || "",
              delivered: data.delivered || false,
              deliveredAt: data.deliveredAt?.toDate() || null,
              createdAt: data.createdAt?.toDate() || new Date(),
              updatedAt: data.updatedAt?.toDate() || new Date(),
            });
          });
          callback(contacts);
        },
        (error) => {
          console.error("Contacts subscription error:", error);
          this.handleFirestoreError(error, "subscribe to contacts");
        }
      );
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      this.handleFirestoreError(error, "subscribe to contacts");
    }
  }
}

// Export singleton instance
export default FirestoreService.getInstance();
