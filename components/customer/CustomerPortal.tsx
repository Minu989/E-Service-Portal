import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { ServiceRequest, Conversation, Message, Rating } from '@/shared/types';
import MyRequestsView from '@/components/customer/CustomerDashboard';
import NewRequestModal from '@/components/modals/NewRequestModal';
import PaymentModal from '@/components/modals/PaymentModal';
import RatingModal from '@/components/modals/RatingModal';
import Sidebar, { NavItemType, View } from '@/components/common/Sidebar';
import {
    LogoutIcon,
    ChevronDownIcon,
    ClipboardDocumentListIcon,
    ChatIcon,
    ProfileIcon,
    PaperAirplaneIcon,
    CheckIcon,
    SpinnerIcon
} from '@/components/common/icons';
import { useAppContext } from '@/contexts/AppContext';
import { useAuth, UserProfile } from '@/contexts/AuthContext';
import { doc, addDoc, collection, serverTimestamp, updateDoc, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/services/firebase';

const CUSTOMER_NAV_ITEMS: NavItemType[] = [
    { view: 'requests', label: 'My Requests', icon: ClipboardDocumentListIcon },
    { view: 'messages', label: 'Messages', icon: ChatIcon },
    { view: 'profile', label: 'Profile', icon: ProfileIcon }
];

// --- Sub-components (No changes in this section) ---

const CustomerHeader: React.FC<{
    onLogout: () => void;
    userProfile: UserProfile;
}> = React.memo(({ onLogout, userProfile }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <header className="bg-white/70 backdrop-blur-md sticky top-0 z-30 border-b border-slate-200/80 px-6 py-4 flex items-center justify-between flex-shrink-0">
            <div>
                <h2 className="text-2xl font-bold text-slate-800">Hi, {userProfile.fullName.split(' ')[0]}!</h2>
                <p className="text-slate-500">Welcome to your customer portal.</p>
            </div>
            <div className="relative" ref={dropdownRef}>
                <button
                    aria-label="Toggle user menu"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center p-2 rounded-lg hover:bg-slate-100 transition-colors"
                >
                    <img src={userProfile.avatarUrl} alt={`${userProfile.fullName}'s avatar`} className="w-12 h-12 rounded-full border-2 border-indigo-500" />
                    <div className="ml-3 text-left">
                        <p className="font-semibold text-slate-800">{userProfile.fullName}</p>
                        <p className="text-sm text-slate-500">{userProfile.email}</p>
                    </div>
                    <ChevronDownIcon className={`w-5 h-5 text-slate-500 ml-2 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl z-20 animate-scale-in py-1">
                        <button
                            onClick={onLogout}
                            className="w-full text-left flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                            <LogoutIcon className="w-5 h-5 mr-2" />
                            Logout
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
});

const CustomerMessagesView: React.FC = () => {
    const { userProfile } = useAuth();
    const { conversations } = useAppContext();
    const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!selectedConvId && conversations.length > 0) {
            setSelectedConvId(conversations[0].id);
        }
    }, [conversations, selectedConvId]);

    useEffect(() => {
        if (!selectedConvId) {
            setMessages([]);
            return;
        }

        const messagesQuery = query(
            collection(db, 'conversations', selectedConvId, 'messages'),
            orderBy('timestamp', 'asc')
        );

        const unsubscribe = onSnapshot(messagesQuery, (querySnapshot) => {
            const messagesData: Message[] = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Message));
            setMessages(messagesData);
        });

        return () => unsubscribe();
    }, [selectedConvId]);
    
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const selectedConversation = useMemo(() => {
        return conversations.find((c: Conversation) => c.id === selectedConvId);
    }, [conversations, selectedConvId]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedConvId || !userProfile) return;

        const messagesCollectionRef = collection(db, 'conversations', selectedConvId, 'messages');
        
        try {
            await addDoc(messagesCollectionRef, {
                senderUid: userProfile.uid,
                text: newMessage,
                timestamp: serverTimestamp(),
            });
            const conversationDocRef = doc(db, 'conversations', selectedConvId);
            await updateDoc(conversationDocRef, {
                lastMessageText: newMessage,
                updatedAt: serverTimestamp(),
            });
            setNewMessage('');
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    const getOtherParticipant = (conversation: Conversation) => {
        const otherUid = conversation.participantUids.find(uid => uid !== userProfile?.uid);
        return otherUid ? conversation.participantInfo[otherUid] : null;
    };

    return (
        <div className="p-8 h-full flex flex-col">
            <h2 className="text-3xl font-bold text-slate-800 mb-6">Messages</h2>
            <div className="bg-white rounded-xl shadow-sm flex-grow flex overflow-hidden border border-slate-200">
                {conversations.length > 0 && userProfile ? (
                    <div className="w-full flex flex-col">
                        {selectedConversation ? (
                            (() => {
                                const otherParticipant = getOtherParticipant(selectedConversation);
                                if (!otherParticipant) return null;

                                return (
                                    <>
                                        <div className="p-4 border-b border-slate-200 flex items-center">
                                            <img src={otherParticipant.avatarUrl} alt={otherParticipant.fullName} className="w-10 h-10 rounded-full mr-3" />
                                            <div>
                                                <h3 className="font-bold text-lg text-slate-800">{otherParticipant.fullName}</h3>
                                                <p className="text-sm text-slate-500">Your Technician</p>
                                            </div>
                                        </div>
                                        <div className="flex-grow p-6 overflow-y-auto bg-slate-50">
                                            <div className="space-y-4">
                                                {messages.map((msg: Message) => (
                                                    <div key={msg.id} className={`flex items-end gap-2 ${msg.senderUid === userProfile.uid ? 'justify-end' : 'justify-start'}`}>
                                                        {msg.senderUid !== userProfile.uid && <img src={otherParticipant.avatarUrl} alt={otherParticipant.fullName} className="w-8 h-8 rounded-full" />}
                                                        <div className={`max-w-md p-3 rounded-2xl ${msg.senderUid === userProfile.uid ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-slate-200 text-slate-800 rounded-bl-none'}`}>
                                                            <p>{msg.text}</p>
                                                            <p className={`text-xs mt-1 text-right ${msg.senderUid === userProfile.uid ? 'text-indigo-200' : 'text-slate-400'}`}>{msg.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || 'sending...'}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                                <div ref={messagesEndRef} />
                                            </div>
                                        </div>
                                        <div className="p-4 bg-white border-t border-slate-200">
                                            <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
                                                <input type="text" value={newMessage} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewMessage(e.target.value)} placeholder="Type a message..." className="w-full bg-slate-100 border-transparent rounded-full py-3 px-5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                                                <button
                                                    type="submit"
                                                    aria-label="Send message"
                                                    className="bg-indigo-600 text-white p-3 rounded-full hover:bg-indigo-700 active:scale-95 transition-transform disabled:bg-slate-400"
                                                    disabled={!newMessage.trim()}
                                                >
                                                    <PaperAirplaneIcon className="w-5 h-5" />
                                                </button>
                                            </form>
                                        </div>
                                    </>
                                );
                            })()
                        ) : (
                            <div className="flex-grow flex items-center justify-center text-slate-500 p-8 text-center">
                                <ChatIcon className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                                <h3 className="font-semibold text-lg">No Conversation Selected</h3>
                                <p>Select a conversation from the list to start chatting.</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex-grow flex items-center justify-center text-slate-500 p-8 text-center">
                        <ChatIcon className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                        <h3 className="font-semibold text-lg">No Messages Yet</h3>
                        <p>Once a technician accepts your job, you can chat with them here.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const CustomerProfileView: React.FC<{
    userProfile: UserProfile;
    onUpdate: (profileData: Partial<UserProfile>) => void;
}> = ({ userProfile, onUpdate }) => {
    const [formData, setFormData] = useState({ fullName: userProfile.fullName, email: userProfile.email });

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        onUpdate(formData);
    };

    const FormInput: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, id, ...props }) => (
        <div>
            <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
            <input id={id} {...props} className="w-full bg-slate-50 border-slate-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 placeholder:text-slate-400 text-slate-900" />
        </div>
    );

    return (
        <div className="p-8">
            <h2 className="text-3xl font-bold text-slate-800 mb-6">My Profile</h2>
            <form onSubmit={handleSave}>
                <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-xl font-bold text-slate-800 mb-6 border-b border-slate-200 pb-4">Personal Information</h3>
                    <div className="flex items-center space-x-6 mb-6">
                        <img src={userProfile.avatarUrl} alt={userProfile.fullName} className="w-20 h-20 rounded-full" />
                        <div>
                            <button type="button" className="font-semibold text-white bg-indigo-600 py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors text-sm disabled:bg-slate-400 disabled:cursor-not-allowed" disabled>Change Photo</button>
                            <p className="text-xs text-slate-500 mt-2">JPG, GIF or PNG. 1MB max.</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormInput label="Full Name" id="fullName" type="text" value={formData.fullName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, fullName: e.target.value })} />
                        <FormInput label="Email Address" id="email" type="email" value={formData.email} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, email: e.target.value })} />
                    </div>
                </div>
                <div className="mt-8 flex justify-end">
                    <button type="submit" className="flex items-center font-semibold text-white bg-indigo-600 py-3 px-6 rounded-lg hover:bg-indigo-700 active:scale-95 transition-all shadow-md hover:shadow-lg">
                        <CheckIcon className="w-5 h-5 mr-2" /> Save Changes
                    </button>
                </div>
            </form>
        </div>
    );
};

