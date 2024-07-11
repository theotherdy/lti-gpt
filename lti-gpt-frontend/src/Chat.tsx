import { useState, useEffect, useRef } from 'react';

import { Alert } from '@instructure/ui-alerts';
import { Avatar } from '@instructure/ui-avatar'
import { Button } from '@instructure/ui-buttons';
//import { CloseButton } from '@instructure/ui-buttons';
import { DrawerLayout } from '@instructure/ui-drawer-layout';
import { IconButton } from '@instructure/ui-buttons';
import { IconCircleArrowUpSolid } from '@instructure/ui-icons'
import { IconHamburgerLine } from '@instructure/ui-icons';
import { IconDiscussionNewLine } from '@instructure/ui-icons'
import { ScreenReaderContent } from '@instructure/ui-a11y-content';
import { TextArea } from '@instructure/ui-text-area';
import { TextInput } from '@instructure/ui-text-input';
import { View } from '@instructure/ui-view';

import { CustomEventSource } from './CustomEventSource';
import Conversations from './Conversations'; // Import the new Conversations component
import { Message, Conversation } from './Interfaces';


function Chat() {
    //variables
    const [message, setMessage] = useState<string>('');
    const partialAssistantMessageRef = useRef<string>(''); // Ref to hold concatenated response
    const [messages, setMessages] = useState<Message[]>([]);
    const messagesRef = useRef<Message[]>([]); // Ref to hold the messages array which will be current when sent to the API
    const [apiKey, setApiKey] = useState<string>('');
    const [contextTitle, setContextTitle] = useState<string>(''); 
    const [errors, setErrors] = useState<string[]>([]);
    const [isLlmSet, setIsLlmSet] = useState(true); //default to true to avoid flickering up warning message
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const prevMessagesLengthRef = useRef<number>(messages.length);
    //interface    
    //const [drawerOverlayed, setDrawerOverlayed] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(true);
    const responseContainerRef = useRef<HTMLDivElement | null>(null); //A reference to the div showing the responses. It allows scrolling to the bottom when new responses come in.
    //event source
    const eventSourceRef = useRef<CustomEventSource | null>(null);
    //TODO temp token here - will move
    const token = ""; // Assuming this will be provided or managed elsewhere

    // Type guard to check if the error is of type Error
    const isError = (err: unknown): err is Error => {
        return err instanceof Error;
    };

    const handleApiKeyPost = async () => {
        const res = await fetch('http://localhost/api/llm/store', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ apiKey: apiKey }),
        });
    
        if (!res.ok) {
            // Handle non-successful response (status not in 200-299 range)
            if (res.status === 401) {
                // Handle 401 Unauthorized error
                throw new Error('Unauthorized');
            } else {
                // Handle other HTTP errors
                throw new Error('HTTP error ' + res.status);
            }
        }
    
        const data = await res.json();
    
        if (data.status !== 'success') {
            // Handle API-level error
            throw new Error('Error storing API key');
        }
    
        return data.llmId
    };

    const handleApiSubmit = async () => {
        try {
            const llmId = await handleApiKeyPost();
            if(llmId){
                setIsLlmSet(true);
            }
            
        } catch (error) {
            if (isError(error)) {
                setErrors(prevErrors => [...prevErrors, error.message]);
            } else {
                setErrors(prevErrors => [...prevErrors, 'An unknown error occurred.']);
            }
        }
    };

    const sendMessage = () => {
        if (!message.trim()) return;
        const newMessage: Message = { role: 'user', content: message };
        const updatedMessages: Message[] = [...messagesRef.current, newMessage]; // Use messagesRef.current

        setMessages(updatedMessages);
        messagesRef.current = updatedMessages; // Update messagesRef
        setMessage(''); // Clear the input textarea

        partialAssistantMessageRef.current = ''; // Reset partial message for new input
        
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
        }

        // Transform messages to an array of objects with 'role' and 'content' keys
        const transformedMessages = messagesRef.current.map(msg => ({ role: msg.role, content: msg.content }));

        eventSourceRef.current = new CustomEventSource(`http://localhost/api/llm/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ messages: transformedMessages }),
        });
        
        eventSourceRef.current.addEventListener('message', (event: MessageEvent) => {
            try {
                // Check if the message is "[DONE]"
                if (event.data.trim() === "[DONE]") {
                    console.log('message is done');
                    setMessages(prevMessages => {
                        const newMessages: Message[] = [...prevMessages, { role: 'assistant', content: partialAssistantMessageRef.current }];
                        messagesRef.current = newMessages; // Update messagesRef
                        return newMessages;
                    });
                    console.log(partialAssistantMessageRef.current );
                    return;
                }
                
                const parsedData = JSON.parse(event.data.trim());

                console.log(parsedData);
                
                if (parsedData.choices && parsedData.choices[0] && parsedData.choices[0].delta) {
                    if (parsedData.choices[0].delta.content) {
                        const assistantMessage = parsedData.choices[0].delta.content;
                        console.log(assistantMessage);
                        partialAssistantMessageRef.current += assistantMessage; // Concatenate response
                    } else {
                        console.log('Delta content is empty or undefined.');
                    }
                } else {
                    console.log('Unexpected data format received.');
                }
            } catch (error) {
                console.error('Error parsing event data:', error);
            }
        });

        eventSourceRef.current.addEventListener('error', (error: MessageEvent) => {
            console.error('Error sending message:', error);
            setErrors((prevErrors) => [...prevErrors, 'An error occurred while sending message.']);
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
            }
        });
    };

    const handleSelectConversation = (conversation: Conversation) => {
        setConversationId(conversation.id);
        setMessages(conversation.messages);
        messagesRef.current = conversation.messages;
        prevMessagesLengthRef.current = conversation.messages.length;
    };

    const handleNewConversation = () => {
        saveCurrentConversation();
        setConversationId(null);
        setMessages([]);
        messagesRef.current = [];
        setMessage(''); // Clear the input textarea
    };

    const handleDeleteAllConversations = () => {
        localStorage.removeItem('conversations');
        setConversations([]); // Clear the state so the UI updates accordingly
    };

    const saveConversationsToLocalStorage = (updatedConversations: Conversation[]) => {
        localStorage.setItem('conversations', JSON.stringify(updatedConversations));
    };

    const saveCurrentConversation = () => {
        if (messages.length === 0) return;
    
        const conversation = {
          id: conversationId || `${Date.now()}`,
          timestamp: Date.now(),
          messages,
        };

        const updatedConversations = conversationId 
        ? conversations.map(conv => conv.id === conversation.id ? conversation : conv)
        : [...conversations, conversation];

        updatedConversations.sort((a, b) => b.timestamp - a.timestamp); // Sort by timestamp in descending order
        setConversations(updatedConversations);
        saveConversationsToLocalStorage(updatedConversations);

        if (!conversationId) {
        setConversationId(conversation.id);
        }
    };

    //handling UI
    //const handleOverlayTrayChange = (trayIsOverlayed: boolean) => {
        //setDrawerOverlayed(trayIsOverlayed);
    //};
    const handleTrayDismiss = () => {
        setDrawerOpen(false);
    };
    //const handleTrayOpened = () => {
        //console.log("I should be opening");
    //};

    //UseEffect methods
    

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch('http://localhost/api/llm/show-current', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (response.status === 401) {
                    throw new Error('Unauthorized. You may need to relaunch this page.');
                }

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const result = await response.json();
                //should always contain context as that is passed in token
                setContextTitle(result.data.lms_context_title);
                if (result.status !== 'success') {
                    setIsLlmSet(false);
                }
            } catch (error: unknown) {
                if (isError(error)) {
                    setErrors(prevErrors => [...prevErrors, error.message]);
                } else {
                    setErrors(prevErrors => [...prevErrors, 'An unknown error occurred.']);
                }
            }
        };

        fetchData();

        return () => {
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
            }
        };

    }, []); // Adding `token` to the dependency array

    useEffect(() => {
        // Check if the length of messages has increased - only want to update an opened conversation if it has been added to
        if (messages.length > prevMessagesLengthRef.current) {
            saveCurrentConversation();
        }
        prevMessagesLengthRef.current = messages.length;
    
        //console.log('Updated messages:', messages);
        if (responseContainerRef.current) {
            responseContainerRef.current.scrollTop = responseContainerRef.current.scrollHeight;
        }
    }, [messages]);

    useEffect(() => {
        const storedConversations = localStorage.getItem('conversations');
        if (storedConversations) {
          setConversations(JSON.parse(storedConversations));
        }
      }, []);

    return (

        <View
            height="100vh"
            as="div"
            background="primary"
            position="relative"
        >
            <DrawerLayout
                //minWidth="10em"
                //onOverlayTrayChange={handleOverlayTrayChange}
            >
                <DrawerLayout.Tray
                    id="DrawerLayoutTray"
                    placement="start"
                    label="Conversations"
                    open={drawerOpen}
                    onDismiss={handleTrayDismiss}
                >
                    
                    <div className="chat-drawer-tray-header">
                        <div className="left-buttons">
                            <IconButton
                                screenReaderLabel="Hide conversations"
                                onClick={handleTrayDismiss}
                            >
                                <IconHamburgerLine />
                            </IconButton>
                        </div>
                        <div className="right-buttons">
                            <IconButton
                                screenReaderLabel="New Conversation"
                                onClick={handleNewConversation}
                            >
                                <IconDiscussionNewLine />
                            </IconButton>
                        </div>
                    </div>
                    <Conversations 
                        conversations={conversations} // Pass conversations as a prop
                        onSelectConversation={handleSelectConversation} 
                        onDeleteAllConversations={handleDeleteAllConversations}
                    />
                </DrawerLayout.Tray>
                <DrawerLayout.Content 
                    label="Chat"
                >
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100%'}}>
                    {drawerOpen === false && (
                        <div className="chat-drawer-content-floating-buttons">
                            <IconButton
                                screenReaderLabel="Show conversations"
                                onClick={() => {
                                    setDrawerOpen(true);
                                }}
                                //aria-haspopup={drawerOverlayed ? "dialog" : "region"}
                                    aria-controls="DrawerLayoutTray"
                                >
                                <IconHamburgerLine />
                            </IconButton>
                            <IconButton
                                screenReaderLabel="New Conversation"
                                onClick={handleNewConversation}
                                >
                                    <IconDiscussionNewLine />
                            </IconButton>
                        </div>
                    )}
                        {errors.length > 0 && (
                            <div>
                                {errors.map((error, index) => (
                                    <Alert key={index} variant="error" margin="small">
                                        {error}
                                    </Alert>
                                ))}
                            </div>
                        )}

                        {!isLlmSet ? (
                            <>
                                <Alert variant="warning" margin="small">
                                    No ChatGPT API key set for: {contextTitle}. Please enter a key below:
                                </Alert>
                                <form onSubmit={(e) => { e.preventDefault(); handleApiSubmit(); }}>
                                    <TextInput
                                        value={apiKey}
                                        display="inline-block"
                                        renderLabel={<ScreenReaderContent>API Key</ScreenReaderContent>}
                                        placeholder="ChatGPT API Key"
                                        onChange={(e) => setApiKey(e.target.value)}
                                    />
                                    <Button margin="xx-small" type="submit">
                                        Submit
                                    </Button>
                                </form>
                            </>
                        ) : (
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', margin: '0 auto', padding: '1rem', boxSizing: 'border-box', width: '100%' }}>
                                <div ref={responseContainerRef} style={{ flex: 1, overflowY: 'auto', borderRadius: '5px', textAlign: 'left', whiteSpace: 'pre-wrap' }}>
                                {messages.map((msg, index) => (
                                    <div key={index} style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '10px' }}>
                                        {msg.role !== 'user' && (
                                            <Avatar name="Artificial intelligence" size="small" margin="0 small 0 0" />
                                        )}
                                        <div key={index} 
                                            style={{ 
                                                padding: msg.role === 'user' ? '10px' : '10px 0', // Remove left and right padding for non-user messages
                                                background: msg.role === 'user' ? '#eee' : '#fff', 
                                                marginBottom: '10px', 
                                                borderRadius: '5px',
                                                marginLeft: msg.role === 'user' ? '25%' : '0', // Add left margin to user messages
                                                width: msg.role === 'user' ? '75%' : '100%', // Adjust width accordingly
                                                boxSizing: 'border-box' // Ensure padding and borders are included in the width calculation 
                                            }}>
                                            {msg.content}
                                        </div>
                                    </div>
                                    ))}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', marginTop: '1rem', width: '100%' }}>
                                    <TextArea
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        placeholder="Type your message here..."
                                        label={<ScreenReaderContent>Message</ScreenReaderContent>}
                                        maxHeight='33vh'
                                        height='64px'
                                        style={{ flexGrow: 1, marginRight: '0.5rem', maxHeight: '33vh', overflowY: 'auto', width: '100%' }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                sendMessage();
                                            }
                                        }}
                                    />
                                    <IconButton
                                        screenReaderLabel="Send message"
                                        onClick={sendMessage} 
                                        disabled={!message.trim()}
                                        withBackground={false} 
                                        withBorder={false}
                                        size="large"
                                        margin="xx-small"
                                        //aria-haspopup={drawerOverlayed ? "dialog" : "region"}
                                            //aria-controls="DrawerLayoutTray"
                                        >
                                        <IconCircleArrowUpSolid />
                                    </IconButton>
                                    
                                </div>
                            </div>
                        )}
                    </div>
                </DrawerLayout.Content>
            </DrawerLayout>
        </View>
    );
}

export default Chat;