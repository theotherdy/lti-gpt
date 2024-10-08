import { useState, useEffect, useRef } from 'react';

import ReactMarkdown from 'react-markdown';
import { PulseLoader } from 'react-spinners';
//import { encoding_for_model } from 'tiktoken';

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
//import { ToggleDetails } from '@instructure/ui-toggle-details'
import { View } from '@instructure/ui-view';

import { CustomEventSource } from './CustomEventSource';
import Conversations from './Conversations'; // Import the new Conversations component
import { Message, Conversation, ConversationDataFromAPI } from './Interfaces';
import UserConversationsSummary from './UserConversationsSummary';


// Define the types for the props of Chat
interface ChatProps {
    token: string;
  }

const Chat: React.FC<ChatProps> = ({token}) => {
    //context and api key
    const [apiKey, setApiKey] = useState<string>('');
    const [systemPrompt, setSystemPrompt] = useState<string>('');
    const [isAPIKeySet, setIsAPIKeySet] = useState(true); //default to true to avoid flickering up warning message
    const [isInstructor, setIsInstructor] = useState(false);
    const [contextId, setContextId] = useState<string>(''); 
    const [contextTitle, setContextTitle] = useState<string>(''); 

    //variables
    const [message, setMessage] = useState<string>('');
    const partialAssistantMessageRef = useRef<string>(''); // Ref to hold concatenated response
    const [messages, setMessages] = useState<Message[]>([]);
    const messagesRef = useRef<Message[]>([]); // Ref to hold the messages array which will be current when sent to the API
    const prevMessagesLengthRef = useRef<number>(messages.length); //used to chcek if lenbgth of conversation has increased
    const [isTyping, setIsTyping] = useState<boolean>(false); // New state for typing indicator

    // Initialize the tokenizer for the specific model (e.g., GPT-4)
    //const tokenizer = encoding_for_model("gpt-4");
        
    //const [conversationId, setConversationId] = useState<string | null>(null);
    const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
    const [conversations, setConversations] = useState<Conversation[]>([]);

    const [errors, setErrors] = useState<string[]>([]);
    
    //interface    
    const [drawerOpen, setDrawerOpen] = useState(true);
    const responseContainerRef = useRef<HTMLDivElement | null>(null); //A reference to the div showing the responses. It allows scrolling to the bottom when new responses come in.
    const eventSourceRef = useRef<CustomEventSource | null>(null);//event source

    const isStreamFinishedRef = useRef(false); // Track if the streaming from the assistant is complete

    //Swap the below for local vs prpd.
    const baseAPIUrl = "https://learntech.medsci.ox.ac.uk/lti-gpt-api/";
    //const baseAPIUrl = "http://localhost/";
        
    //TODO temp token here - will move
    //const token = ""; // Assuming this will be provided or managed elsewhere

    // Type guard to check if the error is of type Error
    const isError = (err: unknown): err is Error => {
        return err instanceof Error;
    };

    const estimateTokens = (text: string) => {
        // Basic word count as an approximation of tokens
        return text.split(/\s+/).length;
    };

    const handleApiKeyPost = async () => {
        //const res = await fetch(`http://localhost/api/context/${contextId}`, {
        const res = await fetch(`${baseAPIUrl}api/context/${contextId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ apiKey: apiKey, systemPrompt: systemPrompt }),
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
        //console.log(data.data.llm_id);
        return data
    };

    const handleApiSubmit = async () => {
        try {
            const data = await handleApiKeyPost();
            if(data.is_API_key_set === true){
                setIsAPIKeySet(true);
                //console.log('API key is set');
            }
            if(data.context.system_prompt){
                setSystemPrompt(data.context.system_prompt);
            } else {
                setSystemPrompt('');
            }
            
        } catch (error) {
            if (isError(error)) {
                setErrors(prevErrors => [...prevErrors, error.message]);
            } else {
                setErrors(prevErrors => [...prevErrors, 'An unknown error occurred.']);
            }
        }
    };

    /* 
    * Messaging functions below
    */

    const getOrCreateCurrentConversation = async () => {
        if (!currentConversation) {
            try {
                // Create a new conversation if there's no existing conversationId
                // @ts-expect-error Type 'undefined' is not assignable to type 'Conversation'
                const newConversation: Conversation = await createNewConversation();
    
                //console.log(newConversation);
    
                //const updatedConversations = [...conversations, newConversation];
                setConversations(prevConversations => [...prevConversations, newConversation]);
                //setConversations(updatedConversations);
                setCurrentConversation(newConversation);
                return newConversation;
            } catch (error) {
                console.error('Error creating new conversation:', error);
                setErrors((prevErrors) => [...prevErrors, 'An error occurred while creating a new conversation.']);
                throw error; // Rethrow the error to be handled by the caller if necessary
            }
        } else {
            return currentConversation;
        }
    };

    // Deals wiith fact that conversations from API contain created_at dates, whereas we need timstamp dates for loacl Conversations array.
    function processConversations(conversations: ConversationDataFromAPI[]): Conversation[] {
        return conversations.map((conv: ConversationDataFromAPI) => {
        const timestamp = new Date(conv.updated_at).getTime(); // Convert to numeric timestamp
        return { 
            id: conv.id,
            timestamp,
            messages: [] // Note that this is not currently used on front-end (except as a way to deliver messages to API to save)
        };
        });
    }
    
    
    const sendMessage = async () => {
        if (!message.trim()) return;
    
        const newMessage: Message = { role: 'user', content: message, tokens: estimateTokens(message) };
        const systemMessage: Message = { role: 'system', content: systemPrompt, tokens: 0 }; // Add system message
        
        // Create or get the current conversation first
        const currentConversation = await getOrCreateCurrentConversation();
        
        // Update messages state and ref
        const updatedMessages: Message[] = [...messagesRef.current, newMessage];
        setMessages(updatedMessages);
        messagesRef.current = updatedMessages;
        setMessage(''); // Clear the input textarea
        setIsTyping(true); // Start typing indicator
        isStreamFinishedRef.current = false;
            
        // Reset partial message for new input
        partialAssistantMessageRef.current = '';

        //let promptTokens = 0;
        let completionTokens = 0;  //the number of tokens returned by the completions API
        //let totalTokens = 0;
    
        // Close any existing EventSource connections
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
        }

        let messagesToSend: Message[] = [...updatedMessages]; 
        if(systemPrompt){
            messagesToSend = [systemMessage, ...updatedMessages]; // Include system message
        }
        
    
        // Transform messages to an array of objects with 'role' and 'content' keys
        const transformedMessages = messagesToSend.map(msg => ({ role: msg.role, content: msg.content }));
    
        try {
            //eventSourceRef.current = new CustomEventSource(`http://localhost/api/llm/chat`, {
            eventSourceRef.current = new CustomEventSource(`${baseAPIUrl}api/llm/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ 
                    messages: transformedMessages,
                    conversationId: currentConversation.id
                }),
            });
    
            eventSourceRef.current.addEventListener('message', (event: MessageEvent) => {
                try {
                  if (event.data.trim() === "[DONE]") {
                    //console.log("Final assistant message:", partialAssistantMessageRef.current); // Log the final message
                    isStreamFinishedRef.current = true; // Mark stream as finished
                    // When API call is done, finalize the assistant's message and stop typing
                    setMessages((prevMessages) => {
                      const newMessages = prevMessages.map(message =>
                        message.role === 'assistant' && message.content === partialAssistantMessageRef.current
                          ? { ...message, content: partialAssistantMessageRef.current, tokens: completionTokens }
                          : message
                      );
                      messagesRef.current = newMessages; // Update messagesRef
                      return newMessages;
                    });

                    setIsTyping(false); // Stop typing indicator
                    return;
                  }

                  isStreamFinishedRef.current = false; // Mark stream as still going
              
                  const parsedData = JSON.parse(event.data.trim());
              
                  if (parsedData.usage) {
                    completionTokens = parsedData.usage.completion_tokens || 0;
                  }
              
                  if (parsedData.choices && parsedData.choices[0] && parsedData.choices[0].delta) {
                    if (parsedData.choices[0].delta.content) {
                      const assistantMessage = parsedData.choices[0].delta.content;
                      partialAssistantMessageRef.current += assistantMessage; // Concatenate the AI's response progressively
                      //console.log("assistantMessage:", partialAssistantMessageRef.current);
              
                      setMessages((prevMessages) => {
                        const lastMessage = prevMessages[prevMessages.length - 1];
              
                        // Check if the last message is from the assistant
                        if (lastMessage.role === 'assistant') {
                          // Update the content of the last assistant message
                          return prevMessages.map((message, index) => {
                            if (index === prevMessages.length - 1 && message.role === 'assistant') {
                              return { ...message, content: partialAssistantMessageRef.current };
                            }
                            return message;
                          });
                        } else {
                          // If the last message is not from the assistant, add a new assistant message
                          return [
                            ...prevMessages,
                            { role: 'assistant', content: partialAssistantMessageRef.current, tokens: completionTokens }
                          ];
                        }
                      });
                    }
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
                setIsTyping(false); // Stop typing indicator
            });
        } catch (error) {
            console.error('Error initializing event source:', error);
            setIsTyping(false); // Stop typing indicator
            setErrors((prevErrors) => [...prevErrors, 'An error occurred while initializing event source.']);
        }
    };

    const handleSelectConversation = async (conversation: Conversation) => {
        try {
            //const response = await fetch(`http://localhost/api/conversation/${conversation.id}`, {
            const response = await fetch(`${baseAPIUrl}api/conversation/${conversation.id}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });
    
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
    
            const result = await response.json();
            if (result.status === 'success') {
                const selectedConversation = result.conversation;
                setCurrentConversation(selectedConversation);
                setMessages(selectedConversation.messages);
                messagesRef.current = selectedConversation.messages;
                prevMessagesLengthRef.current = selectedConversation.messages.length;
            }
        } catch (error) {
            console.error('Error fetching conversation:', error);
            setErrors((prevErrors) => [...prevErrors, 'An error occurred while fetching the conversation.']);
        }
    };
    

    const handleNewConversation = async () => {
        setCurrentConversation(null);
        setMessages([]);
        messagesRef.current = [];
        setMessage(''); // Clear the input textarea
    };

    const createNewConversation = async () => {
        try {
            //const response = await fetch('http://localhost/api/conversation', {
            const response = await fetch(`${baseAPIUrl}api/conversation`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });
    
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
    
            const result = await response.json();
            if (result.status === 'success') {
                const newConversation = {
                    id: result.conversation.id,
                    timestamp: new Date(result.conversation.updated_at).getTime(),
                    messages: [],
                };
                return newConversation;
            }
        } catch (error) {
            if (isError(error)) {
                setErrors(prevErrors => [...prevErrors, error.message]);
            } else {
                setErrors(prevErrors => [...prevErrors, 'An unknown error occurred.']);
            }
        }
    }

    const handleDeleteAllConversations = async () => {
        const deletePromises = conversations.map(conversation =>
            handleDeleteConversation(conversation.id)
        );
        
        try {
            await Promise.all(deletePromises);
            //localStorage.removeItem('conversations');
            setCurrentConversation(null);
            setConversations([]); // Clear the state so the UI updates accordingly
            setMessages([]);
            messagesRef.current = [];
            partialAssistantMessageRef.current = ''; // Clear partial assistant message
            if (eventSourceRef.current) {
                eventSourceRef.current.close(); // Close any open EventSource connection
                eventSourceRef.current = null;
            }
        } catch (error) {
            if (isError(error)) {
                setErrors(prevErrors => [...prevErrors, error.message]);
            } else {
                setErrors(prevErrors => [...prevErrors, 'An unknown error occurred while deleting all conversations.']);
            }
        }
    };
    
    // Ensure handleDeleteConversation is defined as an async function
    const handleDeleteConversation = async (conversationId: string) => {
        try {
            //const response = await fetch(`http://localhost/api/conversation/${conversationId}`, {
            const response = await fetch(`${baseAPIUrl}api/conversation/${conversationId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });
    
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
    
            const result = await response.json();
            if (result.status === 'success') {
                const updatedConversations = conversations.filter(conv => conv.id !== conversationId);
                setConversations(updatedConversations);
                //saveConversationsToLocalStorage(updatedConversations);
            }
        } catch (error) {
            if (isError(error)) {
                setErrors(prevErrors => [...prevErrors, error.message]);
            } else {
                setErrors(prevErrors => [...prevErrors, 'An unknown error occurred.']);
            }
        }
    };

    const saveLatestMessageToConversation = async () => {
        try {
            const conversationToUpdate = await getOrCreateCurrentConversation();
            conversationToUpdate.messages = [messages[messages.length - 1]];
            //conversationToUpdate.messages = [...conversationToUpdate.messages, latestMessage];

            //console.log(conversationToUpdate);

            //console.log(conversationToUpdate);
            //const response = await fetch(`http://localhost/api/conversation/${conversationToUpdate.id}`, {
            const response = await fetch(`${baseAPIUrl}api/conversation/${conversationToUpdate.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(conversationToUpdate),
            });
    
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
    
            const result = await response.json();
            //console.log('Conversation saved to server:', result);
            //setConversations(result.conversations); //result should be an updated list of conversations
            setConversations(processConversations(result.conversations));
        } catch (error) {
            console.error('Error saving conversation to server:', error);
        }
    }
    
    
    const fetchConversations = async () => {
        try {
            //const response = await fetch('http://localhost/api/conversations', {
            const response = await fetch(`${baseAPIUrl}api/conversations`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            if (result.status === 'success') {
                //const storedConversations = JSON.parse(localStorage.getItem('conversations') || '[]');
                /*const updatedConversations = result.conversations.map((conv: ConversationDataFromAPI) => {
                    const timestamp = new Date(conv.created_at).getTime(); // Convert to numeric timestamp
                    return { ...conv, timestamp };
                });*/
                setConversations(processConversations(result.conversations));
                //setConversations(updatedConversations);
                //saveConversationsToLocalStorage(updatedConversations);
            }
        } catch (error) {
            if (isError(error)) {
                setErrors(prevErrors => [...prevErrors, error.message]);
            } else {
                setErrors(prevErrors => [...prevErrors, 'An unknown error occurred.']);
            }
        }
    };

    const handleTrayDismiss = () => {
        setDrawerOpen(false);
    };
    
    //UseEffect methods
   
    useEffect(() => {
        const fetchData = async () => {
            try {
                //const response = await fetch('http://localhost/api/context/show-current', {
                const response = await fetch(`${baseAPIUrl}api/context/show-current`, {
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
                setContextId(result.context.id)
                if(result.context.system_prompt){
                    setSystemPrompt(result.context.system_prompt);
                } else {
                    setSystemPrompt('');
                }
                
                setContextTitle(result.context.lms_context_title);
                //setIsAPIKeySet(false);
                if (result.status !== 'success' || result.is_API_key_set !== true) {
                    setIsAPIKeySet(false);
                }
                /*if (!result.context.API_key) {
                    setIsAPIKeySet(false);
                } else {
                    setApiKey(result.context.API_key);
                }*/
                if (result.is_instructor === true) {
                    setIsInstructor(true);
                }
                setIsInstructor
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

    }, []); 

    useEffect(() => {
        //console.log('messages.length: ' + messages.length);
        //console.log('prevMessagesLengthRef.current: ' + prevMessagesLengthRef.current);
    
        // Save user message immediately when messages.length increases
        if (messages.length > prevMessagesLengthRef.current) {
            const lastMessage = messages[messages.length - 1];
    
            if (lastMessage && lastMessage.role === 'user') {
                // Save immediately if it's a user message
                saveLatestMessageToConversation();
            }
        }
    
        // Check if the assistant's message content (partialAssistantMessageRef) has changed
        if (isStreamFinishedRef.current && partialAssistantMessageRef.current) {
            const lastMessage = messages[messages.length - 1];
    
            // If the last message is from the assistant, and the stream is finished, save it
            if (lastMessage && lastMessage.role === 'assistant' && lastMessage.content === partialAssistantMessageRef.current) {
                saveLatestMessageToConversation();
                isStreamFinishedRef.current = false;
            }
        }
    
        // Update previous message length reference for user messages
        prevMessagesLengthRef.current = messages.length;
    
        // Scroll to bottom when messages update
        if (responseContainerRef.current) {
            responseContainerRef.current.scrollTop = responseContainerRef.current.scrollHeight;
        }
    }, [messages, partialAssistantMessageRef.current]); // Trigger on messages or partial message updates

    useEffect(() => {
        fetchConversations();
      }, []);

    return (

        <View
            height="100vh"
            as="div"
            background="primary"
            position="relative"
        >
        {!isAPIKeySet && (
            <Alert variant="warning" margin="small">
                No ChatGPT API key set for: {contextTitle}. {isInstructor && (<View>Please enter a key (and optional system prompt) below.</View>)}
            </Alert>
        )}
        {isInstructor == true ? (
            <>
                <UserConversationsSummary baseAPIUrl={baseAPIUrl}  token={token}/>
                {!isAPIKeySet && (
                    <View
                        padding="small"
                        as="div"
                        >
                        <form onSubmit={(e) => { e.preventDefault(); handleApiSubmit(); }}>
                            <TextInput
                                isRequired={true}
                                value={apiKey}
                                renderLabel="API Key"
                                placeholder="ChatGPT API Key"
                                onChange={(e) => setApiKey(e.target.value)}
                            />
                            <br />
                            <TextArea
                                value={systemPrompt}
                                onChange={(e) => setSystemPrompt(e.target.value)}
                                placeholder="Type any system prompt (general instructions for how you would like the LLM to behave) here..."
                                label="System Prompt"
                                maxHeight='33vh'
                                height='64px'
                                style={{ flexGrow: 1, marginRight: '0.5rem', maxHeight: '33vh', overflowY: 'auto', width: '100%' }}
                            />
                            <Button margin="xx-small" type="submit">
                                Submit
                            </Button>
                            
                        </form>
                    </View>
                )}
            </>
        ) : (
            <DrawerLayout >
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
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', margin: '0 auto', padding: '1rem', boxSizing: 'border-box', width: '100%' }}>
                            <div ref={responseContainerRef} style={{ flex: 1, overflowY: 'auto', borderRadius: '5px', textAlign: 'left', whiteSpace: 'pre-wrap' }}>
                            {messages.map((msg, index) => (
                                <div key={index} className="chat-message">
                                    {msg.role !== 'user' && (
                                        <Avatar name="Artificial intelligence" size="small" style={{ marginRight: '10px', marginTop: '10px' }} />
                                    )}
                                    <div 
                                        className="message-content"
                                        style={{
                                            padding: msg.role === 'user' ? '0px 10px 10px 10px' : '0px 15px 10px 15px', // Added padding for AI messages
                                            background: msg.role === 'user' ? '#eee' : '#fff',
                                            borderRadius: '5px',
                                            width: '100%',
                                            marginLeft: msg.role === 'user' ? '25%' : '0',
                                            maxWidth: msg.role === 'user' ? '75%' : 'calc(100% - 60px)', // Adjust width with respect to the avatar
                                            boxSizing: 'border-box',
                                            whiteSpace: 'normal',
                                            flex: 1,
                                        }}
                                    >
                                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                                    </div>
                                </div>
                            ))}
                            {isTyping && (
                                <div className="chat-message" style={{ display: 'flex', alignItems: 'center'}}>
                                    <Avatar name="Artificial intelligence" size="small" style={{ marginRight: '10px', marginTop: '10px' }} />
                                    <div className="message-content" style={{ background: '#fff', borderRadius: '5px', padding: '10px 15px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                            <PulseLoader size={10} color={"#0374B5"} />
                                        </div>
                                    </div>
                                </div>
                            )}
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
                                    >
                                    <IconCircleArrowUpSolid />
                                </IconButton>
                                
                            </div>
                        </div>
                    </div>
                </DrawerLayout.Content>
            </DrawerLayout>
          )}  
        </View>
    );
}

export default Chat;