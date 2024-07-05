import { useState, useEffect, useRef } from 'react';

import { Alert } from '@instructure/ui-alerts';
import { Button } from '@instructure/ui-buttons';
import { ScreenReaderContent } from '@instructure/ui-a11y-content';
import { TextArea } from '@instructure/ui-text-area'
import { TextInput } from '@instructure/ui-text-input';

import { CustomEventSource } from './CustomEventSource';
import Conversations from './Conversations'; // Import the new Conversations component
import { Message, Conversation } from './Interfaces';


function Chat() {
    const [message, setMessage] = useState<string>('');
    //const [partialAssistantMessage, setPartialAssistantMessage] = useState<string>(''); // State to hold concatenated response
    const partialAssistantMessageRef = useRef<string>(''); // Ref to hold concatenated response
    //let partialAssistantMessageRef = '';
    const [messages, setMessages] = useState<Message[]>([]);
    const messagesRef = useRef<Message[]>([]); // Ref to hold the messages array which will be current when sent to the API
    const [apiKey, setApiKey] = useState<string>('');
    const [contextTitle, setContextTitle] = useState<string>(''); 
    const [errors, setErrors] = useState<string[]>([]);
    const [isLlmSet, setIsLlmSet] = useState(true); //default to true to avoid flickering up warning message
    const responseContainerRef = useRef<HTMLDivElement | null>(null); //A reference to the div showing the responses. It allows scrolling to the bottom when new responses come in.
    const eventSourceRef = useRef<CustomEventSource | null>(null);

    const [conversationId, setConversationId] = useState<string | null>(null);
    const [conversations, setConversations] = useState<Conversation[]>([]);

    const token = "eyJraWQiOiJsdGktand0LWlkIiwidHlwIjoiSldUIiwiYWxnIjoiUlMyNTYifQ.eyJodHRwczpcL1wvcHVybC5pbXNnbG9iYWwub3JnXC9zcGVjXC9sdGlcL2NsYWltXC9sdGkxMV9sZWdhY3lfdXNlcl9pZCI6IjdlYjdjZDQxYmRjYWM2MTMxZDcyMzBlOTVmNzllNDBhYzczMzdlODgiLCJzdWIiOiIyZDRjMTJmOC0yYThjLTQyODUtOWM2YS04MTZiNDljYmYxODUiLCJodHRwczpcL1wvcHVybC5pbXNnbG9iYWwub3JnXC9zcGVjXC9sdGlcL2NsYWltXC9kZXBsb3ltZW50X2lkIjoiMzM5ODE6YjFkM2ZkZjE2MGE2NjllODYyOGRhZjU0NjljN2RkZDk4Y2RhZDc5YiIsImh0dHBzOlwvXC9wdXJsLmltc2dsb2JhbC5vcmdcL3NwZWNcL2x0aVwvY2xhaW1cL3ZlcnNpb24iOiIxLjMuMCIsImh0dHBzOlwvXC9wdXJsLmltc2dsb2JhbC5vcmdcL3NwZWNcL2x0aVwvY2xhaW1cL2x0aTFwMSI6eyJ1c2VyX2lkIjoiN2ViN2NkNDFiZGNhYzYxMzFkNzIzMGU5NWY3OWU0MGFjNzMzN2U4OCIsInZhbGlkYXRpb25fY29udGV4dCI6bnVsbCwiZXJyb3JzIjp7ImVycm9ycyI6e319fSwiaXNzIjoiaHR0cHM6XC9cL2x0aS5jYW52YXMub3guYWMudWsiLCJsb2NhbGUiOiJlbi1HQiIsImh0dHBzOlwvXC9wdXJsLmltc2dsb2JhbC5vcmdcL3NwZWNcL2x0aVwvY2xhaW1cL3Rvb2xfcGxhdGZvcm0iOnsidmFsaWRhdGlvbl9jb250ZXh0IjpudWxsLCJuYW1lIjoiVW5pdmVyc2l0eSBvZiBPeGZvcmQiLCJndWlkIjoiNWtCSFF5aHY3WFB0YnE4NGc4WTRLWWJ5SG1yUzdvZFVSUjZOcmlCdjpjYW52YXMtbG1zIiwicHJvZHVjdF9mYW1pbHlfY29kZSI6ImNhbnZhcyIsInZlcnNpb24iOiJjbG91ZCIsImVycm9ycyI6eyJlcnJvcnMiOnt9fX0sImh0dHBzOlwvXC9wdXJsLmltc2dsb2JhbC5vcmdcL3NwZWNcL2x0aVwvY2xhaW1cL2N1c3RvbSI6eyJwZXJzb25fbmFtZV9naXZlbiI6IkRhbWlvbiIsImNhbnZhc191c2VyX3ByZWZlcnNfaGlnaF9jb250cmFzdCI6ImZhbHNlIiwiY2FudmFzX2FjY291bnRfaWQiOiI0IiwicGVyc29uX25hbWVfZmFtaWx5IjoiWW91bmciLCJjYW52YXNfdXNlcl9zaXNfaWQiOiJtZGl2MDA0NCIsImNhbnZhc19hY2NvdW50X25hbWUiOiIyQiBNZWRpY2FsIFNjaWVuY2VzIiwiY2FudmFzX2FwaV9iYXNlX3VybCI6Imh0dHBzOlwvXC9jYW52YXMub3guYWMudWsiLCJiYWNrZW5kIjoiaHR0cHM6XC9cL2V4dGVybmFsLXVzZXItbWd0LmNhbnZhcy5veC5hYy51ayIsInBlcnNvbl9lbWFpbF9wcmltYXJ5IjoiZGFtaW9uLnlvdW5nQG1lZHNjaS5veC5hYy51ayIsImNhbnZhc19tZW1iZXJzaGlwX3JvbGVzIjoiQWNjb3VudCBBZG1pbixMb2NhbCBDYW52YXMgQ29vcmRpbmF0b3IiLCJjYW52YXNfdXNlcl9pZCI6IjM5IiwiY29tX2luc3RydWN0dXJlX2JyYW5kX2NvbmZpZ19qc29uX3VybCI6Imh0dHBzOlwvXC9kdTExaGpjdngwdXFiLmNsb3VkZnJvbnQubmV0XC9kaXN0XC9icmFuZGFibGVfY3NzXC9mNTU3NDU1NWE5MjM4M2YxMDA2YWFhNGRmOTkzMGU1MVwvdmFyaWFibGVzLTdkZDRiODA5MThhZjBlMDIxOGVjMDIyOWU0YmQ1ODczLmpzb24ifSwiaHR0cHM6XC9cL3d3dy5pbnN0cnVjdHVyZS5jb21cL3BsYWNlbWVudCI6ImFjY291bnRfbmF2aWdhdGlvbiIsImF6cCI6IjEyMjAxMDAwMDAwMDAwMDE1NiIsImh0dHBzOlwvXC9wdXJsLmltc2dsb2JhbC5vcmdcL3NwZWNcL2x0aVwvY2xhaW1cL2xpcyI6eyJjb3Vyc2Vfb2ZmZXJpbmdfc291cmNlZGlkIjoiJENvdXJzZVNlY3Rpb24uc291cmNlZElkIiwidmFsaWRhdGlvbl9jb250ZXh0IjpudWxsLCJwZXJzb25fc291cmNlZGlkIjoibWRpdjAwNDQiLCJlcnJvcnMiOnsiZXJyb3JzIjp7fX19LCJodHRwczpcL1wvcHVybC5pbXNnbG9iYWwub3JnXC9zcGVjXC9sdGlcL2NsYWltXC9sYXVuY2hfcHJlc2VudGF0aW9uIjp7ImRvY3VtZW50X3RhcmdldCI6ImlmcmFtZSIsInZhbGlkYXRpb25fY29udGV4dCI6bnVsbCwid2lkdGgiOjgwMCwicmV0dXJuX3VybCI6Imh0dHBzOlwvXC9jYW52YXMub3guYWMudWtcL2FjY291bnRzXC80XC9leHRlcm5hbF9jb250ZW50XC9zdWNjZXNzXC9leHRlcm5hbF90b29sX3JlZGlyZWN0IiwibG9jYWxlIjoiZW4tR0IiLCJlcnJvcnMiOnsiZXJyb3JzIjp7fX0sImhlaWdodCI6NDAwfSwiZXhwIjoxNzIwMjA2MTEzLCJpYXQiOjE3MjAxNzczMTMsImVtYWlsIjoiZGFtaW9uLnlvdW5nQG1lZHNjaS5veC5hYy51ayIsInRvb2xfc3VwcG9ydF9lbmRwb2ludCI6Imh0dHBzOlwvXC90b29scy5jYW52YXMub3guYWMudWsiLCJodHRwczpcL1wvcHVybC5pbXNnbG9iYWwub3JnXC9zcGVjXC9sdGlcL2NsYWltXC9yb2xlcyI6WyJodHRwOlwvXC9wdXJsLmltc2dsb2JhbC5vcmdcL3ZvY2FiXC9saXNcL3YyXC9pbnN0aXR1dGlvblwvcGVyc29uI0FkbWluaXN0cmF0b3IiLCJodHRwOlwvXC9wdXJsLmltc2dsb2JhbC5vcmdcL3ZvY2FiXC9saXNcL3YyXC9pbnN0aXR1dGlvblwvcGVyc29uI0luc3RydWN0b3IiLCJodHRwOlwvXC9wdXJsLmltc2dsb2JhbC5vcmdcL3ZvY2FiXC9saXNcL3YyXC9pbnN0aXR1dGlvblwvcGVyc29uI1N0dWRlbnQiLCJodHRwOlwvXC9wdXJsLmltc2dsb2JhbC5vcmdcL3ZvY2FiXC9saXNcL3YyXC9zeXN0ZW1cL3BlcnNvbiNVc2VyIl0sImdpdmVuX25hbWUiOiJEYW1pb24iLCJub25jZSI6ImVmODNkYWY2LTI2OTctNGM1My05M2U3LTdlYzY3NmQ5OGMxNCIsInBpY3R1cmUiOiJodHRwczpcL1wvY2FudmFzLm94LmFjLnVrXC9pbWFnZXNcL3RodW1ibmFpbHNcLzEzMjk4XC9IYm5FaGxKSDFGaVNMV1lUWmxQbHhZRTgzaUc2OTRNS204bkNTdGZQIiwiaHR0cHM6XC9cL3B1cmwuaW1zZ2xvYmFsLm9yZ1wvc3BlY1wvbHRpXC9jbGFpbVwvcmVzb3VyY2VfbGluayI6eyJ2YWxpZGF0aW9uX2NvbnRleHQiOm51bGwsImRlc2NyaXB0aW9uIjpudWxsLCJpZCI6Ijk3MmZjYTZmODhhNzY2NTQ2Nzk5Nzc2YWM4Mjg3ZGY4MWUyYmJlMmMiLCJ0aXRsZSI6IjJCIE1lZGljYWwgU2NpZW5jZXMiLCJlcnJvcnMiOnsiZXJyb3JzIjp7fX19LCJodHRwczpcL1wvcHVybC5pbXNnbG9iYWwub3JnXC9zcGVjXC9sdGlcL2NsYWltXC90YXJnZXRfbGlua191cmkiOiJodHRwczpcL1wvc3RhdGljLmNhbnZhcy5veC5hYy51a1wvZXh0LXVzZXItbWd0XC9pbmRleC5odG1sIiwiaHR0cHM6XC9cL3B1cmwuaW1zZ2xvYmFsLm9yZ1wvc3BlY1wvbHRpXC9jbGFpbVwvY29udGV4dCI6eyJ2YWxpZGF0aW9uX2NvbnRleHQiOm51bGwsImlkIjoiOTcyZmNhNmY4OGE3NjY1NDY3OTk3NzZhYzgyODdkZjgxZTJiYmUyYyIsInRpdGxlIjoiMkIgTWVkaWNhbCBTY2llbmNlcyIsInR5cGUiOlsiQWNjb3VudCJdLCJlcnJvcnMiOnsiZXJyb3JzIjp7fX19LCJhdWQiOiIxMjIwMTAwMDAwMDAwMDAxNTYiLCJodHRwczpcL1wvcHVybC5pbXNnbG9iYWwub3JnXC9zcGVjXC9sdGlcL2NsYWltXC9tZXNzYWdlX3R5cGUiOiJMdGlSZXNvdXJjZUxpbmtSZXF1ZXN0IiwiaXNzLW9yaWciOiJodHRwczpcL1wvY2FudmFzLmluc3RydWN0dXJlLmNvbSIsIm5hbWUiOiJEYW1pb24gWW91bmciLCJmYW1pbHlfbmFtZSI6IllvdW5nIiwiZXJyb3JzIjp7ImVycm9ycyI6e319fQ.jqRNEANRXx1uX0vfjWVnTznT0dW6Y1AVR7QL_ah2hnCeL6_g3ItRTD3LmduBGlHSqgJdOnFPG-oj1-s1zXqxdMFTXZN2efiKPMo9bWwUOybsvdj-Ch0PUkmX8Qy9LPUFgOsdTh3QN6260_AWDJ1dhS4q7lFGfRCs0VaLcxX3cSLtSU69--PmATTywfQxlLQ0zJs7k9Egj7aBSciG2pf7Ewa99cKKFYe6OLfP8tM4oEK8vVNmdIYeClYhPopqXhAWS1M4wCejkhNb50P3Zgw_tSLTsM4XsV-YXOKKV7uYFD_nnc9XF7epXW8j9gvSqNEtEDRFyufyn19BQom_i8DzqA"; // Assuming this will be provided or managed elsewhere

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
        //setMessages(prevMessages => [...prevMessages, { role: 'user', content: message }]);
        const newMessage: Message = { role: 'user', content: message };
        const updatedMessages: Message[] = [...messagesRef.current, newMessage]; // Use messagesRef.current

        setMessages(updatedMessages);
        messagesRef.current = updatedMessages; // Update messagesRef

        partialAssistantMessageRef.current = ''; // Reset partial message for new input
        //partialAssistantMessageRef = ''; // Reset partial message for new input

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
            //body: JSON.stringify({ message: message }),
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
                        //saveCurrentConversation(); // Save the conversation when it's done
                        return newMessages;
                    });
                    //setMessages(prevMessages => [...prevMessages, { role: 'assistant', content: partialAssistantMessageRef.current }]);
                    console.log(partialAssistantMessageRef.current );
                    //setMessages(prevMessages => [...prevMessages, { role: 'assistant', content: partialAssistantMessageRef }]);
                    //partialAssistantMessageRef.current = ''; // Clear after use
                    //partialAssistantMessageRef = ''; // Clear after use
                    return;
                }
                
                const parsedData = JSON.parse(event.data.trim());

                console.log(parsedData);
                
                if (parsedData.choices && parsedData.choices[0] && parsedData.choices[0].delta) {
                    if (parsedData.choices[0].delta.content) {
                        const assistantMessage = parsedData.choices[0].delta.content;
                        console.log(assistantMessage);
                        partialAssistantMessageRef.current += assistantMessage; // Concatenate response
                        //setMessages(prevMessages => [...prevMessages.slice(0, -1), { role: 'assistant', content: partialAssistantMessageRef.current }]);
                        //partialAssistantMessageRef += assistantMessage; // Concatenate response
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
    };

    const handleNewConversation = () => {
        saveCurrentConversation();
        setConversationId(null);
        setMessages([]);
        messagesRef.current = [];
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

        setConversations(updatedConversations);
        saveConversationsToLocalStorage(updatedConversations);

        if (!conversationId) {
        setConversationId(conversation.id);
        }
    };
    

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

    // Scroll to bottom on new response
    useEffect(() => {
        saveCurrentConversation();
        console.log('Updated messages:', messages);
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

    // Handle browser reload and conversation expiration
    /*useEffect(() => {
        window.addEventListener('beforeunload', () => {
        const now = Date.now();
        const expiredConversation = conversations.find(conversation => {
            const elapsedTime = now - conversation.timestamp;
            return elapsedTime > 3600000; // 1 hour in milliseconds
        });

        if (expiredConversation) {
            setConversationId(null);
            setMessages([]);
            messagesRef.current = [];
        } else {
            saveCurrentConversation();
        }
        });
    }, [conversations]);*/

    return (
        <div style={{ display: 'flex', height: '100vh' }}>
            <Conversations 
                onSelectConversation={handleSelectConversation} 
                onNewConversation={handleNewConversation} 
            />
            <div style={{ display: 'flex', flexDirection: 'column'}}>
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
                        <div ref={responseContainerRef} style={{ flex: 1, overflowY: 'auto', background: '#f6f6f6', padding: '1rem', borderRadius: '5px', textAlign: 'left', whiteSpace: 'pre-wrap' }}>
                        {messages.map((msg, index) => (
                            <div key={index} style={{ padding: '10px', background: msg.role === 'user' ? '#ddd' : '#fff', marginBottom: '10px', borderRadius: '5px' }}>
                                {msg.content}
                            </div>
                            ))}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-start', marginTop: '1rem', borderTop: '1px solid #ddd', paddingTop: '1rem' }}>
                            <TextArea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Type your message here..."
                                label={<ScreenReaderContent>Message</ScreenReaderContent>}
                                maxHeight={'33vh'}
                                height={'50px'}
                                style={{ flexGrow: 1, marginRight: '0.5rem', maxHeight: '33vh', overflowY: 'auto' }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        sendMessage();
                                    }
                                }}
                            />
                            <Button margin="xx-small" onClick={sendMessage}>
                                Send
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Chat;