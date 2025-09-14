import React, { createContext, useState, useCallback, useContext, ReactNode, useEffect } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, query, where, orderBy, Query, writeBatch } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { ServiceRequest, Conversation, RequestStatus, Invoice, Rating } from '@/shared/types';
import { useAuth } from './AuthContext';
import { runTransaction } from 'firebase/firestore';

interface AppContextState {
  requests: ServiceRequest[];
  conversations: Conversation[];
  handleNewRequest: (newRequestData: Omit<ServiceRequest, 'id' | 'status' | 'paymentStatus' | 'assignedTechnicianUid'>) => void;
  handleUpdateStatus: (id: string, status: RequestStatus) => void;
  handleCreateInvoice: (requestId: string, invoice: Omit<Invoice, 'issuedDate'>) => void;
  handleMarkAsPaid: (requestId: string) => void;
  handleAddRating: (requestId: string, ratingBy: 'customer' | 'technician', rating: Rating) => void;
  setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>;
}

const AppContext = createContext<AppContextState | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { userProfile } = useAuth();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  // Add these two lines
  const [pendingRequests, setPendingRequests] = useState<ServiceRequest[]>([]);
  const [assignedRequests, setAssignedRequests] = useState<ServiceRequest[]>([]);

  // PASTE THIS NEW useEffect BLOCK IN PLACE OF THE OLD ONE
  useEffect(() => {
    if (!userProfile) {
      setRequests([]);
      setPendingRequests([]);
      setAssignedRequests([]);
      return;
    }

    const requestsCollection = collection(db, 'requests');
    let unsubscribeRequests: (() => void) | null = null;
    let unsubscribePending: (() => void) | null = null;
    let unsubscribeAssigned: (() => void) | null = null;

    if (userProfile.role === 'customer') {
      // Customer logic remains the same: fetch all requests where they are the customer.
      const requestsQuery = query(requestsCollection, where("customerId", "==", userProfile.uid), orderBy('dateTime', 'desc'));
      unsubscribeRequests = onSnapshot(requestsQuery, (snapshot) => {
        const requestsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ServiceRequest));
        setRequests(requestsData);
      }, (error) => console.error("Error in customer requests listener:", error));

    } else if (userProfile.role === 'technician') {
      // --- NEW TECHNICIAN LOGIC ---
      // Query 1: Get all PENDING jobs for the public job board.
      const pendingQuery = query(requestsCollection, where("status", "==", RequestStatus.PENDING));
      unsubscribePending = onSnapshot(pendingQuery, (snapshot) => {
        const pendingData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ServiceRequest));
        setPendingRequests(pendingData);
      }, (error) => console.error("Error in pending requests listener:", error));

      // Query 2: Get all jobs ASSIGNED to this specific technician.
      const assignedQuery = query(requestsCollection, where("assignedTechnicianUid", "==", userProfile.uid));
      unsubscribeAssigned = onSnapshot(assignedQuery, (snapshot) => {
        const assignedData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ServiceRequest));
        setAssignedRequests(assignedData);
      }, (error) => console.error("Error in assigned requests listener:", error));
    }

    // This is the cleanup function. It will stop listening to the database when the component unmounts.
    return () => {
      if (unsubscribeRequests) unsubscribeRequests();
      if (unsubscribePending) unsubscribePending();
      if (unsubscribeAssigned) unsubscribeAssigned();
    };
  }, [userProfile]);
  // ADD THIS NEW useEffect BLOCK
  useEffect(() => {
    if (userProfile?.role !== 'technician') return;

    // Use a Map to combine the two lists and automatically handle duplicates.
    const combinedRequestsMap = new Map<string, ServiceRequest>();

    // First, add all the jobs assigned to me.
    assignedRequests.forEach(request => {
      combinedRequestsMap.set(request.id, request);
    });

    // Then, add any pending jobs that are not already in the list.
    pendingRequests.forEach(request => {
      if (!combinedRequestsMap.has(request.id)) {
        combinedRequestsMap.set(request.id, request);
      }
    });

    const finalRequests = Array.from(combinedRequestsMap.values())
      .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());

    setRequests(finalRequests);

  }, [pendingRequests, assignedRequests, userProfile]);

  useEffect(() => {
    if (!userProfile) {
      setConversations([]);
      return;
    }

    const conversationsQuery = query(
      collection(db, 'conversations'),
      where("participantUids", "array-contains", userProfile.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(conversationsQuery, (querySnapshot) => {
      const conversationsData: Conversation[] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as Omit<Conversation, 'id'>)
      }));
      setConversations(conversationsData);
    }, (error) => {
      console.error("Error in conversations snapshot listener (AppContext.tsx):", error);
    });
    return () => unsubscribe();
  }, [userProfile]);


  const handleNewRequest = useCallback(async (newRequestData: Omit<ServiceRequest, 'id' | 'status' | 'paymentStatus' | 'assignedTechnicianUid'>) => {
    try {
      await addDoc(collection(db, 'requests'), {
        ...newRequestData,
        status: RequestStatus.PENDING,
        paymentStatus: 'none',
        assignedTechnicianUid: null,
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      console.error("Error adding document in AppContext.tsx: ", e);
    }
  }, []);

  // PASTE THIS NEW FUNCTION IN ITS PLACE
  const handleUpdateStatus = useCallback(async (id: string, status: RequestStatus) => {
    if (!userProfile) {
      console.error("Cannot update status, no user is logged in.");
      return;
    }

    const requestDocRef = doc(db, 'requests', id);
    const updatedRequest = requests.find(r => r.id === id);

    if (!updatedRequest) {
      console.error("Could not find the request to update.");
      return;
    }

    try {
      // Use a batch to ensure all database changes happen at once or not at all.
      const batch = writeBatch(db);

      // Logic for when a Technician accepts a job
      if (status === RequestStatus.ACCEPTED && userProfile.role === 'technician') {

        console.log(`Technician ${userProfile.fullName} is accepting job ${id}. Creating conversation...`);

        // 1. Prepare the data to update the service request with technician details
        const requestUpdateData = {
          status: RequestStatus.ACCEPTED,
          assignedTechnicianUid: userProfile.uid,
          technicianName: userProfile.fullName,
          technicianAvatar: userProfile.avatarUrl,
          technicianSkills: userProfile.skills || [],
        };
        batch.update(requestDocRef, requestUpdateData);

        // 2. Prepare the new conversation document
        const conversationRef = doc(collection(db, 'conversations'));
        batch.set(conversationRef, {
          participantUids: [updatedRequest.customerId, userProfile.uid],
          participantInfo: {
            [updatedRequest.customerId]: {
              fullName: updatedRequest.customerName,
              avatarUrl: updatedRequest.customerAvatar,
            },
            [userProfile.uid]: {
              fullName: userProfile.fullName,
              avatarUrl: userProfile.avatarUrl,
            }
          },
          lastMessageText: 'Service request accepted. Feel free to ask any questions.',
          updatedAt: serverTimestamp(),
        });

        // 3. Prepare the initial message inside the new conversation
        const messageRef = doc(collection(conversationRef, 'messages'));
        batch.set(messageRef, {
          senderUid: userProfile.uid,
          text: 'Service request accepted. Feel free to ask any questions.',
          timestamp: serverTimestamp(),
        });
      } else {
        // For all other status updates (e.g., customer marking as complete), just update the status field.
        batch.update(requestDocRef, { status });
      }

      // 4. Commit all the changes to the database
      await batch.commit();

    } catch (e) {
      console.error("Error in handleUpdateStatus (AppContext.tsx): ", e);
    }
  }, [requests, userProfile]);

  const handleCreateInvoice = useCallback(async (requestId: string, invoiceData: Omit<Invoice, 'issuedDate'>) => {
    const requestDocRef = doc(db, 'requests', requestId);
    try {
      await updateDoc(requestDocRef, {
        invoice: { ...invoiceData, issuedDate: new Date().toISOString() },
        paymentStatus: 'pending'
      });
    } catch (e) {
      console.error("Error creating invoice: ", e);
    }
  }, []);

  const handleMarkAsPaid = useCallback(async (requestId: string) => {
    const requestDocRef = doc(db, 'requests', requestId);
    try {
      await updateDoc(requestDocRef, { paymentStatus: 'paid' });
    } catch (e) {
      console.error("Error marking as paid: ", e);
    }
  }, []);

  // const handleAddRating = useCallback(async (requestId: string, ratingBy: 'customer' | 'technician', rating: Rating) => {
  //   const requestDocRef = doc(db, 'requests', requestId);
  //   const ratingField = ratingBy === 'customer' ? 'customerRating' : 'technicianRating';
  //   try {
  //     await updateDoc(requestDocRef, {
  //       [ratingField]: rating
  //     });
  //   } catch (e) {
  //     console.error("Error adding rating: ", e);
  //   }
  // }, []);

  // ... inside the AppProvider component ...

  const handleAddRating = useCallback(async (requestId: string, ratingBy: 'customer' | 'technician', rating: Rating) => {
    const requestDocRef = doc(db, 'requests', requestId);
    const request = requests.find(r => r.id === requestId);
    if (!request) {
      console.error("Cannot add rating: request not found");
      return;
    }

    // Determine who is being rated
    const ratedUserUid = ratingBy === 'customer' ? request.assignedTechnicianUid : request.customerId;
    if (!ratedUserUid) {
      console.error("Cannot add rating: rated user's UID is missing");
      return;
    }
    const ratedUserDocRef = doc(db, 'users', ratedUserUid);

    try {
      await runTransaction(db, async (transaction) => {
        // 1. Read the rated user's current profile from the database
        const ratedUserDoc = await transaction.get(ratedUserDocRef);
        if (!ratedUserDoc.exists()) {
          throw "Rated user's profile does not exist!";
        }

        // 2. Calculate the new average rating
        const oldRatingCount = ratedUserDoc.data().ratingCount || 0;
        const oldAverageRating = ratedUserDoc.data().averageRating || 0;
        const newRatingCount = oldRatingCount + 1;
        const newAverageRating = ((oldAverageRating * oldRatingCount) + rating.stars) / newRatingCount;

        // 3. Update the Service Request document with the new rating
        const ratingField = ratingBy === 'customer' ? 'customerRating' : 'technicianRating';
        transaction.update(requestDocRef, { [ratingField]: rating });

        // 4. Update the User's profile with the new aggregated rating
        transaction.update(ratedUserDocRef, {
          ratingCount: newRatingCount,
          averageRating: newAverageRating
        });
      });

      console.log("Rating submitted and user profile updated successfully!");

    } catch (e) {
      console.error("Rating transaction failed: ", e);
    }
  }, [requests]);

  const value = {
    requests,
    conversations,
    handleNewRequest,
    handleUpdateStatus,
    handleCreateInvoice,
    handleMarkAsPaid,
    handleAddRating,
    setConversations,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};