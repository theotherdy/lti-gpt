import { useState, useEffect, useRef } from 'react';

import { Alert } from '@instructure/ui-alerts';
import { Button } from '@instructure/ui-buttons';
import { ScreenReaderContent } from '@instructure/ui-a11y-content';
import { TextArea } from '@instructure/ui-text-area'
import { TextInput } from '@instructure/ui-text-input';
import { CustomEventSource } from './CustomEventSource';

interface Message {
    role: 'user' | 'assistant';
    content: string;
  }

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
        console.log('Updated messages:', messages);
        if (responseContainerRef.current) {
            responseContainerRef.current.scrollTop = responseContainerRef.current.scrollHeight;
        }
    }, [messages]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
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
    );
}

export default Chat;