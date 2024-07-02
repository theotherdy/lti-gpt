import { useState, useEffect, useRef } from 'react';

import { Alert } from '@instructure/ui-alerts';
import { Button } from '@instructure/ui-buttons';
import { ScreenReaderContent } from '@instructure/ui-a11y-content';
import { TextInput } from '@instructure/ui-text-input';
import { CustomEventSource } from './CustomEventSource';

function Chat() {
    const [message, setMessage] = useState<string>('');
    //const [responses, setResponses] = useState<string[]>([]);
    const [responses, setResponses] = useState<string>('');
    const [apiKey, setApiKey] = useState<string>('');
    const [contextTitle, setContextTitle] = useState<string>('');
    const [errors, setErrors] = useState<string[]>([]);
    const [isLlmSet, setIsLlmSet] = useState(false);
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

    /*const handleStreamData = (rawData: string) => {
        console.log('rawData: ');
        console.log(rawData);
        const lines = rawData.split("\n\n");
        console.log('lines: ');
        console.log(lines);
        const newParsedResponses: string[] = [];
    
        lines.forEach((line) => {
            if (line.trim() === "data: [DONE]") return;
    
            if (line.startsWith("data: ")) {
                const jsonString = line.substring(6); // Remove "data: " prefix
                try {
                    const json = JSON.parse(jsonString);
                    const content = json?.choices[0]?.delta?.content;
                    if (content) {
                        newParsedResponses.push(content);
                    }
                } catch (error) {
                    console.error("Failed to parse JSON:", error, "Raw data:", line);
                }
            }
        });
    
        setResponses((prev) => [...prev, ...newParsedResponses]);
    };*/
    
    
    const sendMessage = () => {
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
        }
        setResponses('');
        eventSourceRef.current = new CustomEventSource(`http://localhost/api/llm/chat?message=${encodeURIComponent(message)}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        eventSourceRef.current.addEventListener('message', (event: MessageEvent) => {
            try {
                // Check if the message is "[DONE]"
                if (event.data.trim() === "[DONE]") {
                    //console.log('Stream finished.');
                    return;
                }
                
                const parsedData = JSON.parse(event.data.trim());
                //console.log(parsedData);
        
                // Continue with your existing logic
                if (parsedData.choices && parsedData.choices[0] && parsedData.choices[0].delta) {
                    if (parsedData.choices[0].delta.content) {
                        setResponses(prevResponses => prevResponses + parsedData.choices[0].delta.content);
                        //setResponses(prevResponses => [...prevResponses, parsedData.choices[0].delta.content]);
                    } else {
                        //console.log('Delta content is empty or undefined.');
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
                if (result.status === 'success') {
                    setIsLlmSet(true);
                } //else {
                //    throw new Error('Problem getting context. You may need to relaunch this page.');
                //}
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

    return (
        <div>
            {/* Errors displayed at the top */}
            {errors.length > 0 && (
                <div>
                    {errors.map((error, index) => (
                        <Alert key={index} variant="error" margin="small">
                            {error}
                        </Alert>
                    ))}
                </div>
            )}

            {/* Conditional rendering based on contextTitle */}
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
                <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                        <TextInput
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Type your message here..."
                            renderLabel={<ScreenReaderContent>Message</ScreenReaderContent>}
                            style={{ flexGrow: 1, marginRight: '0.5rem' }}
                        />
                        <Button margin="xx-small" onClick={sendMessage}>
                            Send
                        </Button>
                    </div>
                    <div style={{ whiteSpace: 'pre-wrap', background: '#f6f6f6', padding: '1rem', borderRadius: '5px', textAlign: 'left'}}>
                        {
                        responses
                        /*responses.map((resp, index) => (
                            <div key={index}>{resp}</div>
                        ))*/
                        }
                    </div>
                </div>
            )}
        </div>
    );
}

export default Chat;