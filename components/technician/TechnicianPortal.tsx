import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import Sidebar, { NavItemType, View } from '@/components/common/Sidebar';
import Header from '@/components/common/Header';
import DashboardView from '@/components/technician/DashboardView';
import ScheduleView from '@/components/technician/ScheduleView';
import InvoiceModal from '@/components/modals/InvoiceModal';
import RatingModal from '@/components/modals/RatingModal';
import { ServiceRequest, Message, Invoice, Rating, Conversation } from '@/shared/types';
import { ChatIcon, ProfileIcon, PencilIcon, PaperAirplaneIcon, CheckIcon, DashboardIcon, CalendarIcon, SpinnerIcon, StarIcon } from '@/components/common/icons';
import { useAppContext } from '@/contexts/AppContext';
import { useAuth, UserProfile } from '@/contexts/AuthContext';
import { doc, addDoc, collection, serverTimestamp, updateDoc, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/services/firebase';

interface TechnicianPortalProps {
    onLogout: () => void;
}

const TECHNICIAN_NAV_ITEMS: NavItemType[] = [
    { view: 'dashboard', label: 'Dashboard', icon: DashboardIcon },
    { view: 'schedule', label: 'Schedule', icon: CalendarIcon },
    { view: 'messages', label: 'Messages', icon: ChatIcon },
    { view: 'profile', label: 'Profile', icon: ProfileIcon }
];


// --- Messages View Component (UPDATED) ---
const MessagesView: React.FC = () => {
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

    // NEW: This effect listens for messages within the selected conversation
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
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Messages</h2>
            <div className="bg-white rounded-xl shadow-sm flex-grow flex overflow-hidden">
                <div className="w-1/3 border-r border-gray-200 flex flex-col">
                    <div className="p-4 font-semibold border-b border-gray-200">Contacts</div>
                    <ul className="overflow-y-auto">
                        {conversations.map((conv: Conversation) => {
                            const otherParticipant = getOtherParticipant(conv);
                            if (!otherParticipant) return null;

                            return (
                                <li key={conv.id} onClick={() => setSelectedConvId(conv.id)} className={`p-4 cursor-pointer hover:bg-indigo-50 border-l-4 ${selectedConvId === conv.id ? 'border-indigo-600 bg-indigo-50' : 'border-transparent'}`}>
                                    <div className="flex items-center">
                                        <img src={otherParticipant.avatarUrl} alt={otherParticipant.fullName} className="w-12 h-12 rounded-full mr-3" />
                                        <div className="flex-grow overflow-hidden">
                                            <p className="font-bold text-gray-800 truncate">{otherParticipant.fullName}</p>
                                            <p className="text-sm text-gray-500 truncate">{conv.lastMessageText}</p>
                                        </div>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </div>
                <div className="w-2/3 flex flex-col">
                    {selectedConversation && userProfile ? (
                        (() => {
                            const otherParticipant = getOtherParticipant(selectedConversation);
                            if (!otherParticipant) return null;

                            return (
                                <>
                                    <div className="p-4 border-b border-gray-200 flex items-center">
                                        <img src={otherParticipant.avatarUrl} alt={otherParticipant.fullName} className="w-10 h-10 rounded-full mr-3" />
                                        <h3 className="font-bold text-lg text-gray-800">{otherParticipant.fullName}</h3>
                                    </div>
                                    <div className="flex-grow p-6 overflow-y-auto bg-gray-50">
                                        <div className="space-y-4">
                                            {messages.map((msg: Message) => (
                                                <div key={msg.id} className={`flex items-end gap-2 ${msg.senderUid === userProfile.uid ? 'justify-end' : 'justify-start'}`}>
                                                    {msg.senderUid !== userProfile.uid && <img src={otherParticipant.avatarUrl} alt={otherParticipant.fullName} className="w-8 h-8 rounded-full" />}
                                                    <div className={`max-w-md p-3 rounded-2xl ${msg.senderUid === userProfile.uid ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white text-gray-800 shadow-sm rounded-bl-none'}`}>
                                                        <p>{msg.text}</p>
                                                        <p className={`text-xs mt-1 ${msg.senderUid === userProfile.uid ? 'text-indigo-200' : 'text-gray-400'}`}>{msg.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || 'sending...'}</p>
                                                    </div>
                                                </div>
                                            ))}
                                            <div ref={messagesEndRef} />
                                        </div>
                                    </div>
                                    <div className="p-4 bg-white border-t border-gray-200">
                                        <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
                                            <input aria-label="Message input" type="text" value={newMessage} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewMessage(e.target.value)} placeholder="Type a message..." className="w-full bg-gray-100 border-transparent rounded-full py-2 px-4 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                                            <button aria-label="Send message" type="submit" className="bg-indigo-600 text-white p-3 rounded-full hover:bg-indigo-700 active:scale-95 transition-transform">
                                                <PaperAirplaneIcon className="w-5 h-5" />
                                            </button>
                                        </form>
                                    </div>
                                </>
                            );
                        })()
                    ) : (
                        <div className="flex-grow flex items-center justify-center text-gray-500 p-4 text-center">
                            <div>
                                <ChatIcon className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                                <h3 className="font-semibold text-lg">No Conversation Selected</h3>
                                <p>Select a conversation to start chatting.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
const RatingDisplay: React.FC<{ rating: number }> = ({ rating }) => (
    <div className="flex items-center space-x-1">
        {[...Array(5)].map((_, i) => (
            <StarIcon key={i} className={`w-5 h-5 ${i < rating ? 'text-yellow-400' : 'text-slate-300'}`} />
        ))}
    </div>
);

// --- Profile View Component (No changes in this section) ---
const ProfileView: React.FC<{ userProfile: UserProfile; onUpdate: (profileData: Partial<UserProfile>) => void }> = ({ userProfile, onUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        fullName: userProfile.fullName,
        skills: userProfile.skills?.join(', ') || ''
    });


    const handleSave = () => {
        const updatedProfileData = {
            fullName: formData.fullName,
            skills: formData.skills.split(',').map(s => s.trim()).filter(Boolean),
        };
        onUpdate(updatedProfileData);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setFormData({
            fullName: userProfile.fullName,
            skills: userProfile.skills?.join(', ') || ''
        });
        setIsEditing(false);
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">My Profile</h2>
                {!isEditing && (
                    <button onClick={() => setIsEditing(true)} className="flex items-center font-semibold text-white bg-indigo-600 py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors">
                        <PencilIcon className="w-5 h-5 mr-2" /> Edit Profile
                    </button>
                )}
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm max-w-2xl mx-auto">
                <div className="flex items-center">
                    <img src={userProfile.avatarUrl} alt={userProfile.fullName} className="w-24 h-24 rounded-full border-4 border-indigo-500" />
                    <div className="ml-6">
                        {isEditing ? (
                            <div>
                                <label htmlFor="technicianName" className="sr-only">Technician Name</label>
                                <input id="technicianName" type="text" value={formData.fullName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, fullName: e.target.value })} className="text-3xl font-bold text-gray-800 border-b-2 border-indigo-300 focus:border-indigo-500 outline-none" />
                            </div>
                        ) : (
                            <h3 className="text-3xl font-bold text-gray-800">{userProfile.fullName}</h3>
                        )}
                        <p className="text-gray-500">Service Technician</p>
                    </div>
                </div>
                {/* --- NEW SECTION TO DISPLAY AVERAGE RATING --- */}
                {userProfile.ratingCount && userProfile.ratingCount > 0 ? (
                    <div className="mt-6 text-center border-t border-gray-200 pt-6">
                        <p className="font-semibold text-slate-700">Overall Rating</p>
                        <div className="flex justify-center items-center mt-2">
                            <RatingDisplay rating={Math.round(userProfile.averageRating || 0)} />
                            <span className="ml-2 text-slate-500 font-medium">
                                ({userProfile.averageRating?.toFixed(1)} from {userProfile.ratingCount} reviews)
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="mt-6 text-center border-t border-gray-200 pt-6">
                        <p className="text-slate-500">No ratings yet.</p>
                    </div>
                )}
                <div className="mt-8 pt-6 border-t border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-700 mb-4">Skills</h4>
                    {isEditing ? (
                        <div>
                            <label htmlFor="technicianSkills" className="sr-only">Technician Skills</label>
                            <textarea id="technicianSkills" value={formData.skills} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, skills: e.target.value })} rows={3} className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                            <p className="text-xs text-gray-500 mt-1">Enter skills separated by commas.</p>
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {userProfile.skills?.map(skill => (
                                <span key={skill} className="bg-indigo-100 text-indigo-800 text-sm font-medium px-3 py-1 rounded-full">{skill}</span>
                            ))}
                        </div>
                    )}
                </div>
                {isEditing && (
                    <div className="mt-8 flex justify-end space-x-3">
                        <button onClick={handleCancel} className="font-semibold text-gray-700 bg-gray-200 py-2 px-5 rounded-lg hover:bg-gray-300 transition-colors">Cancel</button>
                        <button onClick={handleSave} className="flex items-center font-semibold text-white bg-green-600 py-2 px-5 rounded-lg hover:bg-green-700 transition-colors">
                            <CheckIcon className="w-5 h-5 mr-2" /> Save Changes
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};


const TechnicianPortal: React.FC<TechnicianPortalProps> = ({ onLogout }) => {
    const { userProfile } = useAuth();
    const { handleCreateInvoice, handleAddRating } = useAppContext();
    const [activeView, setActiveView] = useState<View>('dashboard');
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [invoiceRequest, setInvoiceRequest] = useState<ServiceRequest | null>(null);
    const [ratingRequest, setRatingRequest] = useState<ServiceRequest | null>(null);

    const handleUpdateProfile = useCallback((updatedProfileData: Partial<UserProfile>) => {
        console.log("Profile updated with:", updatedProfileData);
    }, []);

    const handleInvoiceSubmit = (invoice: Omit<Invoice, 'issuedDate'>) => {
        if (invoiceRequest) {
            handleCreateInvoice(invoiceRequest.id, invoice);
            setInvoiceRequest(null);
        }
    };

    const handleRatingSubmit = (rating: Rating) => {
        if (ratingRequest) {
            handleAddRating(ratingRequest.id, 'technician', rating);
            setRatingRequest(null);
        }
    };

    if (!userProfile) {
        return (
            <div className="h-screen flex justify-center items-center bg-slate-50">
                <SpinnerIcon className="w-10 h-10 text-indigo-600 animate-spin" />
            </div>
        );
    }

    const renderView = () => {
        switch (activeView) {
            case 'dashboard':
                return <DashboardView
                    onOpenInvoiceModal={setInvoiceRequest}
                    onOpenRatingModal={setRatingRequest}
                />;
            case 'schedule':
                return <ScheduleView />;
            case 'messages':
                return <MessagesView />;
            case 'profile':
                return <ProfileView userProfile={userProfile} onUpdate={handleUpdateProfile} />;
            default:
                return <DashboardView onOpenInvoiceModal={setInvoiceRequest} onOpenRatingModal={setRatingRequest} />;
        }
    };

    return (
        <div className="h-screen flex bg-slate-50 overflow-hidden">
            <Sidebar
                activeView={activeView}
                setActiveView={setActiveView}
                isCollapsed={isSidebarCollapsed}
                onToggle={() => setIsSidebarCollapsed(prev => !prev)}
                navItems={TECHNICIAN_NAV_ITEMS}
                portalName="Technician Portal"
            />
            <main className="flex-1 flex flex-col overflow-y-auto">
                <Header
                    userProfile={userProfile}
                    notifications={[]}
                    onClearNotifications={() => { }}
                    onLogout={onLogout}
                    setActiveView={setActiveView}
                />
                <div className="flex-1 main-content-bg animate-fade-in" key={activeView}>
                    {renderView()}
                </div>
            </main>

            {invoiceRequest && (
                <InvoiceModal
                    request={invoiceRequest}
                    onClose={() => setInvoiceRequest(null)}
                    onSubmit={handleInvoiceSubmit}
                />
            )}

            {ratingRequest && (
                <RatingModal
                    title={`Rate Customer: ${ratingRequest.customerName}`}
                    onClose={() => setRatingRequest(null)}
                    onSubmit={handleRatingSubmit}
                />
            )}
        </div>
    );
};

export default TechnicianPortal;