// --- Main Portal Component ---

interface CustomerPortalProps {
    onLogout: () => void;
}

const CustomerPortal: React.FC<CustomerPortalProps> = ({ onLogout }) => {
    const { userProfile } = useAuth();
    const { requests, handleNewRequest, handleMarkAsPaid, handleAddRating } = useAppContext();
    const [activeView, setActiveView] = useState<View>('requests');
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isNewRequestModalOpen, setIsNewRequestModalOpen] = useState(false);
    const [paymentRequest, setPaymentRequest] = useState<ServiceRequest | null>(null);
    const [ratingRequest, setRatingRequest] = useState<ServiceRequest | null>(null);

    const customerRequests = useMemo(() =>
        userProfile ? requests.filter((r: ServiceRequest) => r.customerId === userProfile.uid) // <-- UPDATED
            .sort((a: ServiceRequest, b: ServiceRequest) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime()) : [],
        [requests, userProfile]
    );

    const handleNewRequestSubmit = useCallback((newRequestData: Omit<ServiceRequest, 'id' | 'customerName' | 'customerAvatar' | 'status' | 'paymentStatus' | 'customerId' | 'assignedTechnicianUid'>) => {
        if (userProfile) {
            const requestPayload: any = {
                ...newRequestData,
                customerId: userProfile.uid, // <-- UPDATED
                customerName: userProfile.fullName,
                customerAvatar: userProfile.avatarUrl,
            };

            if (newRequestData.photo) {
                requestPayload.photo = newRequestData.photo;
            }

            handleNewRequest(requestPayload);
        }
    }, [userProfile, handleNewRequest]);

    const handleUpdateProfile = useCallback((updatedProfileData: Partial<UserProfile>) => {
        console.log("Profile updated with:", updatedProfileData);
    }, []);

    const handlePaymentSubmit = useCallback(() => {
        if (paymentRequest) {
            handleMarkAsPaid(paymentRequest.id);
            setTimeout(() => {
                setRatingRequest(requests.find((r: ServiceRequest) => r.id === paymentRequest.id) || null);
                setPaymentRequest(null);
            }, 1800);
        }
    }, [paymentRequest, requests, handleMarkAsPaid]);

    const handleRatingSubmit = useCallback((rating: Rating) => {
        if (ratingRequest) {
            handleAddRating(ratingRequest.id, 'customer', rating);
            setRatingRequest(null);
        }
    }, [ratingRequest, handleAddRating]);

    if (!userProfile) {
        return (
            <div className="h-screen flex justify-center items-center bg-slate-100">
                <SpinnerIcon className="w-10 h-10 text-indigo-600 animate-spin" />
            </div>
        );
    }

    const renderView = () => {
        switch (activeView) {
            case 'requests':
                return <MyRequestsView
                    customerRequests={customerRequests}
                    onNewRequestClick={() => setIsNewRequestModalOpen(true)}
                    onPay={setPaymentRequest}
                    onRate={setRatingRequest}
                />;
            case 'messages':
                return <CustomerMessagesView />;
            case 'profile':
                return <CustomerProfileView userProfile={userProfile} onUpdate={handleUpdateProfile} />;
            default:
                return null;
        }
    };

    return (
        <div className="h-screen flex bg-slate-100 overflow-hidden">
            <Sidebar
                activeView={activeView}
                setActiveView={setActiveView}
                isCollapsed={isSidebarCollapsed}
                onToggle={() => setIsSidebarCollapsed(prev => !prev)}
                navItems={CUSTOMER_NAV_ITEMS}
                portalName="Customer Portal"
            />
            <main className="flex-1 flex flex-col overflow-y-auto">
                <CustomerHeader
                    onLogout={onLogout}
                    userProfile={userProfile}
                />
                <div className="flex-1 main-content-bg animate-fade-in" key={activeView}>
                    {renderView()}
                </div>
            </main>
            {isNewRequestModalOpen && (
                <NewRequestModal
                    onClose={() => setIsNewRequestModalOpen(false)}
                    onSubmit={handleNewRequestSubmit}
                />
            )}
            {paymentRequest && (
                <PaymentModal
                    request={paymentRequest}
                    onClose={() => setPaymentRequest(null)}
                    onSubmit={handlePaymentSubmit}
                />
            )}
            {ratingRequest && (
                <RatingModal
                    title="Rate Your Technician"
                    onClose={() => setRatingRequest(null)}
                    onSubmit={handleRatingSubmit}
                />
            )}
        </div>
    );
};

export default CustomerPortal;